"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CustomerShell } from "@/components/layout/customer-shell";
import { RewardCard } from "@/components/customer/reward-card";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Icon } from "@/components/ui/icon";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  LAST_REDEEM_KEY,
  type RedeemResult,
  type Reward,
} from "@/lib/loyalty/types";

// Catatan: backend Reward belum punya field "category", jadi chip di bawah
// tetap dirender (UI dipertahankan) namun tidak memfilter — semua reward aktif
// selalu tampil. Begitu backend menambah kategori, tinggal isi filter di sini.
const categories = [
  { value: "all", label: "All" },
  { value: "drinks", label: "Drinks" },
  { value: "pastry", label: "Pastry" },
  { value: "voucher", label: "Voucher" },
] as const;

export default function RewardCatalogPage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<(typeof categories)[number]["value"]>("all");

  // Reward yang sedang dikonfirmasi untuk ditukar (null = modal tertutup).
  const [confirming, setConfirming] = useState<Reward | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);

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
      setError(
        err instanceof Error ? err.message : "Gagal memuat katalog reward",
      );
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
      // Oper voucher asli ke halaman sukses + segarkan saldo poin.
      window.sessionStorage.setItem(LAST_REDEEM_KEY, JSON.stringify(result));
      await refreshProfile();
      router.push("/voucher-success");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/login");
        return;
      }
      setRedeemError(
        err instanceof Error ? err.message : "Redeem gagal, coba lagi",
      );
      setRedeeming(false);
    }
  }

  return (
    <CustomerShell>
      <div className="space-y-5 px-5 pb-28 pt-5">
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-[22px] font-black text-polks-text">
              Reward Catalog
            </h1>
            <p className="mt-1 text-sm text-polks-muted">
              Tukarkan poin dengan reward POLKS.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-polks-border bg-white p-4">
            <div className="flex size-11 items-center justify-center rounded-full bg-polks-point-soft">
              <Icon name="stars" fill className="size-5 text-polks-point" />
            </div>
            <div>
              <div className="text-xs text-polks-muted">
                Saldo Poin
              </div>
              <div className="text-base font-bold text-polks-text">
                {(user?.pointBalance ?? 0).toLocaleString("id-ID")} pts
              </div>
            </div>
          </div>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((c) => (
            <Chip
              key={c.value}
              active={active === c.value}
              onClick={() => setActive(c.value)}
            >
              {c.label}
            </Chip>
          ))}
        </div>

        {/* States */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex h-full animate-pulse flex-col overflow-hidden rounded-2xl border border-polks-border bg-white"
              >
                <div className="h-36 bg-polks-surface" />
                <div className="p-4">
                  <div className="h-4 w-2/3 rounded bg-polks-surface" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-polks-border bg-white p-5 text-center">
            <Icon name="error" className="size-10 text-error" />
            <p className="text-sm text-polks-muted">{error}</p>
            <Button variant="outline" onClick={loadRewards}>
              <Icon name="refresh" />
              Coba lagi
            </Button>
          </div>
        ) : rewards.length === 0 ? (
          <div className="rounded-2xl border border-polks-border bg-white p-5 text-center">
            <p className="text-sm text-polks-muted">
              Belum ada reward yang tersedia.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {rewards.map((reward) => {
              const soldOut = reward.stock <= 0;
              return (
                <button
                  key={reward.id}
                  type="button"
                  disabled={soldOut}
                  onClick={() => {
                    setRedeemError(null);
                    setConfirming(reward);
                  }}
                  className="block text-left disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RewardCard
                    title={reward.name}
                    points={reward.pointCost}
                    availability={soldOut ? "Stok habis" : undefined}
                    imageSrc={reward.imageUrl ?? undefined}
                    className="h-full"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Konfirmasi redeem */}
      {confirming ? (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-md">
          <button
            type="button"
            aria-label="Tutup"
            className="absolute inset-0 bg-black/40"
            onClick={() => (redeeming ? null : setConfirming(null))}
          />
          <div className="relative z-10 w-full max-w-[390px] rounded-t-[24px] border border-polks-border bg-white p-5 shadow-lg md:rounded-[24px]">
            <h2 className="text-base font-bold text-polks-text">
              Tukar reward?
            </h2>
            <p className="mt-2 text-sm leading-6 text-polks-muted">
              Kamu akan menukar{" "}
              <span className="font-semibold text-polks-text">
                {confirming.name}
              </span>{" "}
              seharga{" "}
              <span className="font-semibold text-polks-smile">
                {confirming.pointCost.toLocaleString("id-ID")} pts
              </span>
              . Saldo kamu saat ini{" "}
              {(user?.pointBalance ?? 0).toLocaleString("id-ID")} pts.
            </p>

            {redeemError ? (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-error-container px-4 py-3 text-on-error-container">
                <Icon name="error" className="size-5 shrink-0" />
                <span className="font-body text-body">{redeemError}</span>
              </div>
            ) : null}

            <div className="mt-5 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                disabled={redeeming}
                onClick={() => setConfirming(null)}
              >
                Batal
              </Button>
              <Button
                className="flex-1"
                disabled={redeeming}
                onClick={() => handleRedeem(confirming)}
              >
                {redeeming ? "Memproses..." : "Tukar sekarang"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </CustomerShell>
  );
}
