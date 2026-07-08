"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminBadge, SectionHeader } from "@/components/admin/admin-ui";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { useAdminList } from "@/components/admin/use-admin-list";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { OutletMultiSelect } from "@/components/admin/outlet-multi-select";
import { api } from "@/lib/api";
import { type Promo } from "@/lib/loyalty/types";

type Draft = {
  title: string;
  description: string;
  imageUrl: string;
  startAt: string; // yyyy-mm-dd
  endAt: string;
  status: "ACTIVE" | "INACTIVE";
  outletIds: string[];
};

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}
function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminPromosPage() {
  const list = useAdminList<Promo>("/admin/promos", { searchable: true });
  const [editing, setEditing] = useState<Promo | "new" | null>(null);

  async function remove(p: Promo) {
    if (!confirm(`Nonaktifkan promo "${p.title}"?`)) return;
    try {
      await api(`/admin/promos/${p.id}`, { method: "DELETE" });
      list.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menonaktifkan");
    }
  }

  return (
    <AdminShell title="Promotions">
      <div className="flex flex-col gap-4">
        <SectionHeader
          title={`Promo (${list.total})`}
          action={
            <button
              type="button"
              onClick={() => setEditing("new")}
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-polks-brand px-3 text-xs font-bold text-white"
            >
              <Plus size={14} />
              Tambah Promo
            </button>
          }
        />

        <AdminDataTable
          list={list}
          searchable
          searchPlaceholder="Cari judul / deskripsi..."
          columns={["Judul", "Periode", "Status", "Aksi"]}
          empty="Belum ada promo."
          renderRow={(p) => [
            <div key="t">
              <p className="font-semibold text-polks-text">{p.title}</p>
              {p.description ? (
                <p className="line-clamp-1 text-[11px] text-polks-muted">{p.description}</p>
              ) : null}
            </div>,
            <span key="pr" className="text-[11px]">
              {fmt(p.startAt)} – {fmt(p.endAt)}
            </span>,
            <AdminBadge
              key="s"
              label={p.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
              type={p.status === "ACTIVE" ? "success" : "neutral"}
            />,
            <div key="a" className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditing(p)}
                className="rounded-lg border border-polks-border px-2.5 py-1 text-[11px] font-semibold text-polks-brand hover:bg-polks-surface"
              >
                Edit
              </button>
              {p.status === "ACTIVE" ? (
                <button
                  type="button"
                  onClick={() => remove(p)}
                  className="rounded-lg border border-polks-error/40 px-2.5 py-1 text-[11px] font-semibold text-polks-error hover:bg-[#FDECEC]"
                >
                  Nonaktifkan
                </button>
              ) : null}
            </div>,
          ]}
        />
      </div>

      {editing ? (
        <PromoForm
          promo={editing === "new" ? null : editing}
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

function PromoForm({
  promo,
  onClose,
  onSaved,
}: {
  promo: Promo | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [d, setD] = useState<Draft>(
    promo
      ? {
          title: promo.title,
          description: promo.description ?? "",
          imageUrl: promo.imageUrl ?? "",
          startAt: toDateInput(promo.startAt),
          endAt: toDateInput(promo.endAt),
          status: promo.status,
          outletIds: promo.outlets?.map((o) => o.outlet.id) ?? [],
        }
      : {
          title: "",
          description: "",
          imageUrl: "",
          startAt: "",
          endAt: "",
          status: "ACTIVE",
          outletIds: [],
        },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof Draft>(k: K, v: Draft[K]) {
    setD((prev) => ({ ...prev, [k]: v }));
  }

  async function submit() {
    if (d.title.trim().length < 2) {
      setError("Judul minimal 2 karakter.");
      return;
    }
    setSaving(true);
    setError(null);
    const body = {
      title: d.title,
      description: d.description || undefined,
      imageUrl: d.imageUrl.trim() || null,
      startAt: d.startAt ? new Date(d.startAt).toISOString() : undefined,
      endAt: d.endAt ? new Date(d.endAt).toISOString() : undefined,
      status: d.status,
      outletIds: d.outletIds,
    };
    try {
      if (promo) {
        await api(`/admin/promos/${promo.id}`, { method: "PATCH", body });
      } else {
        await api("/admin/promos", { method: "POST", body });
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
          <h2 className="text-base font-bold text-polks-text">{promo ? "Edit Promo" : "Tambah Promo"}</h2>
          <button type="button" onClick={onClose} aria-label="Tutup" className="text-polks-muted">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-polks-text">Judul</label>
            <input className={field} value={d.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-polks-text">Deskripsi</label>
            <textarea
              className="min-h-[72px] w-full rounded-xl border-[1.5px] border-polks-border bg-white p-3 text-sm text-polks-text outline-none focus:border-polks-brand"
              value={d.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-polks-text">Gambar Banner</label>
            <ImageUploadField
              value={d.imageUrl}
              onChange={(url) => set("imageUrl", url)}
              folder="promos"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-polks-text">Mulai</label>
              <input type="date" className={field} value={d.startAt} onChange={(e) => set("startAt", e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-polks-text">Berakhir</label>
              <input type="date" className={field} value={d.endAt} onChange={(e) => set("endAt", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-polks-text">Status</label>
            <select className={field} value={d.status} onChange={(e) => set("status", e.target.value as Draft["status"])}>
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Nonaktif</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-polks-text">Outlet (opsional)</label>
            <OutletMultiSelect value={d.outletIds} onChange={(ids) => set("outletIds", ids)} />
            <p className="mt-1 text-[10px] text-polks-muted">
              Tidak pilih outlet manapun = berlaku/relevan di semua outlet.
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
