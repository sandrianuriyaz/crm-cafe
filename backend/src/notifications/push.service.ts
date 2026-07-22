import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';

export type PushPayload = {
  title: string;
  message: string;
  imageUrl?: string | null;
  // Halaman yang dibuka saat notifikasi diketuk.
  url?: string;
};

// Kategori konten, dipetakan ke kolom preferensi di NotificationSettings.
export type PushCategory = 'promo' | 'point' | 'reward' | null;

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private enabled = false;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY');
    if (!publicKey || !privateKey) {
      // Sama seperti MailService tanpa SMTP: fitur mati, alur lain tetap jalan.
      this.logger.warn(
        'VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY tidak diset — push notification nonaktif.',
      );
      return;
    }
    webpush.setVapidDetails(
      this.config.get<string>('VAPID_SUBJECT') ?? 'mailto:no-reply@polks.id',
      publicKey,
      privateKey,
    );
    this.enabled = true;
  }

  // Dipakai frontend sebelum subscribe. null = fitur mati, jadi UI bisa
  // menyembunyikan tombolnya alih-alih gagal saat diklik.
  publicKey(): string | null {
    return this.config.get<string>('VAPID_PUBLIC_KEY') ?? null;
  }

  async subscribe(
    userId: string,
    sub: { endpoint: string; keys: { p256dh: string; auth: string } },
    userAgent?: string,
  ) {
    // endpoint unik global, jadi upsert: perangkat yang me-refresh langganan
    // (browser bisa melakukannya kapan saja) tidak menumpuk baris baru.
    // userId ikut di-update supaya perangkat bersama yang berganti pemilik
    // tidak mengirim notifikasi ke akun sebelumnya.
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: sub.endpoint },
      create: {
        userId,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        userAgent: userAgent?.slice(0, 255) ?? null,
      },
      update: {
        userId,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        userAgent: userAgent?.slice(0, 255) ?? null,
      },
    });
    return { subscribed: true };
  }

  async unsubscribe(userId: string, endpoint: string) {
    // Dibatasi userId supaya seseorang tidak bisa mencabut langganan orang lain
    // hanya dengan menebak endpoint.
    const res = await this.prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });
    return { removed: res.count };
  }

  // Kirim ke semua perangkat milik satu user. Best-effort: kegagalan push tidak
  // boleh menggagalkan alur pemanggil — notifikasi sudah tersimpan di inbox.
  async sendToUser(
    userId: string,
    payload: PushPayload,
    category: PushCategory = null,
  ): Promise<void> {
    if (!this.enabled) return;

    if (!(await this.allowed(userId, category))) return;

    const subs = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });
    if (!subs.length) return;

    const body = JSON.stringify(payload);

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            body,
          );
          await this.prisma.pushSubscription.update({
            where: { id: sub.id },
            data: { lastUsedAt: new Date() },
          });
        } catch (err) {
          await this.handleSendError(sub.id, sub.endpoint, err);
        }
      }),
    );
  }

  // 404/410 dari push service = langganan sudah mati permanen (user hapus app,
  // browser cabut izin). Baris harus dibuang, kalau tidak akan dicoba selamanya.
  private async handleSendError(
    id: string,
    endpoint: string,
    err: unknown,
  ): Promise<void> {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) {
      await this.prisma.pushSubscription.delete({ where: { id } }).catch(() => {
        // Sudah terhapus lewat jalur lain — abaikan.
      });
      return;
    }
    // Galat lain (jaringan, 5xx push service) bersifat sementara: biarkan baris
    // hidup dan coba lagi pada notifikasi berikutnya.
    this.logger.warn(
      `Push gagal (status=${status ?? 'n/a'}) ke ${endpoint.slice(0, 60)}…: ${String(err)}`,
    );
  }

  // Hormati preferensi member. Belum pernah menyimpan preferensi = default
  // semua aktif, sama seperti NotificationsService.
  private async allowed(
    userId: string,
    category: PushCategory,
  ): Promise<boolean> {
    const settings = await this.prisma.notificationSettings.findUnique({
      where: { userId },
      select: {
        pushEnabled: true,
        promoNotifications: true,
        pointNotifications: true,
        rewardNotifications: true,
      },
    });
    if (!settings) return true;
    if (!settings.pushEnabled) return false;
    switch (category) {
      case 'promo':
        return settings.promoNotifications;
      case 'point':
        return settings.pointNotifications;
      case 'reward':
        return settings.rewardNotifications;
      default:
        return true;
    }
  }
}
