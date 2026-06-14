// Tier member berdasarkan saldo poin (mengikuti memberTier desain Figma).
export type Tier = "silver" | "gold" | "platinum";

export function getTier(points: number): Tier {
  if (points >= 5000) return "platinum";
  if (points >= 1000) return "gold";
  return "silver";
}

// Tier berikutnya + poin yang dibutuhkan + ambang target (untuk progress bar).
export function getNextTier(
  points: number,
): { label: string; need: number; target: number } | null {
  if (points < 1000) return { label: "Gold", need: 1000 - points, target: 1000 };
  if (points < 5000) return { label: "Platinum", need: 5000 - points, target: 5000 };
  return null;
}

// Warna badge tier (hex langsung agar persis desain).
export const TIER_META: Record<
  Tier,
  { label: string; badgeBg: string; badgeText: string }
> = {
  silver: { label: "Silver", badgeBg: "rgba(160,180,192,0.18)", badgeText: "#8A9BA5" },
  gold: { label: "Gold", badgeBg: "rgba(246,184,75,0.18)", badgeText: "#C99A2E" },
  platinum: { label: "Platinum", badgeBg: "rgba(178,148,255,0.18)", badgeText: "#9B7BE8" },
};
