"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminTable, AdminBadge, SectionHeader } from "@/components/admin/admin-ui";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { api, ApiError } from "@/lib/api";
import { type Reward, type RewardType } from "@/lib/loyalty/types";

type Draft = {
  name: string;
  description: string;
  imageUrl: string;
  pointCost: number;
  stock: number;
  status: "ACTIVE" | "INACTIVE";
  type: RewardType;
  value: number;
  freeItemName: string;
};

const emptyDraft: Draft = {
  name: "",
  description: "",
  imageUrl: "",
  pointCost: 100,
  stock: 0,
  status: "ACTIVE",
  type: "MANUAL",
  value: 0,
  freeItemName: "",
};

const TYPE_OPTIONS: { value: RewardType; label: string }[] = [
  { value: "DISCOUNT_AMOUNT", label: "Diskon Rupiah" },
  { value: "DISCOUNT_PERCENT", label: "Diskon Persen" },
  { value: "FREE_ITEM", label: "Item Gratis" },
  { value: "MANUAL", label: "Manual (hadiah fisik)" },
];

// Label tipe reward untuk tabel (termasuk nilai/item-nya).
function rewardTypeLabel(r: Reward): string {
  switch (r.type) {
    case "DISCOUNT_AMOUNT":
      return `Diskon Rp${(r.value ?? 0).toLocaleString("id-ID")}`;
    case "DISCOUNT_PERCENT":
      return `Diskon ${r.value ?? 0}%`;
    case "FREE_ITEM":
      return `Gratis ${r.freeItemName ?? "—"}`;
    default:
      return "Manual";
  }
}

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
            columns={["Nama", "Poin", "Stok", "Tipe", "Status", "Aksi"]}
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
              <span key="t" className="text-[11px] font-medium text-polks-text">
                {rewardTypeLabel(r)}
              </span>,
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
          type: reward.type ?? "MANUAL",
          value: reward.value ?? 0,
          freeItemName: reward.freeItemName ?? "",
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
    const isDiscount =
      d.type === "DISCOUNT_AMOUNT" || d.type === "DISCOUNT_PERCENT";
    const body = {
      name: d.name,
      description: d.description || undefined,
      imageUrl: d.imageUrl || undefined,
      pointCost: Number(d.pointCost),
      stock: Number(d.stock),
      status: d.status,
      type: d.type,
      // value hanya untuk tipe diskon; freeItemName hanya untuk item gratis.
      // Selain itu dikirim null agar ter-reset saat ganti tipe.
      value: isDiscount ? Number(d.value) : null,
      freeItemName: d.type === "FREE_ITEM" ? d.freeItemName || null : null,
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
            <label className="mb-1 block text-xs font-semibold text-polks-text">Gambar (opsional)</label>
            <ImageUploadField
              value={d.imageUrl}
              onChange={(url) => set("imageUrl", url)}
              folder="rewards"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-polks-text">Status</label>
            <select className={field} value={d.status} onChange={(e) => set("status", e.target.value as Draft["status"])}>
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Nonaktif</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-polks-text">Tipe Reward</label>
            <select
              className={field}
              value={d.type}
              onChange={(e) => set("type", e.target.value as RewardType)}
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <p className="mt-1 text-[10px] text-polks-muted">
              Dibaca POS untuk menerapkan efek saat voucher di-redeem.
            </p>
          </div>

          {(d.type === "DISCOUNT_AMOUNT" || d.type === "DISCOUNT_PERCENT") ? (
            <div>
              <label className="mb-1 block text-xs font-semibold text-polks-text">
                {d.type === "DISCOUNT_AMOUNT" ? "Nilai Diskon (Rp)" : "Nilai Diskon (%)"}
              </label>
              <input
                type="number"
                min={0}
                max={d.type === "DISCOUNT_PERCENT" ? 100 : undefined}
                className={field}
                value={d.value}
                onChange={(e) => set("value", Number(e.target.value))}
                placeholder={d.type === "DISCOUNT_AMOUNT" ? "10000" : "0–100"}
              />
            </div>
          ) : null}

          {d.type === "FREE_ITEM" ? (
            <div>
              <label className="mb-1 block text-xs font-semibold text-polks-text">Nama Item Gratis</label>
              <input
                className={field}
                value={d.freeItemName}
                onChange={(e) => set("freeItemName", e.target.value)}
                placeholder="mis. Americano"
              />
            </div>
          ) : null}

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
