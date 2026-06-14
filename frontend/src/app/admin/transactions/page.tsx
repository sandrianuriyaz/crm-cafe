"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminTable, SectionHeader, AdminBadge } from "@/components/admin/admin-ui";
import { api, ApiError } from "@/lib/api";
import { type Paginated } from "@/lib/loyalty/types";

type AdminTxn = {
  id: string;
  posOrderNumber: string;
  memberId: string | null;
  grandTotal: string | number;
  pointsAwarded: number;
  paymentMethod: string | null;
  storeId: string | null;
  occurredAt: string | null;
  createdAt: string;
};

function rp(v: string | number) {
  return "Rp" + Number(v).toLocaleString("id-ID");
}
function dateTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminTransactionsPage() {
  const [data, setData] = useState<Paginated<AdminTxn> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Paginated<AdminTxn>>("/admin/transactions?take=50")
      .then(setData)
      .catch((err) => {
        if (!(err instanceof ApiError && err.status === 401)) {
          setError(err instanceof Error ? err.message : "Gagal memuat transaksi");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminShell title="POS Transactions">
      <div className="flex flex-col gap-4">
        <SectionHeader title={`Transaksi POS${data ? ` (${data.total})` : ""}`} />
        {error ? (
          <div className="rounded-2xl border border-polks-border bg-white p-6 text-center text-sm text-polks-muted">
            {error}
          </div>
        ) : (
          <AdminTable
            columns={["Order", "Member", "Nominal", "Poin", "Metode", "Outlet", "Waktu"]}
            empty={loading ? "Memuat…" : "Belum ada transaksi POS."}
            rows={(data?.items ?? []).map((t) => [
              <span key="o" className="font-mono text-[11px] font-semibold">{t.posOrderNumber}</span>,
              t.memberId ? (
                <span key="m" className="font-mono text-[11px]">{t.memberId.slice(0, 10)}…</span>
              ) : (
                <AdminBadge key="m" label="Guest" type="neutral" />
              ),
              <span key="g" className="font-semibold text-polks-text">{rp(t.grandTotal)}</span>,
              <span key="p" className="font-semibold text-polks-success">+{t.pointsAwarded}</span>,
              t.paymentMethod ?? "—",
              t.storeId ?? "—",
              dateTime(t.occurredAt ?? t.createdAt),
            ])}
          />
        )}
      </div>
    </AdminShell>
  );
}
