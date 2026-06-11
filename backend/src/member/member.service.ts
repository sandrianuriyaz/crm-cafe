import { Injectable, NotFoundException } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MemberService {
  constructor(private readonly prisma: PrismaService) {}

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
    return {
      id: m.id,
      memberCode: m.memberCode,
      name: m.name,
      email: m.user?.email ?? null,
      phone: m.phone,
      pointBalance: m.pointBalance,
      tier: m.tier ? { id: m.tier.id, name: m.tier.name } : null,
      createdAt: m.createdAt,
    };
  }

  async getPoints(userId: string) {
    const m = await this.getMemberOrThrow(userId);
    return { pointBalance: m.pointBalance };
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
