import {
  DEFAULT_TIER_CONFIG,
  nextTier,
  rateForTier,
  tierForSpend,
} from './tier.util';

const c = DEFAULT_TIER_CONFIG;

describe('tier.util', () => {
  it('maps monthly spend to the right tier', () => {
    expect(tierForSpend(0, c)).toBe('bronze');
    expect(tierForSpend(499_999, c)).toBe('bronze');
    expect(tierForSpend(500_000, c)).toBe('silver');
    expect(tierForSpend(999_999, c)).toBe('silver');
    expect(tierForSpend(1_000_000, c)).toBe('gold');
    expect(tierForSpend(1_499_999, c)).toBe('gold');
    expect(tierForSpend(1_500_000, c)).toBe('platinum');
    expect(tierForSpend(9_000_000, c)).toBe('platinum');
  });

  it('returns the earning rate per tier', () => {
    expect(rateForTier('bronze', c)).toBe(1000);
    expect(rateForTier('silver', c)).toBe(950);
    expect(rateForTier('gold', c)).toBe(900);
    expect(rateForTier('platinum', c)).toBe(850);
  });

  it('computes the next tier + remaining spend', () => {
    expect(nextTier(0, c)).toEqual({ name: 'silver', min: 500_000, remaining: 500_000 });
    expect(nextTier(600_000, c)).toEqual({
      name: 'gold',
      min: 1_000_000,
      remaining: 400_000,
    });
    expect(nextTier(1_500_000, c)).toBeNull();
  });
});
