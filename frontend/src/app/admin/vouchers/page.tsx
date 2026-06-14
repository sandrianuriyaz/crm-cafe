"use client";

import { useState } from "react";
import { Ticket, Copy } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminTable, AdminBadge, MetricCard, SectionHeader } from "@/components/admin/admin-ui";

// Data contoh — ganti dengan GET /admin/vouchers saat endpoint tersedia.
const vouchers = [
  { id: "VCH-001", code: "POLKS-2026-001", member: "Sandria", memberId: "POLKS-8492-331", value: "Rp25.000", outlet: "All Outlets", issued: "12 Jun 2026", expires: "31 Jul 2026", status: "active" as const },
  { id: "VCH-002", code: "POLKS-2026-002", member: "Rina Dewi", memberId: "POLKS-5612-087", value: "Rp25.000", outlet: "All Outlets", issued: "10 Jun 2026", expires: "31 Jul 2026", status: "used" as const },
  { id: "VCH-003", code: "POLKS-2026-003", member: "Budi Santoso", memberId: "POLKS-7231-204", value: "Rp50.000", outlet: "All Outlets", issued: "8 Jun 2026", expires: "31 Jul 2026", status: "active" as const },
  { id: "VCH-004", code: "POLKS-2026-004", member: "Agus Pratama", memberId: "POLKS-3901-552", value: "Rp25.000", outlet: "Cafe A only", issued: "5 Jun 2026", expires: "30 Jun 2026", status: "expired" as const },
];

const STATUS = { active: "success", used: "neutral", expired: "error" } as const;
const LABEL = { active: "Aktif", used: "Dipakai", expired: "Kedaluwarsa" } as const;
const FILTERS = ["Semua", "active", "used", "expired"] as const;

export default function AdminVouchersPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Semua");
  const filtered = vouchers.filter((v) => filter === "Semua" || v.status === filter);

  return (
    <AdminShell title="Vouchers">
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <MetricCard label="Total Issued" value={vouchers.length} Icon={Ticket} accent />
          <MetricCard label="Aktif" value={vouchers.filter((v) => v.status === "active").length} />
          <MetricCard label="Dipakai" value={vouchers.filter((v) => v.status === "used").length} />
          <MetricCard label="Kedaluwarsa" value={vouchers.filter((v) => v.status === "expired").length} />
        </div>

        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={
                "h-8 rounded-full px-3 text-xs font-semibold transition-colors " +
                (filter === f ? "bg-polks-brand text-white" : "border-[1.5px] border-polks-border bg-white text-polks-muted")
              }
            >
              {f === "Semua" ? "Semua" : LABEL[f as keyof typeof LABEL]}
            </button>
          ))}
        </div>

        <SectionHeader title={`${filtered.length} Voucher`} />
        <AdminTable
          columns={["Kode", "Member", "Nilai", "Outlet", "Terbit", "Berakhir", "Status"]}
          rows={filtered.map((v) => [
            <span key="c" className="inline-flex items-center gap-1.5">
              <span className="font-mono text-[11px] font-semibold text-polks-brand">{v.code}</span>
              <button type="button" onClick={() => navigator.clipboard?.writeText(v.code)} aria-label="Salin">
                <Copy size={11} className="text-polks-muted" />
              </button>
            </span>,
            <div key="m">
              <p className="font-semibold text-polks-text">{v.member}</p>
              <p className="font-mono text-[10px] text-polks-muted">{v.memberId}</p>
            </div>,
            <span key="v" className="font-semibold text-polks-point">{v.value}</span>,
            v.outlet,
            <span key="i" className="text-[11px] text-polks-muted">{v.issued}</span>,
            <span key="e" className="text-[11px] text-polks-muted">{v.expires}</span>,
            <AdminBadge key="s" label={LABEL[v.status]} type={STATUS[v.status]} />,
          ])}
        />
        <p className="text-center text-[11px] text-polks-muted">
          Data contoh — menunggu endpoint <code>/admin/vouchers</code>.
        </p>
      </div>
    </AdminShell>
  );
}
