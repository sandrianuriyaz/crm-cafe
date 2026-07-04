import { Medal, Award, Trophy, Crown, type LucideIcon } from "lucide-react";

// Tier member dihitung BACKEND dari total belanja bulan ini (bukan saldo poin).
// Frontend tinggal menampilkan `user.tier` + `user.nextTier` dari /member/profile.
export type Tier = "bronze" | "silver" | "gold" | "platinum";

// Tier berikutnya berbasis belanja (Rp) — bentuk dari backend `nextTier`.
export type NextTier = { name: Tier; min: number; remaining: number } | null;

// Warna badge tier (hex langsung agar persis desain).
export const TIER_META: Record<
  Tier,
  { label: string; badgeBg: string; badgeText: string }
> = {
  bronze: { label: "Bronze", badgeBg: "rgba(176,141,87,0.18)", badgeText: "#A87B4B" },
  silver: { label: "Silver", badgeBg: "rgba(160,180,192,0.18)", badgeText: "#8A9BA5" },
  gold: { label: "Gold", badgeBg: "rgba(246,184,75,0.18)", badgeText: "#C99A2E" },
  platinum: { label: "Platinum", badgeBg: "rgba(178,148,255,0.18)", badgeText: "#9B7BE8" },
};

// Icon lucide-react per tier — pengganti emoji (🥉🥈🥇💎) yang tidak
// konsisten dengan icon set lucide dipakai di seluruh app.
export const TIER_ICON: Record<Tier, LucideIcon> = {
  bronze: Medal,
  silver: Award,
  gold: Trophy,
  platinum: Crown,
};

export function formatRupiah(n: number): string {
  return "Rp" + n.toLocaleString("id-ID");
}
