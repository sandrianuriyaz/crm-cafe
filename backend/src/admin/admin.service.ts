import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, VoucherStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdjustPointsDto } from './dto/adjust-points.dto';
import { ListMembersQueryDto } from './dto/list-members-query.dto';
import {
  ListVouchersQueryDto,
  ListWebhooksQueryDto,
} from './dto/list-webhooks-query.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // Daftar member dengan pencarian (nama/phone/kode/email) + pagination.
  async listMembers(q: ListMembersQueryDto) {
    const skip = q.skip ?? 0;
    const take = q.take ?? 20;
    const where: Prisma.MemberWhereInput = q.search
      ? {
          OR: [
            { name: { contains: q.search, mode: 'insensitive' } },
            { phone: { contains: q.search, mode: 'insensitive' } },
            { memberCode: { contains: q.search, mode: 'insensitive' } },
            { user: { email: { contains: q.search, mode: 'insensitive' } } },
          ],
        }
      : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.member.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          memberCode: true,
          name: true,
          phone: true,
          pointBalance: true,
          externalCustomerId: true,
          createdAt: true,
          user: { select: { email: true } },
        },
      }),
      this.prisma.member.count({ where }),
    ]);
    return { total, skip, take, items };
  }

  async getMember(id: string) {
    const member = await this.prisma.member.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, role: true } },
        tier: { select: { name: true } },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            posOrderNumber: true,
            grandTotal: true,
            pointsAwarded: true,
            createdAt: true,
          },
        },
        pointHistories: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!member) throw new NotFoundException('Member tidak ditemukan');
    return member;
  }

  // Penyesuaian poin manual oleh admin (audit di ledger). Saldo tidak boleh negatif.
  async adjustPoints(memberId: string, dto: AdjustPointsDto) {
    return this.prisma.$transaction(async (tx) => {
      const member = await tx.member.findUnique({ where: { id: memberId } });
      if (!member) throw new NotFoundException('Member tidak ditemukan');

      const balanceAfter = member.pointBalance + dto.points;
      if (balanceAfter < 0) {
        throw new BadRequestException('Saldo poin tidak boleh negatif');
      }

      await tx.member.update({
        where: { id: member.id },
        data: { pointBalance: balanceAfter },
      });

      const history = await tx.pointHistory.create({
        data: {
          memberId: member.id,
          type: 'adjust',
          points: dto.points,
          balanceAfter,
          referenceType: 'adjustment',
          note: dto.reason,
        },
      });

      return {
        memberId: member.id,
        points: dto.points,
        pointBalance: balanceAfter,
        historyId: history.id,
      };
    });
  }

  // Audit semua transaksi POS yang masuk.
  async listTransactions(skip = 0, take = 20) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          posOrderNumber: true,
          memberId: true,
          grandTotal: true,
          pointsAwarded: true,
          paymentMethod: true,
          storeId: true,
          occurredAt: true,
          createdAt: true,
        },
      }),
      this.prisma.transaction.count(),
    ]);
    return { total, skip, take, items };
  }

  // ── Vouchers (lintas member) ────────────────────────────────────────────
  async listVouchers(q: ListVouchersQueryDto) {
    const skip = q.skip ?? 0;
    const take = q.take ?? 20;
    const where: Prisma.VoucherWhereInput = q.status
      ? { status: q.status as VoucherStatus }
      : {};

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.voucher.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          code: true,
          status: true,
          expiredAt: true,
          usedAt: true,
          createdAt: true,
          member: { select: { name: true } },
          reward: { select: { name: true } },
        },
      }),
      this.prisma.voucher.count({ where }),
    ]);

    const items = rows.map((v) => ({
      id: v.id,
      code: v.code,
      memberName: v.member?.name ?? null,
      reward: v.reward?.name ?? null,
      status: v.status,
      expiredAt: v.expiredAt,
      usedAt: v.usedAt,
      createdAt: v.createdAt,
    }));
    return { total, skip, take, items };
  }

  // Tandai voucher terpakai. Hanya boleh dari status ACTIVE.
  async markVoucherUsed(id: string) {
    const voucher = await this.prisma.voucher.findUnique({ where: { id } });
    if (!voucher) throw new NotFoundException('Voucher tidak ditemukan');
    if (voucher.status !== VoucherStatus.ACTIVE) {
      throw new BadRequestException(
        `Voucher tidak bisa ditandai USED dari status ${voucher.status}`,
      );
    }
    return this.prisma.voucher.update({
      where: { id },
      data: { status: VoucherStatus.USED, usedAt: new Date() },
      select: { id: true, code: true, status: true, usedAt: true },
    });
  }

  // ── Riwayat redeem semua member ─────────────────────────────────────────
  async listRedeems(skip = 0, take = 20) {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.redeem.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          pointsSpent: true,
          createdAt: true,
          member: { select: { name: true } },
          reward: { select: { name: true } },
          voucher: { select: { code: true } },
        },
      }),
      this.prisma.redeem.count(),
    ]);

    const items = rows.map((r) => ({
      id: r.id,
      memberName: r.member?.name ?? null,
      reward: r.reward?.name ?? null,
      pointsSpent: r.pointsSpent,
      voucherCode: r.voucher?.code ?? null,
      createdAt: r.createdAt,
    }));
    return { total, skip, take, items };
  }

  // ── Webhook inbox (log event POS) ───────────────────────────────────────
  async listWebhooks(q: ListWebhooksQueryDto) {
    const skip = q.skip ?? 0;
    const take = q.take ?? 20;
    const where: Prisma.PosSyncLogWhereInput = {};
    if (q.status) where.status = q.status;
    if (q.from || q.to) {
      where.createdAt = {};
      if (q.from) where.createdAt.gte = new Date(q.from);
      if (q.to) where.createdAt.lte = new Date(q.to);
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.posSyncLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          eventId: true,
          idempotencyKey: true,
          status: true,
          errorMessage: true,
          createdAt: true,
        },
      }),
      this.prisma.posSyncLog.count({ where }),
    ]);
    return { total, skip, take, items };
  }

  // ── Audit idempotency key (dari transaksi yang tercatat) ────────────────
  async listIdempotencyKeys(skip = 0, take = 20) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          idempotencyKey: true,
          posOrderId: true,
          posOrderNumber: true,
          memberId: true,
          pointsAwarded: true,
          createdAt: true,
        },
      }),
      this.prisma.transaction.count(),
    ]);
    return { total, skip, take, items };
  }

  // ── Ringkasan sinkronisasi POS per storeId ──────────────────────────────
  // Catatan: "per outlet" sebenarnya butuh model Outlet (Batch B). Sementara
  // dikelompokkan per storeId dari transaksi.
  async posSyncSummary() {
    const grouped = await this.prisma.transaction.groupBy({
      by: ['storeId'],
      _count: { _all: true },
      _max: { occurredAt: true, createdAt: true },
      orderBy: { _max: { createdAt: 'desc' } },
    });

    const items = grouped.map((g) => ({
      storeId: g.storeId,
      transactionCount: g._count._all,
      lastOccurredAt: g._max.occurredAt,
      lastCreatedAt: g._max.createdAt,
    }));
    return { items };
  }
}
