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
  minPurchase: number;
  freeItemName: string;
  outletIds: string[];
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
  minPurchase: 0,
  freeItemName: "",
  outletIds: [],
};

const TYPE_OPTIONS: { value: RewardType; label: string }[] = [
  { value: "DISCOUNT_AMOUNT", label: "Diskon Rupiah" },
  { value: "DISCOUNT_PERCENT", label: "Diskon Persen" },
  { value: "FREE_ITEM", label: "Item Gratis" },
  { value: "MANUAL", label: "Manual (hadiah fisik)" },
];

const STATUS_FILTERS = ["Semua", "ACTIVE", "INACTIVE"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function chipClass(active: boolean) {
  return (
    "h-8 rounded-full px-3 text-xs font-semibold transition-colors " +
    (active
      ? "bg-polks-brand text-white"
      : "border-[1.5px] border-polks-border bg-white text-polks-muted")
  );
}

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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Semua");
  const [typeFilter, setTypeFilter] = useState<RewardType | "Semua">("Semua");
  const list = useAdminList<Reward>("/admin/rewards", {
    searchable: true,
    params: {
      status: statusFilter !== "Semua" ? statusFilter : undefined,
      type: typeFilter !== "Semua" ? typeFilter : undefined,
    },
  });
  const [editing, setEditing] = useState<Reward | "new" | null>(null);

  async function remove(r: Reward) {
    if (!confirm(`Nonaktifkan reward "${r.name}"?`)) return;
    try {
      await api(`/admin/rewards/${r.id}`, { method: "DELETE" });
      list.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menonaktifkan");
    }
  }

  return (
    <AdminShell title="Rewards">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setStatusFilter(f)}
              className={chipClass(statusFilter === f)}
            >
              {f === "Semua" ? "Semua" : f === "ACTIVE" ? "Aktif" : "Nonaktif"}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTypeFilter("Semua")}
            className={chipClass(typeFilter === "Semua")}
          >
            Semua Tipe
          </button>
          {TYPE_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setTypeFilter(o.value)}
              className={chipClass(typeFilter === o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>

        <SectionHeader
          title={`Katalog Reward (${list.total})`}
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

        <AdminDataTable
          list={list}
          searchable
          searchPlaceholder="Cari nama / deskripsi..."
          columns={["Nama", "Poin", "Stok", "Tipe", "Status", "Aksi"]}
          empty="Belum ada reward."
          renderRow={(r) => [
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
          ]}
        />
      </div>

      {editing ? (
        <RewardForm
          reward={editing === "new" ? null : editing}
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
          minPurchase: reward.minPurchase ?? 0,
          freeItemName: reward.freeItemName ?? "",
          outletIds: reward.outlets?.map((o) => o.outlet.id) ?? [],
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
      // value & minPurchase hanya untuk tipe diskon; freeItemName hanya untuk
      // item gratis. Selain itu dikirim null agar ter-reset saat ganti tipe.
      value: isDiscount ? Number(d.value) : null,
      minPurchase: isDiscount && d.minPurchase > 0 ? Number(d.minPurchase) : null,
      freeItemName: d.type === "FREE_ITEM" ? d.freeItemName || null : null,
      outletIds: d.outletIds,
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

          {(d.type === "DISCOUNT_AMOUNT" || d.type === "DISCOUNT_PERCENT") ? (
            <div>
              <label className="mb-1 block text-xs font-semibold text-polks-text">
                Minimal Belanja (Rp, opsional)
              </label>
              <input
                type="number"
                min={0}
                className={field}
                value={d.minPurchase}
                onChange={(e) => set("minPurchase", Number(e.target.value))}
                placeholder="mis. 50000"
              />
              <p className="mt-1 text-[10px] text-polks-muted">
                Informasi buat kasir — dibaca manual, belum divalidasi otomatis oleh sistem.
              </p>
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
