"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { MetricCard, AdminTable, SectionHeader } from "@/components/admin/admin-ui";
import { api } from "@/lib/api";

type IdempotencyKey = {
  idempotencyKey: string;
  posOrderId: string | null;
  posOrderNumber: string | null;
  memberId: string | null;
  pointsAwarded: number;
  createdAt: string;
};
type Paginated = {
  total: number;
  skip: number;
  take: number;
  items: IdempotencyKey[];
};

export default function AdminIdempotencyPage() {
  const [data, setData] = useState<Paginated | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Paginated>("/admin/idempotency-keys")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const withMember = items.filter((r) => r.memberId !== null).length;
  const totalPoints = items.reduce((sum, r) => sum + r.pointsAwarded, 0);

  return (
    <AdminShell title="Idempotency">
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <MetricCard label="Total Keys" value={loading ? "—" : total} Icon={ShieldCheck} accent />
          <MetricCard label="Dengan Member" value={loading ? "—" : withMember} />
          <MetricCard label="Total Poin" value={loading ? "—" : totalPoints} />
        </div>

        <div className="rounded-xl bg-polks-surface px-4 py-3">
          <p className="text-xs leading-relaxed text-polks-brand">
            <strong>Idempotency</strong> mencegah pemrosesan ganda event webhook yang sama. Tiap key disimpan
            & dicek sebelum diproses; event duplikat dilewati otomatis.
          </p>
        </div>

        <SectionHeader title={loading ? "Records" : `${total} Records`} />
        <AdminTable
          columns={["Idempotency Key", "Order ID", "No. Order", "Poin", "Waktu"]}
          empty={loading ? "Memuat…" : "Belum ada record."}
          rows={items.map((r) => [
            <span key="k" className="block max-w-[220px] truncate font-mono text-[11px] font-semibold text-polks-text">
              {r.idempotencyKey}
            </span>,
            <span key="oid" className="font-mono text-[11px] text-polks-muted">{r.posOrderId ?? "—"}</span>,
            <span key="onum" className="font-mono text-[11px] text-polks-muted">{r.posOrderNumber ?? "—"}</span>,
            <span key="p" className="font-semibold text-polks-success">+{r.pointsAwarded}</span>,
            <span key="t" className="text-[11px] text-polks-muted">
              {new Date(r.createdAt).toLocaleString("id-ID")}
            </span>,
          ])}
        />
      </div>
    </AdminShell>
  );
}
