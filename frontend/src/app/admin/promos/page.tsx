"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminTable, AdminBadge, SectionHeader } from "@/components/admin/admin-ui";
import { api, ApiError } from "@/lib/api";
import { type Promo } from "@/lib/loyalty/types";

type Draft = {
  title: string;
  description: string;
  imageUrl: string;
  startAt: string; // yyyy-mm-dd
  endAt: string;
  status: "ACTIVE" | "INACTIVE";
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
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Promo | "new" | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPromos(await api<Promo[]>("/admin/promos"));
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 401)) {
        setError(err instanceof Error ? err.message : "Gagal memuat promo");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(p: Promo) {
    if (!confirm(`Nonaktifkan promo "${p.title}"?`)) return;
    try {
      await api(`/admin/promos/${p.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menonaktifkan");
    }
  }

  return (
    <AdminShell title="Promotions">
      <div className="flex flex-col gap-4">
        <SectionHeader
          title={`Promo${promos.length ? ` (${promos.length})` : ""}`}
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

        {error ? (
          <div className="rounded-2xl border border-polks-border bg-white p-6 text-center text-sm text-polks-muted">
            {error}
          </div>
        ) : (
          <AdminTable
            columns={["Judul", "Periode", "Status", "Aksi"]}
            empty={loading ? "Memuat…" : "Belum ada promo."}
            rows={promos.map((p) => [
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
            ])}
          />
        )}
      </div>

      {editing ? (
        <PromoForm
          promo={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
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
        }
      : { title: "", description: "", imageUrl: "", startAt: "", endAt: "", status: "ACTIVE" },
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
            <label className="mb-1 block text-xs font-semibold text-polks-text">URL Gambar Banner</label>
            <input
              className={field}
              value={d.imageUrl}
              onChange={(e) => set("imageUrl", e.target.value)}
              placeholder="https://… (rasio 16:9, mis. 1200×675)"
            />
            {d.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={d.imageUrl}
                alt="Pratinjau banner"
                className="mt-2 aspect-[16/9] w-full rounded-xl border border-polks-border object-cover"
              />
            ) : (
              <p className="mt-1 text-[10px] text-polks-muted">
                Opsional. Rasio 16:9 (mis. 1200×675) supaya tampil rapi.
              </p>
            )}
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
