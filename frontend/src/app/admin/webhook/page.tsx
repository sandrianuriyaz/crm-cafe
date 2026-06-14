"use client";

import { useState } from "react";
import { Webhook, ShieldCheck, AlertCircle, CheckCircle2, Search } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { MetricCard, AdminTable, AdminBadge, SectionHeader } from "@/components/admin/admin-ui";

const events = [
  { id: "WHK-001", event: "transaction.completed", outlet: "Cafe A", member: "Sandria", hmac: "verified", pts: 55, status: "success", idem: "unique", time: "12 Jun 14:22:01" },
  { id: "WHK-002", event: "transaction.completed", outlet: "Cafe B", member: "Budi Santoso", hmac: "verified", pts: 38, status: "success", idem: "unique", time: "12 Jun 10:05:33" },
  { id: "WHK-003", event: "transaction.completed", outlet: "Cafe C", member: "Rina Dewi", hmac: "failed", pts: 0, status: "error", idem: "unique", time: "11 Jun 16:48:12" },
  { id: "WHK-004", event: "member.registered", outlet: "—", member: "Dewi Lestari", hmac: "verified", pts: 0, status: "success", idem: "unique", time: "12 Jun 08:21:45" },
  { id: "WHK-005", event: "transaction.completed", outlet: "Cafe A", member: "Sandria", hmac: "verified", pts: 0, status: "skipped", idem: "duplicate", time: "12 Jun 14:22:02" },
];

const STATUS = { success: "success", error: "error", skipped: "warning" } as const;

export default function AdminWebhookPage() {
  const [search, setSearch] = useState("");
  const filtered = events.filter(
    (e) => e.event.includes(search) || e.member.toLowerCase().includes(search.toLowerCase()) || e.id.includes(search),
  );

  return (
    <AdminShell title="Webhook Inbox">
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <MetricCard label="Total Events" value={events.length} Icon={Webhook} accent />
          <MetricCard label="HMAC Verified" value={events.filter((e) => e.hmac === "verified").length} Icon={ShieldCheck} />
          <MetricCard label="Failed" value={events.filter((e) => e.status === "error").length} Icon={AlertCircle} />
          <MetricCard label="Duplicates" value={events.filter((e) => e.idem === "duplicate").length} Icon={CheckCircle2} />
        </div>

        <div className="relative flex items-center">
          <Search size={14} className="absolute left-3 text-[#8A959D]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari event / member..."
            className="h-10 w-full max-w-[280px] rounded-xl border-[1.5px] border-polks-border bg-white pl-9 pr-3 text-sm text-polks-text outline-none focus:border-polks-brand"
          />
        </div>

        <SectionHeader title={`${filtered.length} Event`} />
        <AdminTable
          columns={["Event", "Outlet", "Member", "HMAC", "Poin", "Status", "Waktu"]}
          rows={filtered.map((e) => [
            <span key="e" className="font-mono text-[11px] font-semibold text-polks-brand">{e.event}</span>,
            e.outlet,
            e.member,
            <AdminBadge key="h" label={e.hmac === "verified" ? "Verified" : "Failed"} type={e.hmac === "verified" ? "success" : "error"} />,
            <span key="p" className="font-semibold text-polks-success">{e.pts ? `+${e.pts}` : "—"}</span>,
            <AdminBadge key="s" label={e.status} type={STATUS[e.status as keyof typeof STATUS]} />,
            <span key="t" className="text-[11px] text-polks-muted">{e.time}</span>,
          ])}
        />
        <p className="text-center text-[11px] text-polks-muted">Data contoh — menunggu endpoint <code>/admin/webhooks</code> (model <code>pos_sync_logs</code>).</p>
      </div>
    </AdminShell>
  );
}
