"use client";

import { Store, Users, Zap, MapPin, Phone, Clock } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { MetricCard, AdminBadge, SectionHeader } from "@/components/admin/admin-ui";

const outlets = [
  { id: "OUT-001", name: "Cafe A", city: "Bandung", address: "Jl. Braga No. 12, Bandung 40111", phone: "+62 22 1234 5678", hours: "08.00–22.00", members: 482 },
  { id: "OUT-002", name: "Cafe B", city: "Tasikmalaya", address: "Jl. HZ Mustofa No. 45, Tasikmalaya 46111", phone: "+62 265 123 4567", hours: "08.00–21.00", members: 391 },
  { id: "OUT-003", name: "Cafe C", city: "Jakarta", address: "Jl. Kemang Raya No. 88, Jakarta Selatan 12730", phone: "+62 21 1234 5678", hours: "09.00–22.00", members: 375 },
];

export default function AdminOutletsPage() {
  return (
    <AdminShell title="Outlets">
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <MetricCard label="Total Outlets" value={outlets.length} sub="Semua aktif" Icon={Store} accent />
          <MetricCard label="Total Members" value="1.248" sub="Lintas outlet" Icon={Users} />
          <MetricCard label="Transaksi (bln)" value="857" sub="Bulan ini" Icon={Zap} />
        </div>

        <SectionHeader title="Semua Outlet" />
        <div className="flex flex-col gap-3">
          {outlets.map((o) => (
            <div key={o.id} className="rounded-2xl border border-polks-border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-polks-surface">
                    <Store size={18} className="text-polks-brand" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-polks-text">{o.name} — {o.city}</p>
                    <p className="font-mono text-[10px] text-polks-muted">{o.id}</p>
                  </div>
                </div>
                <AdminBadge label="Aktif" type="success" />
              </div>
              <div className="mt-3 flex flex-col gap-1.5 border-t border-polks-surface pt-3 text-[12px] text-polks-muted">
                <span className="flex items-center gap-2"><MapPin size={13} /> {o.address}</span>
                <span className="flex items-center gap-2"><Clock size={13} /> {o.hours}</span>
                <span className="flex items-center gap-2"><Phone size={13} /> {o.phone}</span>
                <span className="flex items-center gap-2"><Users size={13} /> {o.members} member</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-[11px] text-polks-muted">Data contoh — menunggu endpoint <code>/admin/outlets</code>.</p>
      </div>
    </AdminShell>
  );
}
