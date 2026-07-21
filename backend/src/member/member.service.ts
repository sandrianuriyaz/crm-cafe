import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { TierService } from '../tier/tier.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class MemberService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tier: TierService,
  ) {}

  // Ambil member milik user login. Admin / user tanpa member → 404.
  private async getMemberOrThrow(userId: string) {
    const member = await this.prisma.member.findUnique({
      where: { userId },
      include: { user: true, tier: true },
    });
    if (!member) {
      throw new NotFoundException('Member tidak ditemukan untuk akun ini');
    }
    return member;
  }

  async getProfile(userId: string) {
    const m = await this.getMemberOrThrow(userId);
    // Tier dihitung dari belanja bulan ini (bukan saldo poin).
    const status = await this.tier.statusForMember(m.id);
    return {
      id: m.id,
      memberCode: m.memberCode,
      name: m.name,
      email: m.user?.email ?? null,
      phone: m.phone,
      birthDate: m.birthDate,
      pointBalance: m.pointBalance,
      tier: status.tier,
      monthlySpend: status.monthlySpend,
      rupiahPerPoint: status.rupiahPerPoint,
      nextTier: status.nextTier,
      createdAt: m.createdAt,
      emailVerified: m.user?.emailVerified ?? false,
      pendingEmail: m.user?.pendingEmail ?? null,
      hasPassword: !!m.user?.passwordHash,
    };
  }

  async getPoints(userId: string) {
    const m = await this.getMemberOrThrow(userId);
    return { pointBalance: m.pointBalance };
  }

  // Edit profil member sendiri. Phone diubah di Member & User sekaligus supaya
  // login OTP (yang memakai User.phone) tetap cocok. Nomor bentrok → 409.
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const m = await this.getMemberOrThrow(userId);
    const name = dto.name?.trim();
    const phone = dto.phone?.trim();
    const birthDate = dto.birthDate;

    // Tanggal lahir hanya boleh diisi sekali. Bila bebas diubah, member bisa
    // menyetel ulang tanggalnya tiap bulan untuk memanen reward ulang tahun.
    // Koreksi salah ketik lewat admin. Mengirim nilai yang sama diabaikan
    // (bukan perubahan) agar PATCH tetap idempoten.
    const birthChanged =
      birthDate !== undefined &&
      new Date(birthDate).getTime() !== m.birthDate?.getTime();
    if (birthChanged && m.birthDate) {
      throw new ConflictException(
        'Tanggal lahir sudah diisi dan tidak bisa diubah sendiri. Hubungi admin bila keliru.',
      );
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.member.update({
          where: { id: m.id },
          data: {
            ...(name !== undefined ? { name } : {}),
            ...(phone !== undefined ? { phone: phone || null } : {}),
            ...(birthChanged ? { birthDate: new Date(birthDate!) } : {}),
          },
        });
        // Sinkronkan phone (dan nama) ke akun login bila ada.
        if (m.userId && (phone !== undefined || name !== undefined)) {
          await tx.user.update({
            where: { id: m.userId },
            data: {
              ...(name !== undefined ? { name } : {}),
              ...(phone !== undefined ? { phone: phone || null } : {}),
            },
          });
        }
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('Nomor HP sudah dipakai akun lain');
      }
      throw err;
    }

    return this.getProfile(userId);
  }

  // QR member: payload yang dipindai POS untuk mengenali pelanggan.
  // Opsi A (CRM yang punya id): `id` = memberCode terbitan CRM. POS menyimpan id
  // ini & mengirimnya kembali di customer.id. Format {id, nama, hp} sesuai §3.
  async getQr(userId: string) {
    const m = await this.getMemberOrThrow(userId);
    const payload = {
      id: m.memberCode, // id milik CRM (di-echo balik POS sebagai customer.id)
      nama: m.name,
      hp: m.phone,
    };
    const text = JSON.stringify(payload);
    const dataUrl = await QRCode.toDataURL(text, { margin: 1, width: 256 });
    return { payload, text, image_data_url: dataUrl };
  }

  async getTransactions(userId: string, skip = 0, take = 20) {
    const m = await this.getMemberOrThrow(userId);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where: { memberId: m.id },
        orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
        select: {
          id: true,
          posOrderNumber: true,
          grandTotal: true,
          paymentMethod: true,
          pointsAwarded: true,
          occurredAt: true,
          createdAt: true,
          items: {
            select: { name: true, qty: true, lineTotal: true, isReward: true },
          },
        },
      }),
      this.prisma.transaction.count({ where: { memberId: m.id } }),
    ]);
    return { total, skip, take, items };
  }

  async getPointHistories(userId: string, skip = 0, take = 20) {
    const m = await this.getMemberOrThrow(userId);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.pointHistory.findMany({
        where: { memberId: m.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          type: true,
          points: true,
          balanceAfter: true,
          referenceType: true,
          referenceId: true,
          note: true,
          createdAt: true,
        },
      }),
      this.prisma.pointHistory.count({ where: { memberId: m.id } }),
    ]);
    return { total, skip, take, items };
  }
}
