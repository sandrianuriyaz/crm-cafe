"use client";

import { Zap, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { MetricCard, AdminTable, AdminBadge, SectionHeader } from "@/components/admin/admin-ui";

const outbox = [
  { id: "OUT-001", type: "point_awarded", member: "Sandria", trxId: "TRX-001", pts: 55, outlet: "Cafe A", status: "delivered", attempt: 1, time: "14:22:03" },
  { id: "OUT-002", type: "point_awarded", member: "Budi Santoso", trxId: "TRX-002", pts: 38, outlet: "Cafe B", status: "delivered", attempt: 1, time: "10:05:35" },
  { id: "OUT-003", type: "point_awarded", member: "Rina Dewi", trxId: "TRX-003", pts: 72, outlet: "Cafe C", status: "failed", attempt: 3, time: "16:48:15" },
  { id: "OUT-004", type: "point_awarded", member: "Agus Pratama", trxId: "TRX-004", pts: 45, outlet: "Cafe A", status: "pending", attempt: 0, time: "09:30:57" },
];

const conns = [
  { outlet: "Cafe A", pos: "POS-BANDUNG-01", status: "connected", lastSync: "2 mnt lalu" },
  { outlet: "Cafe B", pos: "POS-TASIK-01", status: "connected", lastSync: "5 mnt lalu" },
  { outlet: "Cafe C", pos: "POS-JKT-01", status: "error", lastSync: "34 mnt lalu" },
];

const STATUS = { delivered: "success", failed: "error", pending: "warning" } as const;

export default function AdminPosSyncPage() {
  return (
    <AdminShell title="POS Sync">
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <MetricCard label="Outbox Items" value={outbox.length} Icon={Zap} accent />
          <MetricCard label="Delivered" value={outbox.filter((o) => o.status === "delivered").length} Icon={CheckCircle2} />
          <MetricCard label="Pending" value={outbox.filter((o) => o.status === "pending").length} Icon={Clock} />
          <MetricCard label="Failed" value={outbox.filter((o) => o.status === "failed").length} Icon={AlertCircle} />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {conns.map((c) => (
            <div key={c.outlet} className="flex items-center justify-between rounded-xl border border-polks-border bg-white px-4 py-3.5">
              <div>
                <p className="text-[13px] font-semibold text-polks-text">{c.outlet}</p>
                <p className="font-mono text-[10px] text-polks-muted">{c.pos}</p>
                <p className="mt-1 text-[11px] text-polks-muted">Sync: {c.lastSync}</p>
              </div>
              <AdminBadge label={c.status === "connected" ? "Connected" : "Error"} type={c.status === "connected" ? "success" : "error"} />
            </div>
          ))}
        </div>

        <SectionHeader title="Outbox Queue" />
        <AdminTable
          columns={["ID", "Tipe", "Member", "Trx", "Poin", "Outlet", "Coba", "Status", "Waktu"]}
          rows={outbox.map((o) => [
            <span key="id" className="font-mono text-[10px] text-polks-muted">{o.id}</span>,
            <span key="t" className="font-mono text-[11px]">{o.type}</span>,
            o.member,
            <span key="trx" className="font-mono text-[11px]">{o.trxId}</span>,
            <span key="p" className="font-semibold text-polks-success">{o.pts ? `+${o.pts}` : "—"}</span>,
            o.outlet,
            o.attempt,
            <AdminBadge key="s" label={o.status} type={STATUS[o.status as keyof typeof STATUS]} />,
            <span key="w" className="text-[11px] text-polks-muted">{o.time}</span>,
          ])}
        />
        <p className="text-center text-[11px] text-polks-muted">Data contoh — menunggu endpoint <code>/admin/pos-sync</code>.</p>
      </div>
    </AdminShell>
  );
}
