"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Gift,
  MapPin,
  Calendar,
  Star,
  CheckCircle2,
  Info,
} from "lucide-react";
import { CustomerShell } from "@/components/layout/customer-shell";
import { RedeemSheet } from "@/components/customer/redeem-sheet";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { TIER_META } from "@/lib/loyalty/tier";
import { LAST_REDEEM_KEY, type RedeemResult, type Reward } from "@/lib/loyalty/types";

const terms = [
  "Reward hanya bisa ditukar oleh member aktif POLKS.",
  "Tidak dapat diuangkan atau dipindahtangankan.",
  "Berlaku satu kali penggunaan.",
  "Tunjukkan voucher ke kasir sebelum transaksi.",
  "POLKS berhak membatalkan reward yang tidak sesuai syarat.",
];

export default function RewardDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { user, refreshProfile } = useAuth();

  const [reward, setReward] = useState<Reward | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  const points = user?.pointBalance ?? 0;
  const tierMeta = TIER_META[user?.tier ?? "bronze"];

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api<Reward>(`/rewards/${id}`)
      .then((r) => alive && setReward(r))
      .catch((err) => {
        if (!alive) return;
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login");
          return;
        }
        setError(err instanceof Error ? err.message : "Reward tidak ditemukan");
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id, router]);

  async function handleRedeem() {
    if (!reward) return;
    setRedeeming(true);
    setRedeemError(null);
    try {
      const result = await api<RedeemResult>(`/rewards/${reward.id}/redeem`, {
        method: "POST",
      });
      window.sessionStorage.setItem(LAST_REDEEM_KEY, JSON.stringify(result));
      await refreshProfile();
      router.push("/voucher-success");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/login");
        return;
      }
      setRedeemError(err instanceof Error ? err.message : "Redeem gagal, coba lagi");
      setRedeeming(false);
    }
  }

  const canRedeem = !!reward && points >= reward.pointCost && reward.stock > 0;
  const remaining = reward ? points - reward.pointCost : 0;

  return (
    <CustomerShell showHeader={false} showBottomNav={false} topbarRight={null}>
      {/* Header */}
      <div className="bg-polks-brand px-5 pb-7 pt-4">
        <button
          type="button"
          onClick={() => router.push("/rewards")}
          className="mb-5 flex items-center gap-1.5 text-[13px] font-medium text-white/50"
        >
          <ArrowLeft size={16} />
          Kembali ke Catalog
        </button>

        {loading ? (
          <div className="h-12 w-2/3 animate-pulse rounded bg-white/10" />
        ) : reward ? (
          <>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10">
                <Gift size={22} color="#F6B84B" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.07em] text-white/40">Reward</p>
                <h1 className="text-xl font-bold tracking-[-0.02em] text-white">{reward.name}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-white">
                <Star size={12} color="#F6B84B" fill="#F6B84B" />
                {reward.pointCost.toLocaleString("id-ID")} pts
              </span>
              {canRedeem ? (
                <span className="rounded-full bg-[rgba(56,161,105,0.15)] px-2.5 py-[3px] text-[11px] font-semibold text-polks-success">
                  Poin cukup
                </span>
              ) : (
                <span className="rounded-full bg-white/10 px-2.5 py-[3px] text-[11px] font-semibold text-white/60">
                  {reward.stock <= 0
                    ? "Stok habis"
                    : `Butuh ${(reward.pointCost - points).toLocaleString("id-ID")} pts lagi`}
                </span>
              )}
            </div>
          </>
        ) : (
          <h1 className="text-xl font-bold text-white">Reward</h1>
        )}
      </div>

      {/* Wave */}
      <div className="bg-polks-brand leading-none">
        <svg viewBox="0 0 390 28" preserveAspectRatio="none" className="block h-7 w-full">
          <path d="M0,0 Q195,28 390,0 L390,28 L0,28 Z" fill="#F6F8FA" />
        </svg>
      </div>

      <div className="flex flex-col gap-4 bg-polks-bg px-5 pb-10">
        {error ? (
          <div className="rounded-2xl border border-polks-border bg-white p-6 text-center">
            <p className="text-sm text-polks-muted">{error}</p>
          </div>
        ) : reward ? (
          <>
            {/* Meta */}
            <div className="overflow-hidden rounded-2xl border border-polks-border bg-white">
              {[
                { Icon: MapPin, label: "Outlet", value: "All Outlets" },
                { Icon: Star, label: "Poin dibutuhkan", value: `${reward.pointCost.toLocaleString("id-ID")} pts` },
                { Icon: Calendar, label: "Sisa stok", value: `${reward.stock}` },
              ].map(({ Icon, label, value }, i) => (
                <div
                  key={label}
                  className={
                    "flex items-center gap-3 px-4 py-3 " +
                    (i > 0 ? "border-t border-polks-border" : "")
                  }
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-polks-surface">
                    <Icon size={14} color="#25343F" />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#8A959D]">{label}</p>
                    <p className="text-[13px] font-semibold text-polks-text">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Description */}
            {reward.description ? (
              <div className="rounded-2xl border border-polks-border bg-white p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Info size={14} color="#25343F" />
                  <span className="text-[13px] font-semibold text-polks-text">Deskripsi</span>
                </div>
                <p className="text-[13px] leading-relaxed text-polks-muted">{reward.description}</p>
              </div>
            ) : null}

            {/* Terms */}
            <div className="rounded-2xl border border-polks-border bg-white p-4">
              <span className="mb-3 block text-[13px] font-semibold text-polks-text">
                Syarat &amp; Ketentuan
              </span>
              <div className="flex flex-col gap-2.5">
                {terms.map((t) => (
                  <div key={t} className="flex items-start gap-2.5">
                    <CheckCircle2 size={13} color="#8A959D" className="mt-0.5 shrink-0" />
                    <span className="text-xs leading-relaxed text-polks-muted">{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Balance summary */}
            <div className="flex flex-col gap-3 rounded-2xl border border-polks-border bg-white p-4">
              <p className="text-[13px] font-semibold text-polks-text">Ringkasan Poin</p>
              <div className="flex justify-between text-[13px]">
                <span className="text-polks-muted">Saldo saat ini</span>
                <span className="font-semibold text-polks-text">{points.toLocaleString("id-ID")} pts</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-polks-muted">Poin digunakan</span>
                <span className="font-semibold text-polks-error">
                  − {reward.pointCost.toLocaleString("id-ID")} pts
                </span>
              </div>
              <div className="h-px bg-polks-surface" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#8A959D]">Tier kamu saat ini</span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]"
                  style={{ backgroundColor: tierMeta.badgeBg, color: tierMeta.badgeText }}
                >
                  {tierMeta.label}
                </span>
              </div>
            </div>

            {/* CTA */}
            <button
              type="button"
              disabled={!canRedeem}
              onClick={() => {
                setRedeemError(null);
                setConfirming(true);
              }}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-polks-smile text-sm font-bold text-white disabled:opacity-50"
            >
              <Gift size={16} />
              {canRedeem
                ? "Tukar Poin Sekarang"
                : reward.stock <= 0
                  ? "Stok habis"
                  : `Butuh ${(reward.pointCost - points).toLocaleString("id-ID")} pts lagi`}
            </button>
            <p className="text-center text-[11px] text-polks-muted">Sisa setelah tukar: {remaining.toLocaleString("id-ID")} pts</p>
          </>
        ) : null}
      </div>

      {confirming && reward ? (
        <RedeemSheet
          reward={reward}
          points={points}
          redeeming={redeeming}
          error={redeemError}
          onCancel={() => (redeeming ? null : setConfirming(false))}
          onConfirm={handleRedeem}
        />
      ) : null}
    </CustomerShell>
  );
}
