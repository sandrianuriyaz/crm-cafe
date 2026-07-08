import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, VoucherStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { AdjustPointsDto } from './dto/adjust-points.dto';
import { ListMembersQueryDto } from './dto/list-members-query.dto';
import {
  ListVouchersQueryDto,
  ListWebhooksQueryDto,
} from './dto/list-webhooks-query.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

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
    const result = await this.prisma.$transaction(async (tx) => {
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
        userId: member.userId,
        points: dto.points,
        pointBalance: balanceAfter,
        historyId: history.id,
      };
    });

    // Push saldo terbaru ke app member (kalau punya akun). Tier berbasis
    // belanja, jadi penyesuaian poin tidak mengubah tier.
    if (result.userId) {
      try {
        this.realtime.emitPointsChanged(result.userId, {
          pointBalance: result.pointBalance,
          pointsDelta: result.points,
          source: 'adjustment',
        });
      } catch {
        // best-effort; jangan ganggu respons admin
      }
    }

    const { userId: _userId, ...response } = result;
    return response;
  }

  // Audit semua transaksi POS yang masuk. outletId opsional untuk scope ke 1 outlet
  // (di-resolve ke storeId — Transaction disimpan dengan storeId mentah dari POS,
  // bukan relasi ke Outlet). Outlet tanpa storeId belum bisa dipetakan → 0 hasil,
  // bukan diam-diam menampilkan semua transaksi.
  async listTransactions(skip = 0, take = 20, outletId?: string) {
    let where: Prisma.TransactionWhereInput = {};
    if (outletId) {
      const outlet = await this.prisma.outlet.findUnique({
        where: { id: outletId },
        select: { storeId: true },
      });
      if (!outlet?.storeId) {
        return { total: 0, skip, take, items: [] };
      }
      where = { storeId: outlet.storeId };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
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
      this.prisma.transaction.count({ where }),
    ]);
    return { total, skip, take, items };
  }

  // ── Vouchers (lintas member) ────────────────────────────────────────────
  async listVouchers(q: ListVouchersQueryDto) {
    const skip = q.skip ?? 0;
    const take = q.take ?? 20;
    const where: Prisma.VoucherWhereInput = q.status
      ? { status: q.status as VoucherStatus }
      : {};

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.voucher.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          code: true,
          status: true,
          expiredAt: true,
          usedAt: true,
          createdAt: true,
          member: { select: { name: true } },
          reward: { select: { name: true } },
        },
      }),
      this.prisma.voucher.count({ where }),
    ]);

    const items = rows.map((v) => ({
      id: v.id,
      code: v.code,
      memberName: v.member?.name ?? null,
      reward: v.reward?.name ?? null,
      status: v.status,
      expiredAt: v.expiredAt,
      usedAt: v.usedAt,
      createdAt: v.createdAt,
    }));
    return { total, skip, take, items };
  }

  // Tandai voucher terpakai. Hanya boleh dari status ACTIVE.
  async markVoucherUsed(id: string) {
    const voucher = await this.prisma.voucher.findUnique({ where: { id } });
    if (!voucher) throw new NotFoundException('Voucher tidak ditemukan');
    if (voucher.status !== VoucherStatus.ACTIVE) {
      throw new BadRequestException(
        `Voucher tidak bisa ditandai USED dari status ${voucher.status}`,
      );
    }
    return this.prisma.voucher.update({
      where: { id },
      data: { status: VoucherStatus.USED, usedAt: new Date() },
      select: { id: true, code: true, status: true, usedAt: true },
    });
  }

  // ── Riwayat redeem semua member ─────────────────────────────────────────
  async listRedeems(skip = 0, take = 20) {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.redeem.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          pointsSpent: true,
          createdAt: true,
          member: { select: { name: true } },
          reward: { select: { name: true } },
          voucher: { select: { code: true } },
        },
      }),
      this.prisma.redeem.count(),
    ]);

    const items = rows.map((r) => ({
      id: r.id,
      memberName: r.member?.name ?? null,
      reward: r.reward?.name ?? null,
      pointsSpent: r.pointsSpent,
      voucherCode: r.voucher?.code ?? null,
      createdAt: r.createdAt,
    }));
    return { total, skip, take, items };
  }

  // ── Webhook inbox (log event POS) ───────────────────────────────────────
  async listWebhooks(q: ListWebhooksQueryDto) {
    const skip = q.skip ?? 0;
    const take = q.take ?? 20;
    const where: Prisma.PosSyncLogWhereInput = {};
    if (q.status) where.status = q.status;
    if (q.from || q.to) {
      where.createdAt = {};
      if (q.from) where.createdAt.gte = new Date(q.from);
      if (q.to) where.createdAt.lte = new Date(q.to);
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.posSyncLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          eventId: true,
          idempotencyKey: true,
          status: true,
          errorMessage: true,
          createdAt: true,
        },
      }),
      this.prisma.posSyncLog.count({ where }),
    ]);
    return { total, skip, take, items };
  }

  // ── Audit idempotency key (dari transaksi yang tercatat) ────────────────
  async listIdempotencyKeys(skip = 0, take = 20) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          idempotencyKey: true,
          posOrderId: true,
          posOrderNumber: true,
          memberId: true,
          pointsAwarded: true,
          createdAt: true,
        },
      }),
      this.prisma.transaction.count(),
    ]);
    return { total, skip, take, items };
  }

  // ── Dashboard stats ─────────────────────────────────────────────────────
  async stats() {
    const [totalMembers, totalTransactions, earn, redeemed, activeOutlets] =
      await Promise.all([
        this.prisma.member.count(),
        this.prisma.transaction.count(),
        this.prisma.pointHistory.aggregate({
          _sum: { points: true },
          where: { type: 'earn' },
        }),
        this.prisma.redeem.aggregate({ _sum: { pointsSpent: true } }),
        this.prisma.outlet.count({ where: { status: 'ACTIVE' } }),
      ]);

    return {
      totalMembers,
      totalTransactions,
      pointsIssued: earn._sum.points ?? 0,
      pointsRedeemed: redeemed._sum.pointsSpent ?? 0,
      activeOutlets,
      pointsFlow: await this.pointsFlow(),
    };
  }

  // Arus poin 6 bulan terakhir: { month:"YYYY-MM", issued, redeemed }.
  private async pointsFlow() {
    const issued = await this.prisma.$queryRaw<
      { month: string; total: bigint }[]
    >`SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS month,
             COALESCE(SUM(points), 0)::bigint AS total
        FROM point_histories
       WHERE type = 'earn'
         AND "createdAt" >= date_trunc('month', now()) - interval '5 months'
       GROUP BY 1`;
    const redeemed = await this.prisma.$queryRaw<
      { month: string; total: bigint }[]
    >`SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS month,
             COALESCE(SUM("pointsSpent"), 0)::bigint AS total
        FROM redeems
       WHERE "createdAt" >= date_trunc('month', now()) - interval '5 months'
       GROUP BY 1`;

    const issuedMap = new Map(issued.map((r) => [r.month, Number(r.total)]));
    const redeemedMap = new Map(redeemed.map((r) => [r.month, Number(r.total)]));

    const now = new Date();
    const flow: { month: string; issued: number; redeemed: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      flow.push({
        month,
        issued: issuedMap.get(month) ?? 0,
        redeemed: redeemedMap.get(month) ?? 0,
      });
    }
    return flow;
  }

  // ── Ringkasan sinkronisasi POS per storeId ──────────────────────────────
  // Catatan: "per outlet" sebenarnya butuh model Outlet (Batch B). Sementara
  // dikelompokkan per storeId dari transaksi.
  async posSyncSummary() {
    const grouped = await this.prisma.transaction.groupBy({
      by: ['storeId'],
      _count: { _all: true },
      _max: { occurredAt: true, createdAt: true },
      orderBy: { _max: { createdAt: 'desc' } },
    });

    const items = grouped.map((g) => ({
      storeId: g.storeId,
      transactionCount: g._count._all,
      lastOccurredAt: g._max.occurredAt,
      lastCreatedAt: g._max.createdAt,
    }));
    return { items };
  }
}
