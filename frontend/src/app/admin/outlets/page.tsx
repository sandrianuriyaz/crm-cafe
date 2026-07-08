"use client";

import { useState } from "react";
import { Store, MapPin, Phone, Clock, CheckCircle2, Plus, X } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { MetricCard, AdminBadge, SectionHeader } from "@/components/admin/admin-ui";
import { AdminListToolbar, AdminPagination } from "@/components/admin/admin-data-table";
import { useAdminList } from "@/components/admin/use-admin-list";
import { api } from "@/lib/api";

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
  const [editing, setEditing] = useState<Outlet | "new" | null>(null);

  async function deactivate(o: Outlet) {
    if (!confirm(`Nonaktifkan outlet "${o.name}"?`)) return;
    try {
      await api(`/admin/outlets/${o.id}`, { method: "PATCH", body: { status: "INACTIVE" } });
      list.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menonaktifkan");
    }
  }

  return (
    <AdminShell title="Outlets">
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <MetricCard label="Total Outlets" value={list.total} sub="Semua outlet" Icon={Store} accent />
          <MetricCard label="Outlet Aktif" value={activeCount} sub="Halaman ini" Icon={CheckCircle2} />
        </div>

        <SectionHeader
          title="Semua Outlet"
          action={
            <button
              type="button"
              onClick={() => setEditing("new")}
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-polks-brand px-3 text-xs font-bold text-white"
            >
              <Plus size={14} />
              Tambah Outlet
            </button>
          }
        />
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
                <div className="mt-3 flex gap-2 border-t border-polks-surface pt-3">
                  <button
                    type="button"
                    onClick={() => setEditing(o)}
                    className="rounded-lg border border-polks-border px-2.5 py-1 text-[11px] font-semibold text-polks-brand hover:bg-polks-surface"
                  >
                    Edit
                  </button>
                  {o.status === "ACTIVE" ? (
                    <button
                      type="button"
                      onClick={() => deactivate(o)}
                      className="rounded-lg border border-polks-error/40 px-2.5 py-1 text-[11px] font-semibold text-polks-error hover:bg-[#FDECEC]"
                    >
                      Nonaktifkan
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}

        {!list.loading && list.total > 0 ? <AdminPagination list={list} /> : null}
      </div>

      {editing ? (
        <OutletForm
          outlet={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            list.reload();
          }}
        />
      ) : null}
    </AdminShell>
  );
}

type Draft = {
  name: string;
  city: string;
  address: string;
  hours: string;
  phone: string;
  status: "ACTIVE" | "INACTIVE";
  storeId: string;
};

const emptyDraft: Draft = {
  name: "",
  city: "",
  address: "",
  hours: "",
  phone: "",
  status: "ACTIVE",
  storeId: "",
};

function OutletForm({
  outlet,
  onClose,
  onSaved,
}: {
  outlet: Outlet | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [d, setD] = useState<Draft>(
    outlet
      ? {
          name: outlet.name,
          city: outlet.city ?? "",
          address: outlet.address ?? "",
          hours: outlet.hours ?? "",
          phone: outlet.phone ?? "",
          status: outlet.status,
          storeId: outlet.storeId ?? "",
        }
      : emptyDraft,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof Draft>(k: K, v: Draft[K]) {
    setD((prev) => ({ ...prev, [k]: v }));
  }

  async function submit() {
    if (d.name.trim().length < 2) {
      setError("Nama minimal 2 karakter.");
      return;
    }
    setSaving(true);
    setError(null);
    const body = {
      name: d.name,
      city: d.city || undefined,
      address: d.address || undefined,
      hours: d.hours || undefined,
      phone: d.phone || undefined,
      status: d.status,
      storeId: d.storeId || undefined,
    };
    try {
      if (outlet) {
        await api(`/admin/outlets/${outlet.id}`, { method: "PATCH", body });
      } else {
        await api("/admin/outlets", { method: "POST", body });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
      setSaving(false);
    }
  }

  const field = "h-10 w-full rounded-xl border-[1.5px] border-polks-border bg-white px-3 text-sm text-polks-text outline-none focus:border-polks-brand";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Tutup" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-[440px] overflow-y-auto rounded-2xl bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-polks-text">{outlet ? "Edit Outlet" : "Tambah Outlet"}</h2>
          <button type="button" onClick={onClose} aria-label="Tutup" className="text-polks-muted">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-polks-text">Nama</label>
            <input className={field} value={d.name} onChange={(e) => set("name", e.target.value)} placeholder="mis. POLKS Braga" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-polks-text">Kota</label>
              <input className={field} value={d.city} onChange={(e) => set("city", e.target.value)} placeholder="mis. Bandung" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-polks-text">Telepon</label>
              <input className={field} value={d.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+62 22 1234 5678" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-polks-text">Alamat</label>
            <textarea
              className="min-h-[64px] w-full rounded-xl border-[1.5px] border-polks-border bg-white p-3 text-sm text-polks-text outline-none focus:border-polks-brand"
              value={d.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Jl. Braga No. 12, Bandung 40111"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-polks-text">Jam Buka</label>
            <input className={field} value={d.hours} onChange={(e) => set("hours", e.target.value)} placeholder="Senin–Minggu, 08.00–22.00" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-polks-text">Status</label>
            <select className={field} value={d.status} onChange={(e) => set("status", e.target.value as Draft["status"])}>
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Nonaktif</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-polks-text">Store ID (opsional)</label>
            <input className={field} value={d.storeId} onChange={(e) => set("storeId", e.target.value)} placeholder="ID dari sistem POS" />
            <p className="mt-1 text-[10px] text-polks-muted">
              Dipakai untuk mencocokkan transaksi dari POS ke outlet ini.
            </p>
          </div>

          {error ? <p className="text-[13px] text-polks-error">{error}</p> : null}

          <div className="mt-1 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-11 flex-1 rounded-xl border-[1.5px] border-polks-border bg-white text-sm font-semibold text-polks-brand"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={submit}
              className="h-11 flex-1 rounded-xl bg-polks-brand text-sm font-bold text-white disabled:opacity-60"
            >
              {saving ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
