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
      <div className="space-y-lg">
        {/* Header + Balance card */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md">
          <div>
            <h1 className="font-page-title text-page-title text-on-surface">
              Reward Catalog
            </h1>
            <p className="font-body text-body text-on-surface-variant mt-xs">
              Explore and redeem your points.
            </p>
          </div>

          <div className="bg-primary text-on-primary rounded-xl p-md shadow-sm border border-outline-variant/20 flex items-center gap-md min-w-[200px]">
            <div className="bg-primary-fixed text-on-primary-fixed p-sm rounded-full flex items-center justify-center">
              <Icon name="stars" className="size-5" />
            </div>
            <div>
              <div className="font-caption text-caption text-primary-fixed-dim">
                Available Balance
              </div>
              <div className="font-card-title text-card-title font-bold">
                {(user?.pointBalance ?? 0).toLocaleString("id-ID")} pts
              </div>
            </div>
          </div>
        </div>

        {/* Category chips */}
        <div className="flex gap-sm overflow-x-auto pb-xs">
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
          <div className="grid grid-cols-2 gap-lg">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-surface rounded-xl border border-outline-variant overflow-hidden flex flex-col h-full animate-pulse"
              >
                <div className="h-40 bg-surface-container-high" />
                <div className="p-md">
                  <div className="h-4 w-2/3 rounded bg-surface-container-high" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-outline-variant bg-surface p-lg flex flex-col items-center text-center gap-md">
            <Icon name="error" className="size-10 text-error" />
            <p className="font-body text-body text-on-surface-variant">{error}</p>
            <Button variant="outline" onClick={loadRewards}>
              <Icon name="refresh" />
              Coba lagi
            </Button>
          </div>
        ) : rewards.length === 0 ? (
          <div className="rounded-xl border border-outline-variant bg-surface p-lg text-center">
            <p className="font-body text-body text-on-surface-variant">
              Belum ada reward yang tersedia.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-lg">
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
          <div className="relative z-10 w-full max-w-[420px] rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-lg shadow-lg">
            <h2 className="font-card-title text-card-title text-on-surface">
              Tukar reward?
            </h2>
            <p className="mt-xs font-body text-body text-on-surface-variant">
              Kamu akan menukar{" "}
              <span className="font-body-semibold text-on-surface">
                {confirming.name}
              </span>{" "}
              seharga{" "}
              <span className="font-body-semibold text-primary">
                {confirming.pointCost.toLocaleString("id-ID")} pts
              </span>
              . Saldo kamu saat ini{" "}
              {(user?.pointBalance ?? 0).toLocaleString("id-ID")} pts.
            </p>

            {redeemError ? (
              <div className="mt-md flex items-center gap-sm rounded-lg bg-error-container px-md py-sm text-on-error-container">
                <Icon name="error" className="size-5 shrink-0" />
                <span className="font-body text-body">{redeemError}</span>
              </div>
            ) : null}

            <div className="mt-lg flex gap-sm">
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
