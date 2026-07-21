import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma, VoucherStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { generateVoucherCode } from '../common/voucher-code.util';

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

  // Jalan tiap hari pukul 07:00 waktu server. Idempoten: BirthdayGrant unik per
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
    const config = await this.prisma.loyaltyConfig.findUnique({
      where: { id: 'singleton' },
    });
    if (!config?.birthdayEnabled || !config.birthdayRewardId) {
      return { granted: 0, skipped: 0, candidates: 0, reason: 'nonaktif' };
    }

    const reward = await this.prisma.reward.findUnique({
      where: { id: config.birthdayRewardId },
    });
    if (!reward) {
      return {
        granted: 0,
        skipped: 0,
        candidates: 0,
        reason: 'reward tidak ditemukan',
      };
    }

    const members = await this.findBirthdayMembers(now);
    const year = now.getUTCFullYear();
    const expiredAt = new Date(
      now.getTime() + config.birthdayVoucherDays * 24 * 60 * 60 * 1000,
    );

    let granted = 0;
    let skipped = 0;
    for (const member of members) {
      try {
        const voucher = await this.grantOne(member, reward, year, expiredAt);
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
            `Ada hadiah untukmu: ${reward.name}. Voucher sudah masuk ke ` +
              `Voucher Saya, berlaku ${config.birthdayVoucherDays} hari.`,
            reward.imageUrl,
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

  // Cocokkan tanggal & bulan lahir dengan hari ini. birthDate disimpan sebagai
  // tengah malam UTC (lihat alur registrasi), jadi dibandingkan dalam UTC.
  //
  // 29 Februari: di tahun non-kabisat perayaannya digeser ke 28 Februari agar
  // member tidak dilewati tiga tahun sekali.
  private async findBirthdayMembers(now: Date) {
    const month = now.getUTCMonth() + 1;
    const day = now.getUTCDate();
    const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    const alsoLeapDay = month === 2 && day === 28 && !isLeap(now.getUTCFullYear());

    // Member yang mendaftar hari ini dilewati: mencegah daftar → isi tanggal
    // lahir hari ini → klaim seketika. Tanggal lahir sudah terkunci setelah
    // diisi, jadi ini menutup sisa celahnya.
    const startOfToday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

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
    reward: { id: string; name: string; pointCost: number },
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
            rewardId: reward.id,
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
            rewardId: reward.id,
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
