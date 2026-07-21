import { Injectable } from '@nestjs/common';
import { Prisma, VoucherStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

// Hasil redeem dibedakan agar controller bisa memetakan ke status HTTP yang
// tepat (200 / 404 / 409) dengan body sesuai kontrak POS.
// Objek member yang disertakan di respons voucher agar POS bisa menulis
// saldo poin terbaru ke customers.poin (CRM tetap sumber kebenaran). Penting
// untuk order Rp0 (lunas via poin) yang tidak dikirim sebagai transaksi ke CRM,
// sehingga respons voucher jadi satu-satunya jalur sync saldo.
type PosMember = {
  name: string | null;
  memberCode: string;
  externalCustomerId: string | null;
  pointBalance: number;
};

export type RedeemResult =
  | {
      kind: 'ok';
      body: {
        ok: true;
        code: string;
        status: 'USED';
        used_at: Date;
        member: PosMember;
      };
    }
  | { kind: 'not_found' }
  | { kind: 'conflict' };

@Injectable()
export class PosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  // Validasi voucher by code untuk kasir POS. Tidak mengubah apa pun.
  // Null = tidak ditemukan (controller → 404).
  async validateVoucher(code: string) {
    const voucher = await this.prisma.voucher.findUnique({
      where: { code },
      include: { reward: true, member: true },
    });
    if (!voucher) return null;

    return {
      code: voucher.code,
      status: voucher.status,
      reward: {
        name: voucher.reward.name,
        description: voucher.reward.description,
        type: voucher.reward.type,
        value: voucher.reward.value,
        freeItemName: voucher.reward.freeItemName,
      },
      member: {
        name: voucher.member.name,
        memberCode: voucher.member.memberCode,
        externalCustomerId: voucher.member.externalCustomerId,
        pointBalance: voucher.member.pointBalance,
      },
      used_at: voucher.usedAt,
      created_at: voucher.createdAt,
    };
  }

  // Ambil saldo member by externalCustomerId (= customer.id POS) untuk jaring
  // pengaman sync saldo, mis. POS menariknya setelah order Rp0 (lunas via poin)
  // yang tidak dikirim sebagai transaksi. Null = tidak ditemukan (controller → 404).
  async getMember(externalCustomerId: string): Promise<PosMember | null> {
    return this.prisma.member.findUnique({
      where: { externalCustomerId },
      select: {
        name: true,
        memberCode: true,
        externalCustomerId: true,
        pointBalance: true,
      },
    });
  }

  // Tandai voucher USED — atomic & sekali pakai. updateMany dengan filter
  // status:ACTIVE mencegah double-redeem (race condition) tanpa transaksi
  // findUnique-lalu-update.
  async redeemVoucher(code: string): Promise<RedeemResult> {
    const usedAt = new Date();
    const result = await this.prisma.voucher.updateMany({
      where: { code, status: VoucherStatus.ACTIVE },
      data: { status: VoucherStatus.USED, usedAt },
    });

    if (result.count === 0) {
      // Bedakan "tidak ada" (404) vs "ada tapi tidak ACTIVE" (409).
      const exists = await this.prisma.voucher.findUnique({
        where: { code },
        select: { id: true },
      });
      return exists ? { kind: 'conflict' } : { kind: 'not_found' };
    }

    // Ambil voucher (beserta member & reward) sekali untuk dipakai bersama:
    // (1) menyertakan member di respons agar POS bisa sync saldo poin, dan
    // (2) push realtime ke app customer pemiliknya.
    const voucher = await this.prisma.voucher.findUnique({
      where: { code },
      include: {
        member: true,
        reward: {
          select: {
            name: true,
            imageUrl: true,
            type: true,
            value: true,
            minPurchase: true,
            freeItemName: true,
            description: true,
            isBirthdayGift: true,
          },
        },
      },
    });

    // Push realtime ke app customer agar kartu voucher langsung berubah jadi
    // "Digunakan" tanpa perlu refresh. Best-effort: gagal notif tidak boleh
    // membatalkan redeem yang sudah sukses.
    this.notifyVoucherUsed(voucher);

    return {
      kind: 'ok',
      body: {
        ok: true,
        code,
        status: 'USED',
        used_at: usedAt,
        member: {
          name: voucher!.member.name,
          memberCode: voucher!.member.memberCode,
          externalCustomerId: voucher!.member.externalCustomerId,
          pointBalance: voucher!.member.pointBalance,
        },
      },
    };
  }

  // Emit perubahan status voucher ke room user pemiliknya. Best-effort:
  // kegagalan notif tidak boleh membatalkan redeem yang sudah sukses.
  private notifyVoucherUsed(
    voucher: Prisma.VoucherGetPayload<{
      include: {
        member: true;
        reward: {
          select: {
            name: true;
            imageUrl: true;
            type: true;
            value: true;
            minPurchase: true;
            freeItemName: true;
            description: true;
            isBirthdayGift: true;
          };
        };
      };
    }> | null,
  ) {
    try {
      const userId = voucher?.member.userId;
      if (!voucher || !userId) return;

      this.realtime.emitVoucherUpdated(userId, {
        id: voucher.id,
        code: voucher.code,
        status: voucher.status,
        expiredAt: voucher.expiredAt,
        usedAt: voucher.usedAt,
        createdAt: voucher.createdAt,
        reward: {
          name: voucher.reward.name,
          imageUrl: voucher.reward.imageUrl,
          type: voucher.reward.type,
          value: voucher.reward.value,
          minPurchase: voucher.reward.minPurchase,
          freeItemName: voucher.reward.freeItemName,
          description: voucher.reward.description,
          isBirthdayGift: voucher.reward.isBirthdayGift,
        },
      });
    } catch {
      // abaikan — notifikasi realtime bersifat best-effort
    }
  }
}
