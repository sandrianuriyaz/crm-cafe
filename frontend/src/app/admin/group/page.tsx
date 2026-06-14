"use client";

import { Store, Users, Star } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { MetricCard, AdminTable, AdminBadge, SectionHeader } from "@/components/admin/admin-ui";

const outlets = [
  { name: "Cafe A", city: "Bandung", members: 482, pts: 89400 },
  { name: "Cafe B", city: "Tasikmalaya", members: 391, pts: 71200 },
  { name: "Cafe C", city: "Jakarta", members: 375, pts: 85200 },
];

const groupInfo = [
  { label: "Group ID", value: "GRP-POLKS-001" },
  { label: "Mata Uang", value: "IDR (Rp)" },
  { label: "Point Rate", value: "1 pt / Rp1.000" },
  { label: "Redeem Rate", value: "100 pts = Rp10.000" },
  { label: "Min Redeem", value: "500 pts" },
  { label: "Point Expiry", value: "12 bulan" },
];

export default function AdminGroupPage() {
  return (
    <AdminShell title="Group">
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <MetricCard label="Total Outlets" value={outlets.length} sub="Semua aktif" Icon={Store} accent />
          <MetricCard label="Total Members" value="1.248" sub="Lintas outlet" Icon={Users} />
          <MetricCard label="Points Issued" value="245.800" sub="Total grup" Icon={Star} />
        </div>

        {/* Group info */}
        <div className="rounded-2xl border border-polks-border bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-polks-brand">
                <Store size={20} className="text-polks-point" />
              </div>
              <div>
                <h2 className="text-base font-bold text-polks-text">POLKS Group</h2>
                <p className="text-xs text-polks-muted">F&amp;B Loyalty Group · Indonesia</p>
              </div>
            </div>
            <AdminBadge label="Aktif" type="success" />
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-polks-surface pt-4 sm:grid-cols-3">
            {groupInfo.map((g) => (
              <div key={g.label}>
                <p className="mb-1 text-[11px] text-polks-muted">{g.label}</p>
                <p className="text-[13px] font-semibold text-polks-text">{g.value}</p>
              </div>
            ))}
          </div>
        </div>

        <SectionHeader title="Outlet dalam Grup" />
        <AdminTable
          columns={["Outlet", "Kota", "Member", "Poin Terbit", "Status"]}
          rows={outlets.map((o) => [
            <span key="n" className="font-semibold text-polks-text">{o.name}</span>,
            o.city,
            o.members.toLocaleString("id-ID"),
            o.pts.toLocaleString("id-ID"),
            <AdminBadge key="s" label="Aktif" type="success" />,
          ])}
        />
        <p className="text-center text-[11px] text-polks-muted">Data contoh — menunggu endpoint <code>/admin/group</code>.</p>
      </div>
    </AdminShell>
  );
}
