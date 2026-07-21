import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import {
  BroadcastTarget,
  CreateBroadcastDto,
} from './dto/create-broadcast.dto';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';

// Ambang tier dari saldo poin (samakan dengan getTier frontend).
const GOLD_MIN = 1000;
const PLATINUM_MIN = 5000;
const INACTIVE_DAYS = 30;

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  // ── Admin: broadcast ke member target ────────────────────────────────────
  async broadcast(dto: CreateBroadcastDto) {
    const where = this.targetWhere(dto.target);
    const members = await this.prisma.member.findMany({
      where,
      select: { id: true, userId: true },
    });

    const title = dto.title.trim();
    const message = dto.message.trim();
    const imageUrl = dto.imageUrl?.trim() || null;

    await this.prisma.$transaction([
      this.prisma.broadcast.create({
        data: {
          title,
          message,
          imageUrl,
          target: dto.target,
          recipientCount: members.length,
        },
      }),
      this.prisma.notification.createMany({
        data: members.map((m) => ({ memberId: m.id, title, message, imageUrl })),
      }),
    ]);

    // Push realtime ke tiap member yang punya akun → badge inbox naik instan.
    const createdAt = new Date().toISOString();
    for (const m of members) {
      if (!m.userId) continue;
      try {
        this.realtime.emitNotification(m.userId, { title, message, createdAt });
      } catch {
        // best-effort per member
      }
    }

    return { recipientCount: members.length };
  }

  // ── Notif otomatis: reward baru dirilis ──────────────────────────────────
  // Dipanggil RewardsService saat admin membuat reward ACTIVE, atau
  // mengaktifkan kembali reward yang tadinya INACTIVE. Beda dari broadcast()
  // manual: target selalu semua member, dan menghormati preferensi
  // `rewardNotifications` milik user.
  async notifyNewReward(reward: {
    name: string;
    pointCost: number;
    imageUrl: string | null;
  }) {
    const members = await this.prisma.member.findMany({
      where: {
        userId: { not: null },
        user: {
          OR: [
            // Belum pernah menyimpan preferensi = pakai default (semua aktif).
            { notificationSettings: { is: null } },
            { notificationSettings: { is: { rewardNotifications: true } } },
          ],
        },
      },
      select: { id: true, userId: true },
    });
    if (!members.length) return { recipientCount: 0 };

    const title = `Reward baru: ${reward.name}`;
    // pointCost 0 = reward gratis; "Tukar 0 poin" akan terbaca janggal.
    const message =
      reward.pointCost === 0
        ? `${reward.name} bisa kamu klaim gratis. Cek katalog reward sekarang!`
        : `Tukar ${reward.pointCost.toLocaleString('id-ID')} poin untuk ` +
          `${reward.name}. Cek katalog reward sekarang!`;
    const imageUrl = reward.imageUrl || null;

    await this.prisma.$transaction([
      // Dicatat sebagai broadcast juga supaya admin bisa lihat jangkauannya di
      // riwayat broadcast, sama seperti kiriman manual.
      this.prisma.broadcast.create({
        data: {
          title,
          message,
          imageUrl,
          target: 'all',
          recipientCount: members.length,
        },
      }),
      this.prisma.notification.createMany({
        data: members.map((m) => ({ memberId: m.id, title, message, imageUrl })),
      }),
    ]);

    const createdAt = new Date().toISOString();
    for (const m of members) {
      if (!m.userId) continue;
      try {
        this.realtime.emitNotification(m.userId, { title, message, createdAt });
      } catch {
        // best-effort per member
      }
    }

    return { recipientCount: members.length };
  }

  // Notifikasi untuk satu member (mis. hadiah ulang tahun). Tidak dicatat
  // sebagai Broadcast — itu untuk pengumuman massal, bukan kiriman personal.
  async notifyMember(
    member: { id: string; userId: string | null },
    title: string,
    message: string,
    imageUrl: string | null = null,
  ) {
    await this.prisma.notification.create({
      data: { memberId: member.id, title, message, imageUrl },
    });
    if (!member.userId) return;
    try {
      this.realtime.emitNotification(member.userId, {
        title,
        message,
        createdAt: new Date().toISOString(),
      });
    } catch {
      // best-effort — notifikasi sudah tersimpan di inbox
    }
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
        const cutoff = new Date(
          Date.now() - INACTIVE_DAYS * 24 * 60 * 60 * 1000,
        );
        return {
          ...base,
          transactions: { none: { createdAt: { gte: cutoff } } },
        };
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
    if (!member)
      throw new NotFoundException('Member tidak ditemukan untuk akun ini');
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

  // ── Member: preferensi notifikasi ─────────────────────────────────────────
  // Baris NotificationSettings dibuat lazily (upsert). Bila belum ada, GET
  // mengembalikan default (semua aktif) tanpa menulis ke DB.
  private static readonly DEFAULT_SETTINGS = {
    emailEnabled: true,
    pushEnabled: true,
    promoNotifications: true,
    pointNotifications: true,
    rewardNotifications: true,
  };

  async getSettings(userId: string) {
    const settings = await this.prisma.notificationSettings.findUnique({
      where: { userId },
      select: NotificationsService.SETTINGS_SELECT,
    });
    return settings ?? { ...NotificationsService.DEFAULT_SETTINGS };
  }

  async updateSettings(userId: string, dto: UpdateNotificationSettingsDto) {
    // Buang key undefined supaya partial update tidak menimpa dengan undefined.
    const data = Object.fromEntries(
      Object.entries(dto).filter(([, v]) => v !== undefined),
    );
    return this.prisma.notificationSettings.upsert({
      where: { userId },
      create: { userId, ...NotificationsService.DEFAULT_SETTINGS, ...data },
      update: data,
      select: NotificationsService.SETTINGS_SELECT,
    });
  }

  private static readonly SETTINGS_SELECT = {
    emailEnabled: true,
    pushEnabled: true,
    promoNotifications: true,
    pointNotifications: true,
    rewardNotifications: true,
  } as const;
}
