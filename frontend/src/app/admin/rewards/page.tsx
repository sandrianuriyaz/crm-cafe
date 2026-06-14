"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminTable, AdminBadge, SectionHeader } from "@/components/admin/admin-ui";
import { api, ApiError } from "@/lib/api";
import { type Reward } from "@/lib/loyalty/types";

type Draft = {
  name: string;
  description: string;
  imageUrl: string;
  pointCost: number;
  stock: number;
  status: "ACTIVE" | "INACTIVE";
};

const emptyDraft: Draft = {
  name: "",
  description: "",
  imageUrl: "",
  pointCost: 100,
  stock: 0,
  status: "ACTIVE",
};

export default function AdminRewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Reward | "new" | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRewards(await api<Reward[]>("/admin/rewards"));
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 401)) {
        setError(err instanceof Error ? err.message : "Gagal memuat reward");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(r: Reward) {
    if (!confirm(`Nonaktifkan reward "${r.name}"?`)) return;
    try {
      await api(`/admin/rewards/${r.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menonaktifkan");
    }
  }

  return (
    <AdminShell title="Rewards">
      <div className="flex flex-col gap-4">
        <SectionHeader
          title={`Katalog Reward${rewards.length ? ` (${rewards.length})` : ""}`}
          action={
            <button
              type="button"
              onClick={() => setEditing("new")}
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-polks-brand px-3 text-xs font-bold text-white"
            >
              <Plus size={14} />
              Tambah Reward
            </button>
          }
        />

        {error ? (
          <div className="rounded-2xl border border-polks-border bg-white p-6 text-center text-sm text-polks-muted">
            {error}
          </div>
        ) : (
          <AdminTable
            columns={["Nama", "Poin", "Stok", "Status", "Aksi"]}
            empty={loading ? "Memuat…" : "Belum ada reward."}
            rows={rewards.map((r) => [
              <div key="n">
                <p className="font-semibold text-polks-text">{r.name}</p>
                {r.description ? (
                  <p className="line-clamp-1 text-[11px] text-polks-muted">{r.description}</p>
                ) : null}
              </div>,
              <span key="p" className="font-semibold">{r.pointCost.toLocaleString("id-ID")}</span>,
              r.stock,
              <AdminBadge
                key="s"
                label={r.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
                type={r.status === "ACTIVE" ? "success" : "neutral"}
              />,
              <div key="a" className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(r)}
                  className="rounded-lg border border-polks-border px-2.5 py-1 text-[11px] font-semibold text-polks-brand hover:bg-polks-surface"
                >
                  Edit
                </button>
                {r.status === "ACTIVE" ? (
                  <button
                    type="button"
                    onClick={() => remove(r)}
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
        <RewardForm
          reward={editing === "new" ? null : editing}
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

function RewardForm({
  reward,
  onClose,
  onSaved,
}: {
  reward: Reward | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [d, setD] = useState<Draft>(
    reward
      ? {
          name: reward.name,
          description: reward.description ?? "",
          imageUrl: reward.imageUrl ?? "",
          pointCost: reward.pointCost,
          stock: reward.stock,
          status: reward.status,
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
      description: d.description || undefined,
      imageUrl: d.imageUrl || undefined,
      pointCost: Number(d.pointCost),
      stock: Number(d.stock),
      status: d.status,
    };
    try {
      if (reward) {
        await api(`/admin/rewards/${reward.id}`, { method: "PATCH", body });
      } else {
        await api("/admin/rewards", { method: "POST", body });
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
          <h2 className="text-base font-bold text-polks-text">{reward ? "Edit Reward" : "Tambah Reward"}</h2>
          <button type="button" onClick={onClose} aria-label="Tutup" className="text-polks-muted">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-polks-text">Nama</label>
            <input className={field} value={d.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-polks-text">Deskripsi</label>
            <textarea
              className="min-h-[72px] w-full rounded-xl border-[1.5px] border-polks-border bg-white p-3 text-sm text-polks-text outline-none focus:border-polks-brand"
              value={d.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-polks-text">Poin</label>
              <input type="number" className={field} value={d.pointCost} onChange={(e) => set("pointCost", Number(e.target.value))} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-polks-text">Stok</label>
              <input type="number" className={field} value={d.stock} onChange={(e) => set("stock", Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-polks-text">Gambar (URL, opsional)</label>
            <input className={field} value={d.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://…" />
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
