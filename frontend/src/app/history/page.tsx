"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CustomerShell } from "@/components/layout/customer-shell";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
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

export default function HistoryPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [entries, setEntries] = useState<PointHistory[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <CustomerShell maxWidth="max-w-5xl">
      {/* Header */}
      <div className="mb-lg">
        <h1 className="font-page-title text-page-title text-on-surface mb-2">
          Transaction History
        </h1>
        <p className="font-body text-body text-on-surface-variant">
          Review all recent transactions and point allocations.
        </p>
      </div>

      {/* Summary */}
      <div className="mb-lg grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex flex-col justify-between">
          <div>
            <h3 className="font-card-title text-card-title text-on-surface mb-1">
              Saldo Poin
            </h3>
            <p className="font-caption text-caption text-on-surface-variant">
              Saldo poin kamu saat ini
            </p>
          </div>
          <div className="mt-6 flex items-end gap-3">
            <span className="text-4xl font-bold tracking-tight text-primary">
              {(user?.pointBalance ?? 0).toLocaleString("id-ID")}
            </span>
            <span className="font-body-semibold text-body-semibold text-primary pb-1">
              pts
            </span>
          </div>
        </div>

        <div className="col-span-1 bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
          <div>
            <h3 className="font-card-title text-card-title text-on-surface mb-1">
              Total Mutasi
            </h3>
            <p className="font-caption text-caption text-on-surface-variant">
              Jumlah catatan poin
            </p>
          </div>
          <div className="mt-6 flex items-end gap-2">
            <span className="text-3xl font-bold tracking-tight text-on-surface">
              {total.toLocaleString("id-ID")}
            </span>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
          <h3 className="font-section-title text-section-title text-on-surface">
            Recent Transactions
          </h3>
        </div>

        {loading ? (
          <div className="divide-y divide-outline-variant">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 animate-pulse flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-container-high" />
                <div className="flex-1">
                  <div className="h-4 w-1/2 rounded bg-surface-container-high mb-2" />
                  <div className="h-3 w-1/3 rounded bg-surface-container-high" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-lg flex flex-col items-center text-center gap-md">
            <Icon name="error" className="size-10 text-error" />
            <p className="font-body text-body text-on-surface-variant">{error}</p>
            <Button variant="outline" onClick={load}>
              <Icon name="refresh" />
              Coba lagi
            </Button>
          </div>
        ) : entries.length === 0 ? (
          <div className="p-lg text-center">
            <p className="font-body text-body text-on-surface-variant">
              Belum ada riwayat poin.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant">
            {entries.map((e) => {
              const isEarn = e.points >= 0;
              const view = entryView(e.type);
              const pointsLabel = `${isEarn ? "+" : "-"}${Math.abs(
                e.points,
              ).toLocaleString("id-ID")} pts`;
              return (
                <div key={e.id} className="p-4 hover:bg-surface-container-low transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary">
                        <Icon name={view.icon} />
                      </div>
                      <div>
                        <h4 className="font-body-semibold text-body-semibold text-on-surface">
                          {e.note ?? view.label}
                        </h4>
                        <p className="font-caption text-caption text-on-surface-variant">
                          {view.label} • {formatDate(e.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={
                          "font-body-semibold text-body-semibold " +
                          (isEarn ? "text-on-success-container" : "text-error")
                        }
                      >
                        {pointsLabel}
                      </div>
                      <div className="font-caption text-caption text-on-surface-variant">
                        Saldo: {e.balanceAfter.toLocaleString("id-ID")}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </CustomerShell>
  );
}
