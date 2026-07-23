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
  | { kind: 'conflict' }
  // Belanja belum mencapai syarat minimum reward. Dibedakan dari 'conflict'
  // supaya kasir dapat pesan yang benar ("belanja kurang"), bukan "voucher
  // sudah dipakai".
  | { kind: 'below_minimum'; minPurchase: number; subtotal: number };

@Injectable()
export class PosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  // Validasi voucher by code untuk kasir POS. Tidak mengubah apa pun.
  // Null = tidak ditemukan (controller → 404).
  //
  // `subtotal` (opsional) = total belanja sebelum diskon & pajak, sesuai arti
  // `subtotal` di kontrak webhook §5. Bila dikirim, respons ikut memberi tahu
  // apakah voucher boleh dipakai untuk keranjang sebesar itu.
  async validateVoucher(code: string, subtotal?: number) {
    const voucher = await this.prisma.voucher.findUnique({
      where: { code },
      include: { reward: true, member: true },
    });
    if (!voucher) return null;

    const minPurchase = voucher.reward.minPurchase;
    const belowMinimum =
      subtotal !== undefined && minPurchase != null && subtotal < minPurchase;

    return {
      code: voucher.code,
      status: voucher.status,
      reward: {
        name: voucher.reward.name,
        description: voucher.reward.description,
        type: voucher.reward.type,
        value: voucher.reward.value,
        // Tanpa field ini POS tidak punya cara tahu ada syarat minimum sama
        // sekali, sehingga voucher diskon tetap bisa dipasang di keranjang
        // yang belum memenuhi syarat.
        minPurchase,
        freeItemName: voucher.reward.freeItemName,
      },
      member: {
        name: voucher.member.name,
        memberCode: voucher.member.memberCode,
        externalCustomerId: voucher.member.externalCustomerId,
        pointBalance: voucher.member.pointBalance,
      },
      // Kesimpulan siap pakai untuk kasir. `null` = POS tidak mengirim subtotal,
      // jadi CRM tidak bisa menilai (bukan berarti lolos).
      eligible: subtotal === undefined ? null : voucher.status === 'ACTIVE' && !belowMinimum,
      used_at: voucher.usedAt,
      created_at: voucher.createdAt,
    };
  }

  // Ambil saldo member by customer.id POS untuk jaring pengaman sync saldo,
  // mis. POS menariknya setelah order Rp0 (lunas via poin) yang tidak dikirim
  // sebagai transaksi. Null = tidak ditemukan (controller → 404).
  //
  // Terima dua bentuk id: memberCode terbitan CRM (isi QR member, jalur normal
  // Opsi A) dan externalCustomerId (id internal POS). Sebelumnya hanya
  // externalCustomerId — yang tidak pernah cocok untuk pelanggan hasil scan QR,
  // jadi endpoint ini selalu balas 404.
  async getMember(customerId: string): Promise<PosMember | null> {
    return this.prisma.member.findFirst({
      where: {
        OR: [{ memberCode: customerId }, { externalCustomerId: customerId }],
      },
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
  //
  // `subtotal` opsional: bila POS mengirimnya, syarat minimum belanja
  // ditegakkan di sini. Dicek SEBELUM updateMany supaya voucher yang ditolak
  // tidak terlanjur tertandai USED.
  async redeemVoucher(code: string, subtotal?: number): Promise<RedeemResult> {
    if (subtotal !== undefined) {
      const target = await this.prisma.voucher.findUnique({
        where: { code },
        select: { reward: { select: { minPurchase: true } } },
      });
      const min = target?.reward.minPurchase;
      if (min != null && subtotal < min) {
        return { kind: 'below_minimum', minPurchase: min, subtotal };
      }
    }

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
