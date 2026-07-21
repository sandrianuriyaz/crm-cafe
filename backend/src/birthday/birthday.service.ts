import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  BirthdayConfig,
  Prisma,
  RewardStatus,
  RewardType,
  VoucherStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { generateVoucherCode } from '../common/voucher-code.util';
import { UpdateBirthdayConfigDto } from './dto/update-birthday-config.dto';

const SINGLETON_ID = 'singleton';

export interface BirthdayRunResult {
  granted: number;
  skipped: number;
  candidates: number;
  reason?: string;
}

@Injectable()
export class BirthdayService {
  private readonly logger = new Logger(BirthdayService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // ── Pengaturan (admin) ────────────────────────────────────────────────────
  getConfig() {
    return this.prisma.birthdayConfig.upsert({
      where: { id: SINGLETON_ID },
      update: {},
      create: { id: SINGLETON_ID },
    });
  }

  async updateConfig(dto: UpdateBirthdayConfigDto) {
    const current = await this.getConfig();
    const next = { ...current, ...dto };

    BirthdayService.assertValidGift(next);

    const config = await this.prisma.birthdayConfig.update({
      where: { id: SINGLETON_ID },
      data: dto,
    });
    // Definisi hadiah dicerminkan ke baris Reward tersembunyi supaya Voucher
    // (yang wajib menunjuk Reward) tetap sah dan kartu voucher di app bisa
    // menampilkan besaran diskonnya.
    return this.syncHiddenReward(config);
  }

  private static assertValidGift(c: {
    name: string;
    type: RewardType;
    value: number | null;
    freeItemName: string | null;
  }) {
    if (c.type === RewardType.DISCOUNT_PERCENT) {
      if (c.value === null || c.value < 1 || c.value > 100) {
        throw new BadRequestException('Diskon persen harus antara 1 dan 100');
      }
    }
    if (c.type === RewardType.DISCOUNT_AMOUNT) {
      if (c.value === null || c.value < 1) {
        throw new BadRequestException('Nilai diskon rupiah wajib diisi');
      }
    }
    if (c.type === RewardType.FREE_ITEM && !c.freeItemName?.trim()) {
      throw new BadRequestException('Nama item gratis wajib diisi');
    }
  }

  // Reward cermin selalu INACTIVE + isBirthdayGift: tidak pernah muncul di
  // katalog member maupun daftar reward admin, dan tidak bisa ditukar poin.
  private async syncHiddenReward(config: BirthdayConfig) {
    const data = {
      name: config.name,
      description: config.description,
      imageUrl: config.imageUrl,
      type: config.type,
      value: config.value,
      minPurchase: config.minPurchase,
      freeItemName: config.freeItemName,
      pointCost: 0,
      stock: 0,
      status: RewardStatus.INACTIVE,
      isBirthdayGift: true,
    };

    if (config.rewardId) {
      await this.prisma.reward.update({ where: { id: config.rewardId }, data });
      return config;
    }
    const reward = await this.prisma.reward.create({ data });
    return this.prisma.birthdayConfig.update({
      where: { id: SINGLETON_ID },
      data: { rewardId: reward.id },
    });
  }

  // ── Penjadwal ─────────────────────────────────────────────────────────────
  // Cron hanya menyala sekali sehari. Bila server sedang mati saat itu — deploy,
  // restart, atau fitur baru dinyalakan setelah lewat jam 07:00 — hari itu
  // terlewat tanpa penyusul. Jalankan sekali saat boot sebagai jaring pengaman.
  async onModuleInit() {
    const res = await this.run().catch((err) => {
      this.logger.error(
        `Penyusulan saat boot gagal: ${err instanceof Error ? err.message : err}`,
      );
      return null;
    });
    if (res?.granted) {
      this.logger.log(`Penyusulan saat boot: ${res.granted} voucher terbit.`);
    }
  }

  // Tiap hari 07:00 waktu server. Idempoten: BirthdayGrant unik per
  // (member, tahun), jadi menjalankannya ulang tidak menerbitkan voucher kedua.
  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async handleDailyRun() {
    const res = await this.run();
    if (res.granted > 0 || res.skipped > 0) {
      this.logger.log(
        `Hadiah ulang tahun: ${res.granted} terbit, ${res.skipped} dilewati ` +
          `dari ${res.candidates} kandidat.`,
      );
    }
  }

  // Dipisah dari cron agar admin bisa memicunya manual — server yang mati saat
  // jadwal berjalan akan melewatkan hari itu tanpa cara memperbaikinya.
  async run(now = new Date()): Promise<BirthdayRunResult> {
    const config = await this.prisma.birthdayConfig.findUnique({
      where: { id: SINGLETON_ID },
    });
    if (!config?.enabled) {
      return { granted: 0, skipped: 0, candidates: 0, reason: 'nonaktif' };
    }
    if (!config.rewardId) {
      return {
        granted: 0,
        skipped: 0,
        candidates: 0,
        reason: 'hadiah belum disimpan',
      };
    }

    const members = await this.findBirthdayMembers(now);
    const year = now.getUTCFullYear();
    const expiredAt = new Date(
      now.getTime() + config.voucherValidDays * 24 * 60 * 60 * 1000,
    );

    let granted = 0;
    let skipped = 0;
    for (const member of members) {
      try {
        const voucher = await this.grantOne(
          member,
          config.rewardId,
          year,
          expiredAt,
        );
        if (!voucher) {
          skipped++;
          continue;
        }
        granted++;
        // Di luar transaksi: gagal kirim notifikasi tidak boleh membatalkan
        // voucher yang sudah sah diterbitkan.
        await this.notifications
          .notifyMember(
            member,
            'Selamat ulang tahun! 🎉',
            `Ada hadiah untukmu: ${config.name}. Voucher sudah masuk ke ` +
              `Voucher Saya, berlaku ${config.voucherValidDays} hari.`,
            config.imageUrl,
          )
          .catch((err) => {
            this.logger.error(
              `Voucher ulang tahun terbit untuk ${member.memberCode} tapi ` +
                `notifikasi gagal: ${err instanceof Error ? err.message : err}`,
            );
          });
      } catch (err) {
        skipped++;
        this.logger.error(
          `Gagal memberi hadiah ulang tahun ke ${member.memberCode}: ` +
            (err instanceof Error ? err.message : String(err)),
        );
      }
    }

    return { granted, skipped, candidates: members.length };
  }

  // ── Jalur instan ──────────────────────────────────────────────────────────
  // Dipanggil saat member membuka daftar vouchernya. Tanpa ini, member yang
  // ulang tahun harus menunggu cron 07:00 berikutnya — dan bila fiturnya baru
  // dinyalakan siang hari, hadiah hari itu tidak pernah terbit sama sekali.
  //
  // Murah: sebagian besar panggilan berhenti di perbandingan tanggal di memori
  // (member-nya sudah dimuat pemanggil), tanpa query tambahan apa pun.
  async ensureForMember(
    member: {
      id: string;
      userId: string | null;
      memberCode: string;
      birthDate: Date | null;
      createdAt: Date;
    },
    now = new Date(),
  ): Promise<boolean> {
    if (!member.userId || !member.birthDate) return false;
    if (!BirthdayService.isBirthdayToday(member.birthDate, now)) return false;
    if (member.createdAt >= BirthdayService.startOfDay(now)) return false;

    const config = await this.prisma.birthdayConfig.findUnique({
      where: { id: SINGLETON_ID },
    });
    if (!config?.enabled || !config.rewardId) return false;

    const expiredAt = new Date(
      now.getTime() + config.voucherValidDays * 24 * 60 * 60 * 1000,
    );
    const voucher = await this.grantOne(
      member,
      config.rewardId,
      now.getUTCFullYear(),
      expiredAt,
    );
    if (!voucher) return false; // sudah pernah dapat tahun ini

    await this.notifications
      .notifyMember(
        member,
        'Selamat ulang tahun! 🎉',
        `Ada hadiah untukmu: ${config.name}. Voucher sudah masuk ke ` +
          `Voucher Saya, berlaku ${config.voucherValidDays} hari.`,
        config.imageUrl,
      )
      .catch(() => {
        // voucher sudah sah terbit; notifikasi bersifat best-effort
      });
    return true;
  }

  private static startOfDay(now: Date) {
    return new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
  }

  private static isLeap(y: number) {
    return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  }

  // 29 Februari dirayakan 28 Februari di tahun non-kabisat agar member tidak
  // dilewati tiga tahun sekali. Sejalan dengan query batch di bawah.
  private static isBirthdayToday(birthDate: Date, now: Date): boolean {
    const bm = birthDate.getUTCMonth() + 1;
    const bd = birthDate.getUTCDate();
    const m = now.getUTCMonth() + 1;
    const d = now.getUTCDate();
    if (bm === m && bd === d) return true;
    return (
      bm === 2 &&
      bd === 29 &&
      m === 2 &&
      d === 28 &&
      !BirthdayService.isLeap(now.getUTCFullYear())
    );
  }

  // Cocokkan tanggal & bulan lahir dengan hari ini. birthDate disimpan sebagai
  // tengah malam UTC (lihat alur registrasi), jadi dibandingkan dalam UTC.
  //
  // 29 Februari: di tahun non-kabisat perayaannya digeser ke 28 Februari agar
  // member tidak dilewati tiga tahun sekali.
  private async findBirthdayMembers(now: Date) {
    const month = now.getUTCMonth() + 1;
    const day = now.getUTCDate();
    const alsoLeapDay =
      month === 2 && day === 28 && !BirthdayService.isLeap(now.getUTCFullYear());

    // Member yang mendaftar hari ini dilewati: mencegah daftar → isi tanggal
    // lahir hari ini → klaim seketika. Tanggal lahir sudah terkunci setelah
    // diisi, jadi ini menutup sisa celahnya.
    const startOfToday = BirthdayService.startOfDay(now);

    return this.prisma.$queryRaw<
      { id: string; userId: string | null; memberCode: string }[]
    >`
      SELECT id, "userId", "memberCode"
      FROM members
      WHERE "birthDate" IS NOT NULL
        AND "userId" IS NOT NULL
        AND "createdAt" < ${startOfToday}
        AND (
          (EXTRACT(MONTH FROM "birthDate" AT TIME ZONE 'UTC') = ${month}
           AND EXTRACT(DAY FROM "birthDate" AT TIME ZONE 'UTC') = ${day})
          OR (${alsoLeapDay}
           AND EXTRACT(MONTH FROM "birthDate" AT TIME ZONE 'UTC') = 2
           AND EXTRACT(DAY FROM "birthDate" AT TIME ZONE 'UTC') = 29)
        )
    `;
  }

  // Satu member: klaim slot tahun ini lalu terbitkan voucher, dalam satu
  // transaksi. Bila slot sudah terisi (P2002 pada unique memberId+year),
  // berarti sudah pernah diberi — kembalikan null tanpa menerbitkan apa pun.
  private async grantOne(
    member: { id: string; memberCode: string },
    rewardId: string,
    year: number,
    expiredAt: Date,
  ) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const grant = await tx.birthdayGrant.create({
          data: { memberId: member.id, year },
        });

        const voucher = await tx.voucher.create({
          data: {
            code: generateVoucherCode(),
            rewardId,
            memberId: member.id,
            status: VoucherStatus.ACTIVE,
            expiredAt,
          },
        });

        // Dicatat sebagai Redeem dengan pointsSpent 0 supaya terlihat di
        // riwayat penukaran admin — hadiah tetap perlu jejak audit. Saldo poin
        // & ledger tidak disentuh: ini pemberian, bukan penukaran.
        await tx.redeem.create({
          data: {
            memberId: member.id,
            rewardId,
            voucherId: voucher.id,
            pointsSpent: 0,
          },
        });

        await tx.birthdayGrant.update({
          where: { id: grant.id },
          data: { voucherId: voucher.id },
        });

        return voucher;
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        return null; // sudah pernah dapat tahun ini
      }
      throw err;
    }
  }
}
