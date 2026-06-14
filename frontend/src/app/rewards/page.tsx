"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Gift,
  Star,
  MapPin,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { CustomerShell } from "@/components/layout/customer-shell";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  LAST_REDEEM_KEY,
  type RedeemResult,
  type Reward,
} from "@/lib/loyalty/types";

// Backend Reward belum punya kategori, jadi chip ini visual (semua selalu tampil).
const categories = ["Semua", "Voucher", "Minuman", "Makanan"];

export default function RewardCatalogPage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState("Semua");

  const [confirming, setConfirming] = useState<Reward | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  const points = user?.pointBalance ?? 0;

  async function loadRewards() {
    setLoading(true);
    setError(null);
    try {
      const data = await api<Reward[]>("/rewards");
      setRewards(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Gagal memuat katalog reward");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRewards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRedeem(reward: Reward) {
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

  return (
    <CustomerShell showHeader={false} topbarRight={null}>
      {/* Header */}
      <div className="bg-polks-brand px-5 pb-6 pt-4">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mb-4 flex items-center gap-1.5 text-[13px] font-medium text-white/50"
        >
          <ArrowLeft size={16} />
          Kembali
        </button>
        <h1 className="text-[22px] font-bold tracking-[-0.02em] text-white">Reward Catalog</h1>
        <p className="mt-1 text-[13px] text-white/50">
          Tukar poin resmi kamu dengan reward pilihan.
        </p>
        <div
          className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-[rgba(246,184,75,0.2)] px-4 py-2.5"
          style={{ background: "linear-gradient(135deg,#1A2830 0%,#2A3D4D 45%,#2D3A28 100%)" }}
        >
          <Star size={13} color="#F6B84B" fill="#F6B84B" />
          <span className="text-[13px] font-bold text-[#F6B84B]">
            {points.toLocaleString("id-ID")} pts
          </span>
          <span className="text-[11px] text-white/40">saldo kamu</span>
        </div>
      </div>

      {/* Wave */}
      <div className="bg-polks-brand leading-none">
        <svg viewBox="0 0 390 28" preserveAspectRatio="none" className="block h-7 w-full">
          <path d="M0,0 Q195,28 390,0 L390,28 L0,28 Z" fill="#F6F8FA" />
        </svg>
      </div>

      <div className="flex flex-col gap-5 bg-polks-bg px-5 pb-28">
        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setActive(c)}
              className={
                "h-8 shrink-0 whitespace-nowrap rounded-full px-3.5 text-xs font-semibold transition-colors " +
                (active === c
                  ? "bg-polks-brand text-white"
                  : "border-[1.5px] border-polks-border bg-white text-polks-muted")
              }
            >
              {c}
            </button>
          ))}
        </div>

        {/* States */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex h-44 animate-pulse flex-col gap-3 rounded-2xl border border-polks-border bg-white p-4"
              >
                <div className="size-10 rounded-xl bg-polks-surface" />
                <div className="h-3 w-2/3 rounded bg-polks-surface" />
                <div className="h-3 w-1/3 rounded bg-polks-surface" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-polks-border bg-white p-5 text-center">
            <AlertCircle size={36} color="#E04F4F" />
            <p className="text-sm text-polks-muted">{error}</p>
            <button
              type="button"
              onClick={loadRewards}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-polks-brand px-4 text-sm font-semibold text-white"
            >
              <RefreshCw size={15} />
              Coba lagi
            </button>
          </div>
        ) : rewards.length === 0 ? (
          <div className="rounded-2xl border border-polks-border bg-white p-8 text-center">
            <p className="text-sm text-polks-muted">Belum ada reward yang tersedia.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {rewards.map((reward) => {
              const soldOut = reward.stock <= 0;
              const affordable = points >= reward.pointCost;
              return (
                <button
                  key={reward.id}
                  type="button"
                  disabled={soldOut}
                  onClick={() => {
                    setRedeemError(null);
                    setConfirming(reward);
                  }}
                  className="flex flex-col gap-3 rounded-2xl border border-polks-border bg-white p-4 text-left disabled:opacity-60"
                >
                  <div
                    className={
                      "flex size-10 items-center justify-center rounded-xl " +
                      (affordable && !soldOut ? "bg-polks-point-soft" : "bg-polks-surface")
                    }
                  >
                    <Gift size={18} color={affordable && !soldOut ? "#F6B84B" : "#8A959D"} />
                  </div>
                  <div className="flex-1">
                    <p className="mb-1.5 line-clamp-2 text-[13px] font-semibold text-polks-text">
                      {reward.name}
                    </p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-polks-surface px-2 py-0.5 text-[11px] font-semibold text-[#374151]">
                      <Star size={10} color="#F6B84B" fill="#F6B84B" />
                      {reward.pointCost.toLocaleString("id-ID")} pts
                    </span>
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-[#8A959D]">
                      <MapPin size={9} color="#8A959D" />
                      All Outlets
                    </div>
                  </div>
                  {soldOut ? (
                    <span className="text-[10px] font-semibold text-polks-error">Stok habis</span>
                  ) : !affordable ? (
                    <span className="text-[10px] font-semibold text-polks-muted">
                      Butuh {(reward.pointCost - points).toLocaleString("id-ID")} pts lagi
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Konfirmasi Penukaran (bottom sheet) */}
      {confirming ? (
        <RedeemSheet
          reward={confirming}
          points={points}
          redeeming={redeeming}
          error={redeemError}
          onCancel={() => (redeeming ? null : setConfirming(null))}
          onConfirm={() => handleRedeem(confirming)}
        />
      ) : null}
    </CustomerShell>
  );
}

function RedeemSheet({
  reward,
  points,
  redeeming,
  error,
  onCancel,
  onConfirm,
}: {
  reward: Reward;
  points: number;
  redeeming: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const remaining = points - reward.pointCost;
  const canRedeem = remaining >= 0 && reward.stock > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <button
        type="button"
        aria-label="Tutup"
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
      />
      <div className="relative z-10 flex w-full max-w-[420px] flex-col gap-4 rounded-t-[24px] bg-polks-bg p-5 md:rounded-[24px]">
        <h2 className="text-lg font-bold text-polks-text">Konfirmasi Penukaran</h2>

        {/* Reward preview */}
        <div className="overflow-hidden rounded-2xl border border-polks-border">
          <div
            className="flex items-center gap-3.5 px-[18px] py-4"
            style={{ background: "linear-gradient(135deg,#25343F 0%,#3a5068 100%)" }}
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[rgba(246,184,75,0.2)]">
              <Gift size={20} color="#F6B84B" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-white">{reward.name}</p>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-white/40">
                <MapPin size={10} />
                All Outlets
              </div>
            </div>
          </div>
          {reward.description ? (
            <div className="bg-white px-[18px] py-3.5">
              <p className="text-xs leading-relaxed text-polks-muted">{reward.description}</p>
            </div>
          ) : null}
        </div>

        {/* Points breakdown */}
        <div className="flex flex-col gap-3 rounded-2xl border border-polks-border bg-white p-4">
          <p className="text-[13px] font-semibold text-polks-text">Detail Poin</p>
          <div className="flex justify-between text-[13px]">
            <span className="text-polks-muted">Saldo saat ini</span>
            <span className="font-semibold text-polks-text">{points.toLocaleString("id-ID")} pts</span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-polks-muted">Poin yang digunakan</span>
            <span className="font-semibold text-polks-error">
              − {reward.pointCost.toLocaleString("id-ID")} pts
            </span>
          </div>
          <div className="h-px bg-polks-surface" />
          <div className="flex justify-between">
            <span className="text-[13px] font-semibold text-polks-text">Sisa setelah tukar</span>
            <span
              className={
                "text-[15px] font-bold " +
                (remaining >= 0 ? "text-polks-success" : "text-polks-error")
              }
            >
              {remaining.toLocaleString("id-ID")} pts
            </span>
          </div>
        </div>

        {/* Warning / error */}
        {error ? (
          <div className="flex items-start gap-3 rounded-2xl border border-[rgba(224,79,79,0.4)] bg-[#FDECEC] px-4 py-3">
            <AlertCircle size={15} color="#E04F4F" className="mt-0.5 shrink-0" />
            <p className="text-xs leading-relaxed text-polks-error">{error}</p>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-2xl border border-[rgba(246,184,75,0.4)] bg-polks-point-soft px-4 py-3">
            <AlertCircle size={15} color="#92400E" className="mt-0.5 shrink-0" />
            <p className="text-xs leading-relaxed text-[#92400E]">
              Penukaran poin <strong>tidak dapat dibatalkan</strong> setelah dikonfirmasi.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={redeeming || !canRedeem}
            onClick={onConfirm}
            className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[14px] bg-polks-smile text-sm font-bold text-white disabled:opacity-50"
          >
            <Gift size={16} />
            {redeeming
              ? "Memproses…"
              : !canRedeem
                ? "Poin tidak cukup"
                : "Konfirmasi Penukaran"}
          </button>
          <button
            type="button"
            disabled={redeeming}
            onClick={onCancel}
            className="h-[50px] w-full rounded-[14px] border-[1.5px] border-polks-border bg-white text-sm font-semibold text-polks-brand disabled:opacity-50"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
