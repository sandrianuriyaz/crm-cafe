import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RewardStatus, RewardType, VoucherStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { generateVoucherCode } from '../common/voucher-code.util';
import { CreateRewardDto } from './dto/create-reward.dto';
import { ListRewardsQueryDto } from './dto/list-rewards-query.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { BirthdayService } from '../birthday/birthday.service';

// Berapa lama voucher berlaku sejak dibuat (hari).
const VOUCHER_VALID_DAYS = 30;

@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly birthday: BirthdayService,
  ) {}

  // ── Katalog (customer) ────────────────────────────────────────────────────
  // Reward tayang = status ACTIVE & sekarang dalam rentang startAt–endAt
  // (null = tak dibatasi di sisi itu). Sejalan dengan PromosService.listActive.
  // Tampilkan stok agar UI bisa tandai habis.
  listActive() {
    const now = new Date();
    return this.prisma.reward.findMany({
      where: {
        status: RewardStatus.ACTIVE,
        // Hadiah ulang tahun bukan barang katalog — poinnya 0, kalau tampil
        // semua member bisa mengklaimnya gratis kapan saja.
        isBirthdayGift: false,
        AND: [
          { OR: [{ startAt: null }, { startAt: { lte: now } }] },
          { OR: [{ endAt: null }, { endAt: { gte: now } }] },
        ],
      },
      orderBy: { pointCost: 'asc' },
    });
  }

  async getOne(id: string) {
    const reward = await this.prisma.reward.findUnique({ where: { id } });
    if (!reward) throw new NotFoundException('Reward tidak ditemukan');
    return reward;
  }

  // ── CRUD (admin) ────────────────────────────────────────────────────────
  async create(dto: CreateRewardDto) {
    const { outletIds, notify, ...rest } = dto;
    RewardsService.assertValidDiscount(
      dto.type ?? RewardType.MANUAL,
      dto.value,
    );
    const reward = await this.prisma.reward.create({
      data: {
        ...RewardsService.withDates(rest),
        outlets: outletIds?.length
          ? { create: outletIds.map((outletId) => ({ outletId })) }
          : undefined,
      },
    });
    await this.announceIfReleased(reward, notify);
    return reward;
  }

  // Diskon persen wajib 1–100. Tidak bisa divalidasi di DTO karena saat PATCH
  // `type` boleh tidak ikut dikirim — nilai efektifnya baru ketahuan setelah
  // digabung dengan data lama, jadi pemeriksaannya di sini.
  private static assertValidDiscount(
    type: RewardType,
    value: number | null | undefined,
  ) {
    if (type !== RewardType.DISCOUNT_PERCENT) return;
    if (value === null || value === undefined) {
      throw new BadRequestException('Nilai diskon persen wajib diisi');
    }
    if (value < 1 || value > 100) {
      throw new BadRequestException('Diskon persen harus antara 1 dan 100');
    }
  }

  // Tanggal datang sebagai string ISO dari DTO → Date untuk Prisma. Field yang
  // tidak dikirim tetap undefined (tidak diubah); null berarti hapus batasan.
  private static withDates<T extends { startAt?: string | null; endAt?: string | null }>(
    dto: T,
  ) {
    const toDate = (v: string | null | undefined) =>
      v === undefined ? undefined : v === null ? null : new Date(v);
    return {
      ...dto,
      startAt: toDate(dto.startAt),
      endAt: toDate(dto.endAt),
    };
  }

  // Reward sedang tayang ke member? Dipakai untuk memutuskan apakah notifikasi
  // "reward baru" layak dikirim — percuma mengabarkan sesuatu yang belum/tidak
  // muncul di katalog.
  private static isLive(reward: {
    status: RewardStatus;
    startAt: Date | null;
    endAt: Date | null;
  }): boolean {
    if (reward.status !== RewardStatus.ACTIVE) return false;
    const now = Date.now();
    if (reward.startAt && reward.startAt.getTime() > now) return false;
    if (reward.endAt && reward.endAt.getTime() < now) return false;
    return true;
  }

  // Reward baru terbit ke member → kirim notifikasi inbox + realtime.
  // Best-effort: kegagalan notifikasi tidak boleh menggagalkan simpan reward,
  // karena rewardnya sendiri sudah tersimpan saat ini dipanggil.
  private async announceIfReleased(
    reward: {
      name: string;
      pointCost: number;
      imageUrl: string | null;
      status: RewardStatus;
      startAt: Date | null;
      endAt: Date | null;
    },
    notify: boolean | undefined,
  ) {
    if (notify === false) return;
    // Reward berjadwal mundur tidak dinotifikasi sekarang. Belum ada scheduler,
    // jadi notifikasi menyusul saat startAt tiba juga belum ada — admin perlu
    // broadcast manual bila ingin mengabarkannya.
    if (!RewardsService.isLive(reward)) return;
    try {
      await this.notifications.notifyNewReward(reward);
    } catch (err) {
      this.logger.error(
        `Gagal kirim notifikasi reward "${reward.name}"`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  // Cari (nama/deskripsi) + filter status/tipe + paginated. outlets di-include
  // agar form edit admin tahu tag outlet yang sudah dipilih tanpa fetch tambahan.
  async listAll(q: ListRewardsQueryDto) {
    const skip = q.skip ?? 0;
    const take = q.take ?? 20;
    // Reward cermin hadiah ulang tahun dikelola di menu tersendiri — jangan
    // tampilkan di daftar reward admin agar tidak diedit/dihapus dari sini.
    const conditions: Prisma.RewardWhereInput[] = [{ isBirthdayGift: false }];
    if (q.search) {
      conditions.push({
        OR: [
          { name: { contains: q.search, mode: 'insensitive' } },
          { description: { contains: q.search, mode: 'insensitive' } },
        ],
      });
    }
    if (q.status) conditions.push({ status: q.status });
    if (q.type) conditions.push({ type: q.type });
    const where: Prisma.RewardWhereInput = conditions.length
      ? { AND: conditions }
      : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.reward.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { outlets: { include: { outlet: { select: { id: true, name: true } } } } },
      }),
      this.prisma.reward.count({ where }),
    ]);
    return { total, skip, take, items };
  }

  // outletIds tidak dikirim (undefined) → tag outlet tidak diubah.
  // outletIds dikirim (termasuk []) → ganti seluruh tag jadi daftar ini.
  async update(id: string, dto: UpdateRewardDto) {
    const before = await this.getOne(id);
    const { outletIds, notify, ...rest } = dto;
    // Field yang tidak dikirim tetap memakai nilai lama.
    RewardsService.assertValidDiscount(
      dto.type ?? before.type,
      dto.value !== undefined ? dto.value : before.value,
    );
    const reward = await this.prisma.$transaction(async (tx) => {
      if (outletIds !== undefined) {
        await tx.rewardOutlet.deleteMany({ where: { rewardId: id } });
        if (outletIds.length) {
          await tx.rewardOutlet.createMany({
            data: outletIds.map((outletId) => ({ rewardId: id, outletId })),
          });
        }
      }
      return tx.reward.update({
        where: { id },
        data: RewardsService.withDates(rest),
      });
    });

    // Hanya transisi "belum tayang" → "tayang" yang dianggap rilis. Edit reward
    // yang sudah tayang tidak mengirim notifikasi ulang.
    if (!RewardsService.isLive(before)) {
      await this.announceIfReleased(reward, notify);
    }
    return reward;
  }

  async remove(id: string) {
    await this.getOne(id);
    // Soft-delete: nonaktifkan agar histori voucher/redeem tetap utuh.
    return this.prisma.reward.update({
      where: { id },
      data: { status: RewardStatus.INACTIVE },
    });
  }

  // ── Redeem (customer) ──────────────────────────────────────────────────────
  // Tukar poin → voucher. Dalam 1 transaksi DB: validasi saldo & stok,
  // kurangi poin (+ ledger), kurangi stok, buat voucher & catat redeem.
  async redeem(userId: string, rewardId: string) {
    return this.prisma.$transaction(async (tx) => {
      const member = await tx.member.findUnique({ where: { userId } });
      if (!member) {
        throw new NotFoundException('Member tidak ditemukan untuk akun ini');
      }

      const reward = await tx.reward.findUnique({ where: { id: rewardId } });
      if (!reward) throw new NotFoundException('Reward tidak ditemukan');
      if (reward.status !== RewardStatus.ACTIVE) {
        throw new BadRequestException('Reward tidak aktif');
      }
      // Cegah redeem dari halaman yang terlanjur terbuka sebelum/sesudah
      // periode tayang — katalog sudah menyembunyikannya, ini penjaga server.
      if (!RewardsService.isLive(reward)) {
        throw new BadRequestException('Reward sedang tidak berlaku');
      }
      if (reward.stock <= 0) {
        throw new BadRequestException('Stok reward habis');
      }
      if (member.pointBalance < reward.pointCost) {
        throw new BadRequestException('Saldo poin tidak cukup');
      }

      const balanceAfter = member.pointBalance - reward.pointCost;

      await tx.member.update({
        where: { id: member.id },
        data: { pointBalance: balanceAfter },
      });

      await tx.reward.update({
        where: { id: reward.id },
        data: { stock: { decrement: 1 } },
      });

      const expiredAt = new Date(
        Date.now() + VOUCHER_VALID_DAYS * 24 * 60 * 60 * 1000,
      );
      const voucher = await tx.voucher.create({
        data: {
          code: generateVoucherCode(),
          rewardId: reward.id,
          memberId: member.id,
          status: VoucherStatus.ACTIVE,
          expiredAt,
        },
      });

      const redeem = await tx.redeem.create({
        data: {
          memberId: member.id,
          rewardId: reward.id,
          voucherId: voucher.id,
          pointsSpent: reward.pointCost,
        },
      });

      await tx.pointHistory.create({
        data: {
          memberId: member.id,
          type: 'redeem',
          points: -reward.pointCost,
          balanceAfter,
          referenceType: 'redeem',
          referenceId: redeem.id,
          note: `Redeem ${reward.name}`,
        },
      });

      return {
        voucher: {
          id: voucher.id,
          code: voucher.code,
          status: voucher.status,
          expiredAt: voucher.expiredAt,
          reward: { id: reward.id, name: reward.name },
        },
        pointsSpent: reward.pointCost,
        pointBalance: balanceAfter,
      };
    });
  }

  // ── Voucher & histori redeem milik member login ─────────────────────────
  async listVouchers(userId: string) {
    const member = await this.getMemberOrThrow(userId);
    // Hadiah ulang tahun terbit saat member membuka aplikasi, tidak menunggu
    // cron pagi. Hampir selalu no-op (cek tanggal di memori). Best-effort:
    // gagal memberi hadiah tidak boleh menggagalkan tampilan daftar voucher.
    await this.birthday.ensureForMember(member).catch((err) => {
      this.logger.error(
        `Cek hadiah ulang tahun gagal untuk ${member.memberCode}: ` +
          (err instanceof Error ? err.message : String(err)),
      );
    });
    return this.prisma.voucher.findMany({
      where: { memberId: member.id },
      orderBy: { createdAt: 'desc' },
      // type, value & minPurchase ikut agar app bisa menampilkan besaran diskon
      // dan syarat minimal belanja di kartu voucher, bukan sekadar nama reward.
      include: {
        reward: {
          select: {
            name: true,
            imageUrl: true,
            type: true,
            value: true,
            minPurchase: true,
            freeItemName: true,
            description: true,
          },
        },
      },
    });
  }

  async listRedeems(userId: string) {
    const member = await this.getMemberOrThrow(userId);
    return this.prisma.redeem.findMany({
      where: { memberId: member.id },
      orderBy: { createdAt: 'desc' },
      include: {
        reward: { select: { name: true } },
        voucher: { select: { code: true, status: true } },
      },
    });
  }

  private async getMemberOrThrow(userId: string) {
    const member = await this.prisma.member.findUnique({ where: { userId } });
    if (!member) {
      throw new NotFoundException('Member tidak ditemukan untuk akun ini');
    }
    return member;
  }
}
