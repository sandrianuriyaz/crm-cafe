"use client";

import { ShieldCheck } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { MetricCard, AdminTable, AdminBadge, SectionHeader } from "@/components/admin/admin-ui";

const records = [
  { key: "TRX-001-CAFE-A-20260612", event: "transaction.completed", outcome: "processed", outlet: "Cafe A", time: "12 Jun 14:22:01", ttl: "24h" },
  { key: "TRX-002-CAFE-B-20260612", event: "transaction.completed", outcome: "processed", outlet: "Cafe B", time: "12 Jun 10:05:33", ttl: "24h" },
  { key: "TRX-001-CAFE-A-20260612", event: "transaction.completed", outcome: "skipped", outlet: "Cafe A", time: "12 Jun 14:22:02", ttl: "24h" },
  { key: "TRX-003-CAFE-C-20260611", event: "transaction.completed", outcome: "processed", outlet: "Cafe C", time: "11 Jun 16:48:12", ttl: "22h" },
  { key: "MBR-20260612-NEW-001", event: "member.registered", outcome: "processed", outlet: "—", time: "12 Jun 08:21:45", ttl: "24h" },
];

export default function AdminIdempotencyPage() {
  return (
    <AdminShell title="Idempotency">
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <MetricCard label="Total Records" value={records.length} Icon={ShieldCheck} accent />
          <MetricCard label="Processed" value={records.filter((r) => r.outcome === "processed").length} />
          <MetricCard label="Skipped (Dup.)" value={records.filter((r) => r.outcome === "skipped").length} />
        </div>

        <div className="rounded-xl bg-polks-surface px-4 py-3">
          <p className="text-xs leading-relaxed text-polks-brand">
            <strong>Idempotency</strong> mencegah pemrosesan ganda event webhook yang sama. Tiap key disimpan
            sementara (TTL 24 jam) & dicek sebelum diproses; event duplikat dilewati otomatis.
          </p>
        </div>

        <SectionHeader title={`${records.length} Records`} />
        <AdminTable
          columns={["Key", "Event", "Outcome", "Outlet", "Waktu", "TTL"]}
          rows={records.map((r) => [
            <span key="k" className="break-all font-mono text-[11px] font-semibold text-polks-text">{r.key}</span>,
            <span key="e" className="font-mono text-[11px] text-polks-muted">{r.event}</span>,
            <AdminBadge key="o" label={r.outcome} type={r.outcome === "processed" ? "success" : "warning"} />,
            r.outlet,
            <span key="t" className="text-[11px] text-polks-muted">{r.time}</span>,
            <span key="ttl" className="text-[11px] text-polks-muted">{r.ttl}</span>,
          ])}
        />
        <p className="text-center text-[11px] text-polks-muted">Data contoh — menunggu endpoint <code>/admin/idempotency-keys</code>.</p>
      </div>
    </AdminShell>
  );
}
