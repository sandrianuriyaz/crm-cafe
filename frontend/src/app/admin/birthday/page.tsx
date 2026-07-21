"use client";

import { useEffect, useState } from "react";
import { Cake, Save, Gift, Info } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { api } from "@/lib/api";
import { type RewardType } from "@/lib/loyalty/types";

type BirthdayConfig = {
  enabled: boolean;
  name: string;
  description: string | null;
  imageUrl: string | null;
  type: RewardType;
  value: number | null;
  minPurchase: number | null;
  freeItemName: string | null;
  voucherValidDays: number;
  updatedAt?: string;
};

const TYPE_OPTIONS: { value: RewardType; label: string }[] = [
  { value: "DISCOUNT_AMOUNT", label: "Diskon Rupiah" },
  { value: "DISCOUNT_PERCENT", label: "Diskon Persen" },
  { value: "FREE_ITEM", label: "Item Gratis" },
  { value: "MANUAL", label: "Manual (hadiah fisik)" },
];

export default function AdminBirthdayPage() {
  const [cfg, setCfg] = useState<BirthdayConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<string | null>(null);

  useEffect(() => {
    api<BirthdayConfig>("/admin/birthday")
      .then(setCfg)
      .catch(() => setError("Gagal memuat pengaturan."))
      .finally(() => setLoading(false));
  }, []);

  function patch<K extends keyof BirthdayConfig>(key: K, value: BirthdayConfig[K]) {
    setCfg((c) => (c ? { ...c, [key]: value } : c));
    setSaved(false);
  }

  async function handleSave() {
    if (!cfg || saving) return;
    if (cfg.name.trim().length < 2) {
      setError("Nama hadiah minimal 2 karakter.");
      return;
    }
    const isDiscount =
      cfg.type === "DISCOUNT_AMOUNT" || cfg.type === "DISCOUNT_PERCENT";
    if (cfg.type === "DISCOUNT_PERCENT" && (!cfg.value || cfg.value < 1 || cfg.value > 100)) {
      setError("Diskon persen harus antara 1 dan 100.");
      return;
    }
    if (cfg.type === "DISCOUNT_AMOUNT" && (!cfg.value || cfg.value < 1)) {
      setError("Nilai diskon rupiah wajib diisi.");
      return;
    }
    if (cfg.type === "FREE_ITEM" && !cfg.freeItemName?.trim()) {
      setError("Nama item gratis wajib diisi.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await api<BirthdayConfig>("/admin/birthday", {
        method: "PATCH",
        body: {
          enabled: cfg.enabled,
          name: cfg.name.trim(),
          description: cfg.description?.trim() || null,
          imageUrl: cfg.imageUrl || null,
          type: cfg.type,
          // Field yang tidak relevan dengan tipe dikirim null agar ter-reset
          // saat admin berganti tipe hadiah.
          value: isDiscount ? Number(cfg.value) : null,
          minPurchase:
            isDiscount && cfg.minPurchase && cfg.minPurchase > 0
              ? Number(cfg.minPurchase)
              : null,
          freeItemName: cfg.type === "FREE_ITEM" ? cfg.freeItemName || null : null,
          voucherValidDays: Number(cfg.voucherValidDays),
        },
      });
      setCfg(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  async function runNow() {
    setRunning(true);
    setRunResult(null);
    try {
      const r = await api<{
        granted: number; skipped: number; candidates: number; reason?: string;
      }>("/admin/birthday/run", { method: "POST" });
      setRunResult(
        r.reason
          ? `Tidak dijalankan: ${r.reason}.`
          : `${r.granted} voucher terbit dari ${r.candidates} member berulang tahun hari ini` +
            (r.skipped ? ` (${r.skipped} dilewati — sudah pernah dapat tahun ini).` : "."),
      );
    } catch (err) {
      setRunResult(err instanceof Error ? err.message : "Gagal menjalankan.");
    } finally {
      setRunning(false);
    }
  }

  const inputClass =
    "h-10 w-full rounded-[10px] border-[1.5px] border-polks-border bg-polks-bg px-3 text-[13px] text-polks-text outline-none focus:border-polks-brand focus:bg-white";
  const isDiscount =
    cfg?.type === "DISCOUNT_AMOUNT" || cfg?.type === "DISCOUNT_PERCENT";

  return (
    <AdminShell title="Hadiah Ulang Tahun">
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-3 rounded-xl border border-polks-border bg-white px-4 py-3">
          <Info size={16} className="mt-0.5 shrink-0 text-polks-brand" />
          <p className="text-xs leading-relaxed text-polks-muted">
            Tiap pagi sistem mencari member yang berulang tahun hari itu dan
            menerbitkan voucher langsung ke <b>Voucher Saya</b> mereka — tanpa
            perlu ditukar poin. Tiap member hanya dapat sekali per tahun. Hadiah
            di bawah ini berdiri sendiri: tidak muncul di katalog reward dan
            tidak bisa diklaim member lain.
          </p>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-polks-muted">Memuat pengaturan…</p>
        ) : !cfg ? (
          <p className="py-10 text-center text-sm text-polks-error">
            {error ?? "Pengaturan tidak tersedia."}
          </p>
        ) : (
          <>
            <div className="overflow-hidden rounded-2xl border border-polks-border bg-white">
              <div className="flex items-center gap-2 border-b border-polks-surface px-5 py-3.5">
                <Cake size={14} className="text-polks-brand" />
                <h3 className="text-[13px] font-bold text-polks-text">Pemberian Otomatis</h3>
              </div>
              <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
                <Field label="Status" hint="Matikan untuk menghentikan pemberian">
                  <button
                    type="button"
                    onClick={() => patch("enabled", !cfg.enabled)}
                    className={
                      "flex h-10 items-center rounded-[10px] border-[1.5px] px-3 text-[13px] font-semibold " +
                      (cfg.enabled
                        ? "border-polks-brand bg-polks-brand text-white"
                        : "border-polks-border bg-polks-bg text-polks-muted")
                    }
                  >
                    {cfg.enabled ? "Aktif" : "Nonaktif"}
                  </button>
                </Field>
                <Field label="Masa Berlaku Voucher" unit="hari" hint="Dihitung sejak voucher terbit">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={cfg.voucherValidDays}
                    onChange={(e) => patch("voucherValidDays", Number(e.target.value))}
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-polks-border bg-white">
              <div className="flex items-center gap-2 border-b border-polks-surface px-5 py-3.5">
                <Gift size={14} className="text-polks-brand" />
                <h3 className="text-[13px] font-bold text-polks-text">Hadiahnya</h3>
              </div>
              <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
                <Field label="Nama Hadiah" hint="Tampil di kartu voucher member">
                  <input
                    type="text"
                    value={cfg.name}
                    onChange={(e) => patch("name", e.target.value)}
                    placeholder="mis. Kopi Gratis Ulang Tahun"
                    className={inputClass}
                  />
                </Field>

                <Field label="Tipe Hadiah" hint="Dibaca POS saat voucher dipakai">
                  <select
                    value={cfg.type}
                    onChange={(e) => patch("type", e.target.value as RewardType)}
                    className={inputClass}
                  >
                    {TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Deskripsi (opsional)">
                    <textarea
                      value={cfg.description ?? ""}
                      onChange={(e) => patch("description", e.target.value)}
                      className="min-h-[70px] w-full rounded-[10px] border-[1.5px] border-polks-border bg-polks-bg p-3 text-[13px] text-polks-text outline-none focus:border-polks-brand focus:bg-white"
                    />
                  </Field>
                </div>

                {cfg.type === "DISCOUNT_PERCENT" ? (
                  <Field label="Nilai Diskon" unit="%" hint="Hanya 1–100">
                    <input
                      type="number" min={1} max={100}
                      value={cfg.value ?? 0}
                      onChange={(e) => patch("value", Number(e.target.value))}
                      className={inputClass}
                    />
                  </Field>
                ) : null}

                {cfg.type === "DISCOUNT_AMOUNT" ? (
                  <Field label="Nilai Diskon" unit="Rp">
                    <input
                      type="number" min={1}
                      value={cfg.value ?? 0}
                      onChange={(e) => patch("value", Number(e.target.value))}
                      className={inputClass}
                    />
                  </Field>
                ) : null}

                {isDiscount ? (
                  <Field
                    label="Minimal Belanja (opsional)"
                    unit="Rp"
                    hint="Informasi buat kasir — belum divalidasi otomatis"
                  >
                    <input
                      type="number" min={0}
                      value={cfg.minPurchase ?? 0}
                      onChange={(e) => patch("minPurchase", Number(e.target.value))}
                      className={inputClass}
                    />
                  </Field>
                ) : null}

                {cfg.type === "FREE_ITEM" ? (
                  <Field label="Nama Item Gratis">
                    <input
                      type="text"
                      value={cfg.freeItemName ?? ""}
                      onChange={(e) => patch("freeItemName", e.target.value)}
                      placeholder="mis. Americano"
                      className={inputClass}
                    />
                  </Field>
                ) : null}

                <div className="sm:col-span-2">
                  <Field label="Gambar (opsional)">
                    <ImageUploadField
                      value={cfg.imageUrl ?? ""}
                      onChange={(url) => patch("imageUrl", url)}
                      folder="rewards"
                    />
                  </Field>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-polks-border bg-white">
              <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                <button
                  type="button"
                  onClick={runNow}
                  disabled={running || !cfg.enabled}
                  className="h-9 rounded-[10px] border-[1.5px] border-polks-border bg-white px-3 text-xs font-semibold text-polks-brand disabled:opacity-50"
                >
                  {running ? "Menjalankan…" : "Jalankan Sekarang"}
                </button>
                <p className="flex-1 text-[10px] leading-relaxed text-polks-muted">
                  Untuk menyusulkan hari yang terlewat saat server mati. Aman
                  diulang — yang sudah dapat tidak akan dapat dua kali.
                </p>
              </div>
              {runResult ? (
                <p className="border-t border-polks-surface px-5 py-3 text-[11px] font-medium text-polks-text">
                  {runResult}
                </p>
              ) : null}
            </div>

            {error ? (
              <p className="text-center text-[13px] text-polks-error">{error}</p>
            ) : null}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className={
                  "flex h-[42px] items-center gap-2 rounded-xl px-7 text-[13px] font-bold text-white transition-colors disabled:opacity-60 " +
                  (saved ? "bg-polks-success" : "bg-polks-brand")
                }
              >
                <Save size={15} />
                {saving ? "Menyimpan…" : saved ? "Tersimpan!" : "Simpan Pengaturan"}
              </button>
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}

function Field({
  label,
  hint,
  unit,
  children,
}: {
  label: string;
  hint?: string;
  unit?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-polks-text">
        {label}
        {unit ? <span className="ml-1 font-normal text-[#8A959D]">({unit})</span> : null}
      </label>
      {children}
      {hint ? <p className="mt-1 text-[10px] text-[#8A959D]">{hint}</p> : null}
    </div>
  );
}
