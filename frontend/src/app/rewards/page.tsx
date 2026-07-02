"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Gift, Star, MapPin, AlertCircle, RefreshCw, Ticket } from "lucide-react";
import { CustomerShell } from "@/components/layout/customer-shell";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { type Reward } from "@/lib/loyalty/types";

export default function RewardCatalogPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <CustomerShell showHeader={false} topbarRight={null}>
      {/* Header */}
      <div className="bg-polks-brand px-5 pb-4 pt-4">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 text-[13px] font-medium text-white/50"
          >
            <ArrowLeft size={16} />
            Kembali
          </button>
          <Link
            href="/redeem-history"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white"
          >
            <Ticket size={14} />
            Voucher Saya
          </Link>
        </div>
        <h1 className="text-[22px] font-bold tracking-[-0.02em] text-white">Reward Catalog</h1>
        <p className="mt-1 text-[13px] text-white/50">
          Tukar poin resmi kamu dengan reward pilihan.
        </p>
        <div
          className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-[rgba(246,184,75,0.2)] px-4 py-2"
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

      <div className="flex flex-col gap-5 bg-polks-bg px-5 pb-28 pt-5">
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
          <div className="rounded-2xl border border-polks-border bg-white p-5 text-center">
            <p className="text-sm text-polks-muted">Belum ada reward yang tersedia.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {rewards.map((reward) => {
              const soldOut = reward.stock <= 0;
              const affordable = points >= reward.pointCost;
              return (
                <Link
                  key={reward.id}
                  href={`/rewards/${reward.id}`}
                  className="flex flex-col gap-3 rounded-2xl border border-polks-border bg-white p-4"
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
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </CustomerShell>
  );
}
