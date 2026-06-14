"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CustomerShell } from "@/components/layout/customer-shell";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { type Paginated, type PointHistory } from "@/lib/loyalty/types";

// Tampilan per-tipe mutasi poin.
function entryView(type: string) {
  switch (type) {
    case "earn":
      return { icon: "storefront", label: "Poin masuk" };
    case "redeem":
      return { icon: "card_giftcard", label: "Tukar reward" };
    case "adjust":
      return { icon: "tune", label: "Penyesuaian" };
    case "reverse":
      return { icon: "undo", label: "Pembatalan" };
    default:
      return { icon: "receipt_long", label: type };
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type FilterValue = "all" | "in" | "out";
const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "in", label: "Masuk" },
  { value: "out", label: "Keluar" },
];

export default function HistoryPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [entries, setEntries] = useState<PointHistory[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterValue>("all");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api<Paginated<PointHistory>>(
        "/member/point-histories?take=50",
      );
      setEntries(data.items);
      setTotal(data.total);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Gagal memuat histori");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Total poin yang pernah masuk (mutasi positif).
  const totalEarned = useMemo(
    () => entries.filter((e) => e.points > 0).reduce((s, e) => s + e.points, 0),
    [entries],
  );

  const visible = useMemo(
    () =>
      entries.filter((e) =>
        filter === "all" ? true : filter === "in" ? e.points >= 0 : e.points < 0,
      ),
    [entries, filter],
  );

  return (
    <CustomerShell showHeader={false} topbarRight={null}>
      {/* Header navy + ringkasan */}
      <div className="bg-polks-brand px-5 pb-6 pt-4">
        <h1 className="text-[22px] font-bold tracking-[-0.02em] text-white">Riwayat Poin</h1>
        <p className="mt-1 text-[13px] text-white/50">Semua mutasi poin kamu di POLKS.</p>

        <div className="mt-4 flex gap-3">
          <div
            className="flex-1 rounded-2xl border border-[rgba(246,184,75,0.2)] px-4 py-3"
            style={{ background: "linear-gradient(135deg,#1A2830 0%,#2A3D4D 45%,#2D3A28 100%)" }}
          >
            <p className="text-[10px] text-white/45">Total Diperoleh</p>
            <p className="text-xl font-bold tracking-[-0.02em] text-[#F6B84B]">
              +{totalEarned.toLocaleString("id-ID")}
              <span className="ml-0.5 text-xs font-semibold">pts</span>
            </p>
          </div>
          <div className="flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.08] px-4 py-3">
            <p className="text-[10px] text-white/45">Saldo Saat Ini</p>
            <p className="text-xl font-bold tracking-[-0.02em] text-white">
              {(user?.pointBalance ?? 0).toLocaleString("id-ID")}
              <span className="ml-0.5 text-xs font-semibold">pts</span>
            </p>
          </div>
        </div>
      </div>

      {/* Wave */}
      <div className="bg-polks-brand leading-none">
        <svg viewBox="0 0 390 28" preserveAspectRatio="none" className="block h-7 w-full">
          <path d="M0,0 Q195,28 390,0 L390,28 L0,28 Z" fill="#F6F8FA" />
        </svg>
      </div>

      <div className="flex flex-col gap-5 bg-polks-bg px-5 pb-28">
        {/* Filter */}
        <div className="flex items-center gap-2">
          <Icon name="filter_list" className="size-4 shrink-0 text-polks-muted" />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={cn(
                  "h-8 shrink-0 whitespace-nowrap rounded-full px-3 text-xs font-semibold transition-colors",
                  filter === f.value
                    ? "bg-polks-brand text-white"
                    : "border border-polks-border bg-white text-polks-muted",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <span className="ml-auto shrink-0 text-xs text-polks-muted">
            {total.toLocaleString("id-ID")} mutasi
          </span>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex animate-pulse items-center gap-3 rounded-2xl border border-polks-border bg-white p-4"
              >
                <div className="size-10 shrink-0 rounded-xl bg-polks-surface" />
                <div className="flex-1">
                  <div className="mb-2 h-4 w-1/2 rounded bg-polks-surface" />
                  <div className="h-3 w-1/3 rounded bg-polks-surface" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-polks-border bg-white p-5 text-center">
            <Icon name="error" className="size-10 text-polks-error" />
            <p className="text-sm text-polks-muted">{error}</p>
            <Button variant="outline" onClick={load}>
              <Icon name="refresh" className="size-5" />
              Coba lagi
            </Button>
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-polks-border bg-white p-8 text-center">
            <p className="text-sm text-polks-muted">
              {entries.length === 0
                ? "Belum ada riwayat poin."
                : "Tidak ada mutasi pada filter ini."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {visible.map((e) => {
              const isEarn = e.points >= 0;
              const view = entryView(e.type);
              const pointsLabel = `${isEarn ? "+" : "-"}${Math.abs(
                e.points,
              ).toLocaleString("id-ID")}`;
              return (
                <div
                  key={e.id}
                  className="rounded-2xl border border-polks-border bg-white p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-polks-surface text-polks-brand">
                        <Icon name={view.icon} className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-polks-text">
                          {e.note ?? view.label}
                        </p>
                        <p className="text-xs text-polks-muted">
                          {view.label} · {formatDate(e.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className={cn(
                          "text-sm font-bold",
                          isEarn ? "text-polks-success" : "text-polks-error",
                        )}
                      >
                        {pointsLabel}
                        <span className="ml-0.5 text-[11px] font-semibold">
                          pts
                        </span>
                      </p>
                      <p className="text-xs text-polks-muted">
                        Saldo {e.balanceAfter.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-[11px] leading-relaxed text-polks-muted">
          Poin dihitung dari transaksi setelah sinkronisasi POS.
        </p>
      </div>
    </CustomerShell>
  );
}
