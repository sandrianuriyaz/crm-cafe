import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { RewardType, VoucherStatus } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

// Payload yang dipush ke app saat status voucher berubah. Bentuknya sengaja
// disamakan dengan tipe `Voucher` di frontend agar bisa langsung replace state.
export interface VoucherUpdatedPayload {
  id: string;
  code: string;
  status: VoucherStatus;
  expiredAt: Date | null;
  usedAt: Date | null;
  createdAt: Date;
  reward: {
    name: string;
    imageUrl: string | null;
    type: RewardType;
    value: number | null;
    minPurchase: number | null;
  };
}

export type TierName = 'bronze' | 'silver' | 'gold' | 'platinum';

// Saldo poin berubah — entah dari transaksi POS (earn) atau penyesuaian admin.
export interface PointsChangedPayload {
  pointBalance: number;
  pointsDelta: number; // + bertambah, - berkurang
  source: 'transaction' | 'adjustment';
}

// Member naik tier (mis. Silver → Gold) setelah belanja.
export interface TierUpPayload {
  from: TierName;
  to: TierName;
}

// Notifikasi/inbox baru (mis. broadcast admin).
export interface NotificationPayload {
  title: string;
  message: string;
  createdAt: string; // ISO
}

// Tiap user punya room sendiri agar emit bisa di-target hanya ke perangkatnya.
const userRoom = (userId: string) => `user:${userId}`;

// Gateway realtime untuk push update ke app customer tanpa refresh. Saat ini
// dipakai untuk status voucher: begitu kasir POS scan & redeem, kartu voucher
// di app langsung berubah jadi "Digunakan".
@WebSocketGateway({ cors: { origin: true } })
export class RealtimeGateway implements OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly jwt: JwtService) {}

  // Autentikasi tiap koneksi via JWT (handshake.auth.token, fallback header
  // Authorization). Socket valid di-join ke room user-nya; yang tidak valid
  // langsung diputus.
  handleConnection(client: Socket) {
    const token =
      (client.handshake.auth?.token as string | undefined) ??
      this.bearerFromHeader(client);
    if (!token) {
      client.disconnect(true);
      return;
    }
    try {
      const payload = this.jwt.verify<JwtPayload>(token);
      // Tiket 2FA sementara bukan access token penuh — tolak.
      if (payload.twofa) throw new Error('2FA ticket bukan access token');
      client.join(userRoom(payload.sub));
    } catch {
      client.disconnect(true);
    }
  }

  // Beri tahu app customer bahwa salah satu vouchernya berubah (mis. dipakai).
  emitVoucherUpdated(userId: string, voucher: VoucherUpdatedPayload) {
    this.server.to(userRoom(userId)).emit('voucher:updated', voucher);
  }

  // Saldo poin member berubah → app refresh saldo & tier tanpa reload.
  emitPointsChanged(userId: string, payload: PointsChangedPayload) {
    this.server.to(userRoom(userId)).emit('points:changed', payload);
  }

  // Member naik tier → app tampilkan perayaan + refresh.
  emitTierUp(userId: string, payload: TierUpPayload) {
    this.server.to(userRoom(userId)).emit('tier:up', payload);
  }

  // Notifikasi baru → badge inbox naik instan.
  emitNotification(userId: string, payload: NotificationPayload) {
    this.server.to(userRoom(userId)).emit('notification:new', payload);
  }

  private bearerFromHeader(client: Socket): string | undefined {
    const h = client.handshake.headers.authorization;
    return h?.startsWith('Bearer ') ? h.slice(7) : undefined;
  }
}
