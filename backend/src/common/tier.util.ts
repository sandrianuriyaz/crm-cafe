// Logika tier murni (tanpa DB). Tier ditentukan dari total belanja bulan ini.

export type TierName = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface TierConfig {
  tierSilverMin: number;
  tierGoldMin: number;
  tierPlatinumMin: number;
  rateBronze: number;
  rateSilver: number;
  rateGold: number;
  ratePlatinum: number;
}

export const DEFAULT_TIER_CONFIG: TierConfig = {
  tierSilverMin: 500_000,
  tierGoldMin: 1_000_000,
  tierPlatinumMin: 1_500_000,
  rateBronze: 1000,
  rateSilver: 950,
  rateGold: 900,
  ratePlatinum: 850,
};

export function tierForSpend(spend: number, c: TierConfig): TierName {
  if (spend >= c.tierPlatinumMin) return 'platinum';
  if (spend >= c.tierGoldMin) return 'gold';
  if (spend >= c.tierSilverMin) return 'silver';
  return 'bronze';
}

export function rateForTier(tier: TierName, c: TierConfig): number {
  switch (tier) {
    case 'platinum':
      return c.ratePlatinum;
    case 'gold':
      return c.rateGold;
    case 'silver':
      return c.rateSilver;
    default:
      return c.rateBronze;
  }
}

// Tier berikutnya + sisa belanja (Rp) yang dibutuhkan. null bila sudah Platinum.
export function nextTier(
  spend: number,
  c: TierConfig,
): { name: TierName; min: number; remaining: number } | null {
  if (spend < c.tierSilverMin)
    return { name: 'silver', min: c.tierSilverMin, remaining: c.tierSilverMin - spend };
  if (spend < c.tierGoldMin)
    return { name: 'gold', min: c.tierGoldMin, remaining: c.tierGoldMin - spend };
  if (spend < c.tierPlatinumMin)
    return {
      name: 'platinum',
      min: c.tierPlatinumMin,
      remaining: c.tierPlatinumMin - spend,
    };
  return null;
}

// Awal bulan kalender berjalan (UTC).
export function startOfMonth(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}
