import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  DEFAULT_TIER_CONFIG,
  TierConfig,
  nextTier,
  rateForTier,
  startOfMonth,
  tierForSpend,
} from '../common/tier.util';

const SINGLETON_ID = 'singleton';

@Injectable()
export class TierService {
  constructor(private readonly prisma: PrismaService) {}

  // Konfigurasi tier dari LoyaltyConfig (fallback default bila belum ada).
  async getConfig(): Promise<TierConfig> {
    const c = await this.prisma.loyaltyConfig.findUnique({
      where: { id: SINGLETON_ID },
    });
    if (!c) return { ...DEFAULT_TIER_CONFIG };
    return {
      tierSilverMin: c.tierSilverMin,
      tierGoldMin: c.tierGoldMin,
      tierPlatinumMin: c.tierPlatinumMin,
      rateBronze: c.rateBronze,
      rateSilver: c.rateSilver,
      rateGold: c.rateGold,
      ratePlatinum: c.ratePlatinum,
    };
  }

  // Total belanja member pada bulan kalender berjalan. Bisa pakai client
  // transaksi (tx) supaya konsisten saat dipanggil dari dalam $transaction.
  async monthlySpend(
    memberId: string,
    client: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<number> {
    const agg = await client.transaction.aggregate({
      where: { memberId, createdAt: { gte: startOfMonth(new Date()) } },
      _sum: { grandTotal: true },
    });
    return agg._sum.grandTotal ?? 0;
  }

  // Status tier member (dipakai profil). Tier dihitung on-the-fly.
  async statusForMember(memberId: string) {
    const cfg = await this.getConfig();
    const spend = await this.monthlySpend(memberId);
    const tier = tierForSpend(spend, cfg);
    return {
      tier,
      monthlySpend: spend,
      rupiahPerPoint: rateForTier(tier, cfg),
      nextTier: nextTier(spend, cfg),
    };
  }
}
