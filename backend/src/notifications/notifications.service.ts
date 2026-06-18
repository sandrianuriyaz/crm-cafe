import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  BroadcastTarget,
  CreateBroadcastDto,
} from './dto/create-broadcast.dto';

// Ambang tier dari saldo poin (samakan dengan getTier frontend).
const GOLD_MIN = 1000;
const PLATINUM_MIN = 5000;
const INACTIVE_DAYS = 30;

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Admin: broadcast ke member target ────────────────────────────────────
  async broadcast(dto: CreateBroadcastDto) {
    const where = this.targetWhere(dto.target);
    const members = await this.prisma.member.findMany({
      where,
      select: { id: true },
    });

    const title = dto.title.trim();
    const message = dto.message.trim();

    await this.prisma.$transaction([
      this.prisma.broadcast.create({
        data: { title, message, target: dto.target, recipientCount: members.length },
      }),
      this.prisma.notification.createMany({
        data: members.map((m) => ({ memberId: m.id, title, message })),
      }),
    ]);

    return { recipientCount: members.length };
  }

  async listBroadcasts(skip = 0, take = 20) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.broadcast.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.broadcast.count(),
    ]);
    return { total, skip, take, items };
  }

  // Hanya member yang punya akun (userId) yang bisa melihat inbox.
  private targetWhere(target: BroadcastTarget): Prisma.MemberWhereInput {
    const base: Prisma.MemberWhereInput = { userId: { not: null } };
    switch (target) {
      case 'silver':
        return { ...base, pointBalance: { lt: GOLD_MIN } };
      case 'gold':
        return { ...base, pointBalance: { gte: GOLD_MIN, lt: PLATINUM_MIN } };
      case 'platinum':
        return { ...base, pointBalance: { gte: PLATINUM_MIN } };
      case 'inactive': {
        const cutoff = new Date(Date.now() - INACTIVE_DAYS * 24 * 60 * 60 * 1000);
        return { ...base, transactions: { none: { createdAt: { gte: cutoff } } } };
      }
      case 'all':
      default:
        return base;
    }
  }

  // ── Member: inbox ─────────────────────────────────────────────────────────
  private async memberId(userId: string): Promise<string> {
    const member = await this.prisma.member.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!member) throw new NotFoundException('Member tidak ditemukan untuk akun ini');
    return member.id;
  }

  async listForMember(userId: string, skip = 0, take = 20) {
    const memberId = await this.memberId(userId);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where: { memberId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.notification.count({ where: { memberId } }),
    ]);
    return { total, skip, take, items };
  }

  async unreadCount(userId: string) {
    const memberId = await this.memberId(userId);
    const count = await this.prisma.notification.count({
      where: { memberId, readAt: null },
    });
    return { count };
  }

  async markRead(userId: string, id: string) {
    const memberId = await this.memberId(userId);
    const res = await this.prisma.notification.updateMany({
      where: { id, memberId, readAt: null },
      data: { readAt: new Date() },
    });
    if (res.count === 0) {
      // Tidak ada yang berubah: entah sudah dibaca, atau bukan milik member ini.
      const exists = await this.prisma.notification.findFirst({
        where: { id, memberId },
        select: { id: true },
      });
      if (!exists) throw new NotFoundException('Notifikasi tidak ditemukan');
    }
    return { id, read: true };
  }

  async markAllRead(userId: string) {
    const memberId = await this.memberId(userId);
    const res = await this.prisma.notification.updateMany({
      where: { memberId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: res.count };
  }
}
