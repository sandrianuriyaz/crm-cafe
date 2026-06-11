import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RewardStatus, VoucherStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { generateVoucherCode } from '../common/voucher-code.util';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';

// Berapa lama voucher berlaku sejak dibuat (hari).
const VOUCHER_VALID_DAYS = 30;

@Injectable()
export class RewardsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Katalog (customer) ────────────────────────────────────────────────────
  // Hanya reward aktif. Tampilkan stok agar UI bisa tandai habis.
  listActive() {
    return this.prisma.reward.findMany({
      where: { status: RewardStatus.ACTIVE },
      orderBy: { pointCost: 'asc' },
    });
  }

  async getOne(id: string) {
    const reward = await this.prisma.reward.findUnique({ where: { id } });
    if (!reward) throw new NotFoundException('Reward tidak ditemukan');
    return reward;
  }

  // ── CRUD (admin) ────────────────────────────────────────────────────────
  create(dto: CreateRewardDto) {
    return this.prisma.reward.create({ data: dto });
  }

  listAll() {
    return this.prisma.reward.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async update(id: string, dto: UpdateRewardDto) {
    await this.getOne(id);
    return this.prisma.reward.update({ where: { id }, data: dto });
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
    return this.prisma.voucher.findMany({
      where: { memberId: member.id },
      orderBy: { createdAt: 'desc' },
      include: { reward: { select: { name: true, imageUrl: true } } },
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
