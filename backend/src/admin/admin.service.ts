import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdjustPointsDto } from './dto/adjust-points.dto';
import { ListMembersQueryDto } from './dto/list-members-query.dto';

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
}
