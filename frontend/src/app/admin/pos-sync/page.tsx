"use client";

import { useEffect, useState } from "react";
import { Zap, Store, CheckCircle2, Clock } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { MetricCard, AdminTable, SectionHeader } from "@/components/admin/admin-ui";
import { api } from "@/lib/api";

type StoreSyncRow = {
  storeId: string | null;
  transactionCount: number;
  lastOccurredAt: string | null;
  lastCreatedAt: string | null;
};

function lastSync(row: StoreSyncRow) {
  const iso = row.lastOccurredAt ?? row.lastCreatedAt;
  return iso ? new Date(iso).toLocaleString("id-ID") : "—";
}

export default function AdminPosSyncPage() {
  const [items, setItems] = useState<StoreSyncRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ items: StoreSyncRow[] }>("/admin/pos-sync")
      .then((res) => setItems(res.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalStore = items.length;
  const totalTransaksi = items.reduce((sum, r) => sum + r.transactionCount, 0);
  const storeAktif = items.filter((r) => r.transactionCount > 0).length;

  return (
    <AdminShell title="POS Sync">
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <MetricCard label="Total Store" value={totalStore} Icon={Store} accent sub="Store tersinkron" />
          <MetricCard label="Total Transaksi" value={totalTransaksi.toLocaleString("id-ID")} Icon={Zap} sub="Transaksi masuk" />
          <MetricCard label="Store Aktif" value={storeAktif} Icon={CheckCircle2} sub="Pernah transaksi" />
          <MetricCard label="Store Tanpa Transaksi" value={totalStore - storeAktif} Icon={Clock} sub="Belum ada transaksi" />
        </div>

        <SectionHeader title="Sinkronisasi per Store" />
        <AdminTable
          columns={["Store ID", "Jumlah Transaksi", "Transaksi Terakhir"]}
          empty={loading ? "Memuat…" : "Belum ada sinkronisasi."}
          rows={items.map((r) => [
            <span key="s" className="font-mono text-[11px]">{r.storeId ?? "—"}</span>,
            <span key="c" className="font-semibold">{r.transactionCount.toLocaleString("id-ID")}</span>,
            <span key="t" className="text-[11px] text-polks-muted">{lastSync(r)}</span>,
          ])}
        />
      </div>
    </AdminShell>
  );
}
