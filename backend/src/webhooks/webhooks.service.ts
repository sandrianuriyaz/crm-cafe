import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PosTransactionEventDto } from './dto/pos-transaction.dto';

export interface WebhookResult {
  ok: true;
  duplicate: boolean;
  customer_crm_id: string | null;
  points_awarded: number;
  points_balance: number | null;
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // Orkestrasi: idempotency → upsert pelanggan → catat transaksi → award poin.
  // Semua perubahan saldo dijalankan dalam 1 DB transaction agar konsisten.
  async handleTransactionCompleted(
    dto: PosTransactionEventDto,
    rawBody: unknown,
  ): Promise<WebhookResult> {
    const idempotencyKey = dto.idempotency_key ?? dto.transaction.order_id;

    // ── Checklist 3: idempotency ──────────────────────────────────────────
    // Dedup by idempotency_key. Kalau sudah pernah diproses → no-op (200).
    const existing = await this.prisma.transaction.findUnique({
      where: { idempotencyKey },
      include: { member: true },
    });
    if (existing) {
      this.logger.log(`Duplicate event ${idempotencyKey} → no-op`);
      await this.logSync(dto, 'duplicate', null);
      return {
        ok: true,
        duplicate: true,
        customer_crm_id: existing.memberId,
        points_awarded: existing.pointsAwarded,
        points_balance: existing.member?.pointBalance ?? null,
      };
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // ── Checklist 4: upsert pelanggan ──────────────────────────────────
        const member = await this.upsertMember(tx, dto);

        // ── Checklist 6: hitung poin (member saja; walk-in anonim → 0) ─────
        const pointsAwarded = member
          ? this.calculatePoints(dto.transaction.grand_total)
          : 0;

        // ── Checklist 5: catat transaksi + item (parsed) + raw payload ─────
        const t = dto.transaction;
        const transaction = await tx.transaction.create({
          data: {
            posOrderId: t.order_id,
            posOrderNumber: t.order_number ?? null,
            idempotencyKey,
            eventId: dto.event_id ?? null,
            memberId: member?.id ?? null,
            storeId: dto.store_id ?? null,
            branchId: dto.branch_id ?? null,
            orderType: t.order_type ?? null,
            status: t.status ?? null,
            cashierId: t.cashier_id ?? null,
            currency: t.currency ?? 'IDR',
            subtotal: t.subtotal ?? 0,
            discountTotal: t.discount_total ?? 0,
            taxTotal: t.tax_total ?? 0,
            taxInclusive: t.tax_inclusive ?? true,
            grandTotal: t.grand_total,
            paymentMethod: t.payment_method ?? null,
            pointsUsed: t.points_used ?? 0,
            pointsDiscountRupiah: t.points_discount_rupiah ?? 0,
            pointsAwarded,
            occurredAt: dto.occurred_at ? new Date(dto.occurred_at) : null,
            rawPayload: rawBody as Prisma.InputJsonValue,
            items: {
              create: (t.items ?? []).map((it) => ({
                productId: it.product_id ?? null,
                name: it.name,
                qty: it.qty,
                unitPrice: it.unit_price,
                variant: it.variant ?? null,
                addons: it.addons ?? [],
                notes: it.notes ?? null,
                isReward: it.is_reward ?? false,
                lineTotal: it.line_total,
              })),
            },
          },
        });

        // ── Checklist 6: award poin + ledger + saldo ───────────────────────
        let balance: number | null = member?.pointBalance ?? null;
        if (member && pointsAwarded > 0) {
          balance = member.pointBalance + pointsAwarded;
          await tx.member.update({
            where: { id: member.id },
            data: { pointBalance: balance },
          });
          await tx.pointHistory.create({
            data: {
              memberId: member.id,
              type: 'earn',
              points: pointsAwarded,
              balanceAfter: balance,
              referenceType: 'transaction',
              referenceId: transaction.id,
              note: `Earning order ${t.order_number ?? t.order_id}`,
            },
          });
        }

        return {
          memberId: member?.id ?? null,
          pointsAwarded,
          balance,
        };
      });

      await this.logSync(dto, 'processed', null);
      return {
        ok: true,
        duplicate: false,
        customer_crm_id: result.memberId,
        points_awarded: result.pointsAwarded,
        points_balance: result.balance,
      };
    } catch (err) {
      // Race: dua pengiriman bersamaan untuk key sama → unique violation.
      // Perlakukan sebagai duplikat (idempoten), balas no-op.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        this.logger.warn(`Concurrent duplicate ${idempotencyKey} → no-op`);
        await this.logSync(dto, 'duplicate', null);
        return {
          ok: true,
          duplicate: true,
          customer_crm_id: null,
          points_awarded: 0,
          points_balance: null,
        };
      }
      await this.logSync(dto, 'error', (err as Error).message);
      throw err;
    }
  }

  // §8: poin = floor(grand_total / POIN_PER_RUPIAH). Earning dari grand_total (§11 #3).
  private calculatePoints(grandTotal: number): number {
    const per = this.config.get<number>('POIN_PER_RUPIAH') ?? 1000;
    if (grandTotal <= 0) return 0;
    return Math.floor(grandTotal / per);
  }

  // Opsi A (CRM yang punya id): customer.id = memberCode terbitan CRM yang
  // di-echo POS. Cocokkan ke memberCode (utama) → phone (cadangan). Walk-in
  // anonim (id+phone null) → null (transaksi tetap dicatat tanpa member/poin).
  // Lihat docs/usulan-kepemilikan-id-customer.md.
  private async upsertMember(
    tx: Prisma.TransactionClient,
    dto: PosTransactionEventDto,
  ) {
    const c = dto.customer ?? {};
    const crmId = c.id || null; // = memberCode milik CRM
    const phone = c.phone || null;
    const name = c.name && c.name !== 'Pelanggan Umum' ? c.name : null;

    if (!crmId && !phone) {
      return null; // guest anonim
    }

    // Cari existing: prioritas memberCode (id CRM), lalu phone.
    const member =
      (crmId
        ? await tx.member.findUnique({ where: { memberCode: crmId } })
        : null) ??
      (phone ? await tx.member.findUnique({ where: { phone } }) : null);

    if (member) {
      // Lengkapi field yang masih kosong.
      return tx.member.update({
        where: { id: member.id },
        data: {
          phone: member.phone ?? phone,
          name: member.name ?? name,
        },
      });
    }

    // Tidak ditemukan → walk-in baru; CRM terbitkan memberCode baru.
    // (customer.id tak dikenal diabaikan; identitas pakai phone bila ada.)
    return tx.member.create({
      data: {
        memberCode: this.generateMemberCode(),
        phone,
        name,
      },
    });
  }

  private generateMemberCode(): string {
    return 'MBR-' + randomBytes(5).toString('hex').toUpperCase();
  }

  private async logSync(
    dto: PosTransactionEventDto,
    status: string,
    errorMessage: string | null,
  ): Promise<void> {
    try {
      await this.prisma.posSyncLog.create({
        data: {
          eventId: dto.event_id ?? null,
          idempotencyKey: dto.idempotency_key ?? dto.transaction?.order_id ?? '',
          status,
          errorMessage,
          rawPayload: dto as unknown as Prisma.InputJsonValue,
        },
      });
    } catch (e) {
      // Audit log tidak boleh menggagalkan pemrosesan utama.
      this.logger.error(`Failed to write PosSyncLog: ${(e as Error).message}`);
    }
  }
}
