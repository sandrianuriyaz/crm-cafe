"use client";

import { X } from "lucide-react";
import { TIER_META, TIER_ICON, formatRupiah, type Tier } from "@/lib/loyalty/tier";

type Props = {
  currentTier: Tier;
  monthlySpend: number;
  onClose: () => void;
};

const TIERS: { name: Tier; min: number; rate: number }[] = [
  { name: "bronze",   min: 0,         rate: 1000 },
  { name: "silver",   min: 500_000,   rate: 950  },
  { name: "gold",     min: 1_000_000, rate: 900  },
  { name: "platinum", min: 1_500_000, rate: 850  },
];

export function TierInfoSheet({ currentTier, monthlySpend, onClose }: Props) {
  const currentIdx  = TIERS.findIndex((t) => t.name === currentTier);
  const nextTierDef = TIERS[currentIdx + 1] ?? null;
  const progress    = nextTierDef
    ? Math.min(100, (monthlySpend / nextTierDef.min) * 100)
    : 100;
  const CurrentIcon = TIER_ICON[currentTier];
  const NextIcon    = nextTierDef ? TIER_ICON[nextTierDef.name] : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-[430px] overflow-y-auto rounded-t-[28px] bg-polks-card pb-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3">
          <div className="h-1 w-10 rounded-full bg-polks-surface" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 pt-4">
          <h2 className="text-[17px] font-bold text-polks-text">Status Tier</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="flex size-8 items-center justify-center rounded-full bg-polks-surface text-polks-muted"
          >
            <X size={16} />
          </button>
        </div>

        {/* Current tier card */}
        <div className="mx-5 rounded-2xl border border-polks-border bg-polks-bg px-4 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CurrentIcon size={22} color={TIER_META[currentTier].badgeText} strokeWidth={1.8} />
              <div>
                <p className="text-[11px] text-polks-muted">Tier kamu saat ini</p>
                <p
                  className="text-[15px] font-black"
                  style={{ color: TIER_META[currentTier].badgeText }}
                >
                  {TIER_META[currentTier].label} Member
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-polks-muted">Belanja bulan ini</p>
              <p className="text-[13px] font-bold text-polks-text">
                {formatRupiah(monthlySpend)}
              </p>
            </div>
          </div>

          {/* Progress ke tier berikutnya */}
          {nextTierDef ? (
            <div className="mt-3">
              <div className="mb-1.5 flex items-center justify-between">
                <p className="flex items-center gap-1 text-[11px] text-polks-muted">
                  Menuju
                  {NextIcon && (
                    <NextIcon size={12} color={TIER_META[nextTierDef.name].badgeText} strokeWidth={1.8} />
                  )}
                  {TIER_META[nextTierDef.name].label}
                </p>
                <p className="text-[11px] font-semibold text-polks-text">
                  {formatRupiah(monthlySpend)} / {formatRupiah(nextTierDef.min)}
                </p>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-polks-surface">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: TIER_META[nextTierDef.name].badgeText,
                  }}
                />
              </div>
              <p className="mt-1 text-[10px] text-polks-muted">
                Belanja {formatRupiah(nextTierDef.min - monthlySpend)} lagi bulan ini
              </p>
            </div>
          ) : (
            <p
              className="mt-2 flex items-center gap-1 text-[11px] font-semibold"
              style={{ color: TIER_META.platinum.badgeText }}
            >
              <CurrentIcon size={13} strokeWidth={1.8} />
              Kamu sudah di tier tertinggi!
            </p>
          )}
        </div>

        {/* Tabel semua tier */}
        <p className="mx-5 mb-2.5 mt-4 text-[11px] font-bold uppercase tracking-[0.08em] text-polks-muted">
          Semua Tier
        </p>
        <div className="mx-5 overflow-hidden rounded-2xl border border-polks-border bg-polks-card">
          {TIERS.map((t, i) => {
            const meta      = TIER_META[t.name];
            const isCurrent = t.name === currentTier;
            const isLast    = i === TIERS.length - 1;
            const RowIcon   = TIER_ICON[t.name];
            return (
              <div
                key={t.name}
                className={
                  "flex items-center gap-3 px-4 py-3 " +
                  (!isLast ? "border-b border-polks-surface " : "") +
                  (isCurrent ? "bg-polks-bg" : "")
                }
              >
                <RowIcon size={20} color={meta.badgeText} strokeWidth={1.8} />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <p
                      className="text-[13px] font-bold"
                      style={{ color: meta.badgeText }}
                    >
                      {meta.label}
                    </p>
                    {isCurrent && (
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                        style={{ backgroundColor: meta.badgeBg, color: meta.badgeText }}
                      >
                        Kamu
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-polks-muted">
                    {t.min === 0 ? "Semua member" : `Belanja ≥ ${formatRupiah(t.min)}/bulan`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold text-polks-text">
                    1 poin
                  </p>
                  <p className="text-[10px] text-polks-muted">
                    per {formatRupiah(t.rate)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Catatan */}
        <p className="mx-5 mt-3 text-[11px] leading-relaxed text-polks-muted">
          Tier dihitung dari total belanja bulan ini dan direset setiap awal bulan. Semakin tinggi tier, semakin cepat poin terkumpul.
        </p>
      </div>
    </div>
  );
}
