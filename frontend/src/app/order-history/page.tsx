"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Store } from "lucide-react";
import { CustomerShell } from "@/components/layout/customer-shell";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { api, ApiError } from "@/lib/api";
import { formatRupiah } from "@/lib/loyalty/tier";
import { type Paginated, type Transaction } from "@/lib/loyalty/types";

function formatDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const PAGE_SIZE = 20;

export default function OrderHistoryPage() {
  const router = useRouter();

  const [entries, setEntries] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api<Paginated<Transaction>>(
        `/member/transactions?take=${PAGE_SIZE}`,
      );
      setEntries(data.items);
      setTotal(data.total);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Gagal memuat riwayat pesanan");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalSpend = entries.reduce((s, t) => s + t.grandTotal, 0);

  return (
    <CustomerShell showHeader={false} topbarRight={null}>
      <div className="bg-polks-brand px-5 pb-4 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Kembali"
          className="mb-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors active:bg-white/20"
        >
          <Icon name="arrow_back" className="size-[18px]" />
        </button>
        <h1 className="text-[22px] font-bold tracking-[-0.02em] text-white">Riwayat Pesanan</h1>
        <p className="mt-1 text-[13px] text-white/50">Semua pesanan kamu di POLKS.</p>

        <div className="mt-4 flex gap-3">
          <div className="flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.08] px-4 py-2.5">
            <p className="text-[10px] text-white/40">Jumlah Pesanan</p>
            <p className="text-[17px] font-bold tracking-[-0.02em] text-white">
              {total.toLocaleString("id-ID")}
            </p>
          </div>
          <div
            className="flex-1 rounded-2xl border border-[rgba(246,184,75,0.2)] px-4 py-2.5"
            style={{ background: "linear-gradient(135deg,#1A2830 0%,#2A3D4D 45%,#2D3A28 100%)" }}
          >
            <p className="text-[10px] text-white/45">Total Belanja</p>
            <p className="text-[17px] font-bold tracking-[-0.02em] text-[#F6B84B]">
              {formatRupiah(totalSpend)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-polks-brand leading-none">
        <svg viewBox="0 0 390 28" preserveAspectRatio="none" className="block h-7 w-full">
          <path d="M0,0 Q195,28 390,0 L390,28 L0,28 Z" fill="#F6F8FA" />
        </svg>
      </div>

      <div className="flex flex-col gap-5 bg-polks-bg px-5 pb-28">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-polks-border bg-polks-card p-4">
                <div className="mb-2 h-4 w-1/2 rounded bg-polks-surface" />
                <div className="h-3 w-1/3 rounded bg-polks-surface" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-polks-border bg-polks-card p-5 text-center">
            <Icon name="error" className="size-10 text-polks-error" />
            <p className="text-sm text-polks-muted">{error}</p>
            <Button variant="outline" onClick={load}>
              <Icon name="refresh" className="size-5" />
              Coba lagi
            </Button>
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border border-polks-border bg-polks-card p-5 text-center">
            <p className="text-sm text-polks-muted">Belum ada riwayat pesanan.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map((t) => (
              <div key={t.id} className="overflow-hidden rounded-2xl border border-polks-border bg-polks-card">
                <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-polks-surface">
                      <Store size={16} className="text-polks-text" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-polks-text">
                        {t.outletName ?? "Outlet tidak diketahui"}
                      </p>
                      <p className="text-[11px] text-polks-muted">
                        {formatDate(t.occurredAt ?? t.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-polks-success">
                    +{t.pointsAwarded.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-polks-border bg-polks-bg px-4 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    {t.posOrderNumber ? (
                      <span className="truncate text-[11px] text-polks-muted">{t.posOrderNumber}</span>
                    ) : null}
                    {t.paymentMethod ? (
                      <span className="rounded-md bg-polks-surface px-1.5 py-0.5 text-[10px] font-semibold text-polks-muted">
                        {t.paymentMethod}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-[12px] font-semibold text-polks-text">
                      {formatRupiah(t.grandTotal)}
                    </span>
                    {t.status ? (
                      <span className="rounded-md bg-polks-point-soft px-1.5 py-0.5 text-[10px] font-semibold text-polks-success">
                        {t.status}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CustomerShell>
  );
}
