"use client";

import { Store, MapPin, Phone, Clock, CheckCircle2 } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { MetricCard, AdminBadge, SectionHeader } from "@/components/admin/admin-ui";
import { AdminListToolbar, AdminPagination } from "@/components/admin/admin-data-table";
import { useAdminList } from "@/components/admin/use-admin-list";

type Outlet = {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  hours: string | null;
  phone: string | null;
  status: "ACTIVE" | "INACTIVE";
  storeId: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function AdminOutletsPage() {
  const list = useAdminList<Outlet>("/admin/outlets", { searchable: true });
  const activeCount = list.items.filter((o) => o.status === "ACTIVE").length;

  return (
    <AdminShell title="Outlets">
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <MetricCard label="Total Outlets" value={list.total} sub="Semua outlet" Icon={Store} accent />
          <MetricCard label="Outlet Aktif" value={activeCount} sub="Halaman ini" Icon={CheckCircle2} />
        </div>

        <SectionHeader title="Semua Outlet" />
        <AdminListToolbar list={list} searchable searchPlaceholder="Cari nama / kota / alamat..." />

        {list.loading ? (
          <p className="text-center text-[11px] text-polks-muted">Memuat…</p>
        ) : list.error ? (
          <p className="text-center text-[11px] text-polks-muted">{list.error}</p>
        ) : list.total === 0 ? (
          <p className="text-center text-[11px] text-polks-muted">Tidak ada outlet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {list.items.map((o) => (
              <div key={o.id} className="rounded-2xl border border-polks-border bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-polks-surface">
                      <Store size={18} className="text-polks-brand" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-polks-text">
                        {o.name}
                        {o.city ? ` — ${o.city}` : ""}
                      </p>
                      <p className="font-mono text-[10px] text-polks-muted">{o.id}</p>
                    </div>
                  </div>
                  {o.status === "ACTIVE" ? (
                    <AdminBadge label="Aktif" type="success" />
                  ) : (
                    <AdminBadge label="Nonaktif" type="neutral" />
                  )}
                </div>
                <div className="mt-3 flex flex-col gap-1.5 border-t border-polks-surface pt-3 text-[12px] text-polks-muted">
                  {o.address ? (
                    <span className="flex items-center gap-2">
                      <MapPin size={13} /> {o.address}
                    </span>
                  ) : null}
                  {o.hours ? (
                    <span className="flex items-center gap-2">
                      <Clock size={13} /> {o.hours}
                    </span>
                  ) : null}
                  {o.phone ? (
                    <span className="flex items-center gap-2">
                      <Phone size={13} /> {o.phone}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}

        {!list.loading && list.total > 0 ? <AdminPagination list={list} /> : null}
      </div>
    </AdminShell>
  );
}
