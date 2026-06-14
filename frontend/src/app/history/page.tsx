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
    <CustomerShell>
      <div className="flex flex-col gap-5 px-5 pb-28 pt-5">
        {/* Header */}
        <div>
          <h1 className="text-[22px] font-black text-polks-text">
            Riwayat Poin
          </h1>
          <p className="mt-1 text-sm text-polks-muted">
            Semua mutasi poin kamu di POLKS.
          </p>
        </div>

        {/* Ringkasan */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-2xl border border-polks-border bg-white p-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-polks-surface">
              <Icon name="trending_up" className="size-5 text-polks-success" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-polks-muted">Total Diperoleh</div>
              <div className="text-base font-bold text-polks-success">
                +{totalEarned.toLocaleString("id-ID")}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-polks-brand p-4 text-white shadow-[0_12px_32px_rgba(37,52,63,0.22)]">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-polks-point-soft">
              <Icon name="stars" fill className="size-5 text-polks-point" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-white/55">Saldo Saat Ini</div>
              <div className="text-base font-bold text-white">
                {(user?.pointBalance ?? 0).toLocaleString("id-ID")}
              </div>
            </div>
          </div>
        </div>

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
