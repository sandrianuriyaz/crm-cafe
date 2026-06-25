import { Injectable } from '@nestjs/common';
import { VoucherStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

// Hasil redeem dibedakan agar controller bisa memetakan ke status HTTP yang
// tepat (200 / 404 / 409) dengan body sesuai kontrak POS.
export type RedeemResult =
  | {
      kind: 'ok';
      body: { ok: true; code: string; status: 'USED'; used_at: Date };
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

    // Push realtime ke app customer agar kartu voucher langsung berubah jadi
    // "Digunakan" tanpa perlu refresh. Best-effort: gagal notif tidak boleh
    // membatalkan redeem yang sudah sukses.
    await this.notifyVoucherUsed(code);

    return {
      kind: 'ok',
      body: { ok: true, code, status: 'USED', used_at: usedAt },
    };
  }

  // Ambil voucher (beserta pemilik & reward) lalu emit ke room user pemiliknya.
  private async notifyVoucherUsed(code: string) {
    try {
      const voucher = await this.prisma.voucher.findUnique({
        where: { code },
        include: {
          member: { select: { userId: true } },
          reward: { select: { name: true, imageUrl: true } },
        },
      });
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
        },
      });
    } catch {
      // abaikan — notifikasi realtime bersifat best-effort
    }
  }
}
