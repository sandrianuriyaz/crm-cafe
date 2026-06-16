"use client";

import { useEffect, useState } from "react";
import { Settings, Save, AlertCircle } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { api } from "@/lib/api";

type LoyaltyConfig = {
  rupiahPerPoint: number;
  pointsPerUnit: number;
  pointExpiryMonths: number | null;
  tierThresholds: unknown;
  webhookUrl: string | null;
  requireIdempotencyKeys: boolean;
  updatedAt?: string;
};

export default function AdminLoyaltyConfigPage() {
  const [cfg, setCfg] = useState<LoyaltyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<LoyaltyConfig>("/admin/loyalty-config")
      .then(setCfg)
      .catch(() => setError("Gagal memuat konfigurasi."))
      .finally(() => setLoading(false));
  }, []);

  function patch<K extends keyof LoyaltyConfig>(key: K, value: LoyaltyConfig[K]) {
    setCfg((c) => (c ? { ...c, [key]: value } : c));
    setSaved(false);
  }

  async function handleSave() {
    if (!cfg || saving) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api<LoyaltyConfig>("/admin/loyalty-config", {
        method: "PATCH",
        body: {
          rupiahPerPoint: Number(cfg.rupiahPerPoint),
          pointsPerUnit: Number(cfg.pointsPerUnit),
          pointExpiryMonths:
            cfg.pointExpiryMonths === null ? null : Number(cfg.pointExpiryMonths),
          webhookUrl: cfg.webhookUrl || null,
          requireIdempotencyKeys: cfg.requireIdempotencyKeys,
        },
      });
      setCfg(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan konfigurasi.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "h-10 w-full rounded-[10px] border-[1.5px] border-polks-border bg-polks-bg px-3 text-[13px] text-polks-text outline-none focus:border-polks-brand focus:bg-white";

  return (
    <AdminShell title="Loyalty Config">
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-3 rounded-xl border border-[rgba(246,184,75,0.4)] bg-polks-point-soft px-4 py-3">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-[#92400E]" />
          <p className="text-xs leading-relaxed text-[#92400E]">
            Perubahan konfigurasi berlaku ke semua member. Periksa dengan teliti sebelum menyimpan.
          </p>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-polks-muted">Memuat konfigurasi…</p>
        ) : !cfg ? (
          <p className="py-10 text-center text-sm text-polks-error">
            {error ?? "Konfigurasi tidak tersedia."}
          </p>
        ) : (
          <>
            <div className="overflow-hidden rounded-2xl border border-polks-border bg-white">
              <div className="flex items-center gap-2 border-b border-polks-surface px-5 py-3.5">
                <Settings size={14} className="text-polks-brand" />
                <h3 className="text-[13px] font-bold text-polks-text">Aturan Poin</h3>
              </div>
              <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
                <Field
                  label="Rupiah per Poin"
                  hint="1 poin diberikan tiap belanja sebesar Rp ini"
                  unit="Rp"
                >
                  <input
                    type="number"
                    min={1}
                    value={cfg.rupiahPerPoint}
                    onChange={(e) => patch("rupiahPerPoint", Number(e.target.value))}
                    className={inputClass}
                  />
                </Field>
                <Field label="Poin per Unit" hint="Pengali poin per kelipatan">
                  <input
                    type="number"
                    min={1}
                    value={cfg.pointsPerUnit}
                    onChange={(e) => patch("pointsPerUnit", Number(e.target.value))}
                    className={inputClass}
                  />
                </Field>
                <Field
                  label="Masa Berlaku Poin"
                  hint="Kosongkan jika poin tidak kedaluwarsa"
                  unit="bulan"
                >
                  <input
                    type="number"
                    min={1}
                    value={cfg.pointExpiryMonths ?? ""}
                    onChange={(e) =>
                      patch(
                        "pointExpiryMonths",
                        e.target.value === "" ? null : Number(e.target.value),
                      )
                    }
                    placeholder="Tidak kedaluwarsa"
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-polks-border bg-white">
              <div className="flex items-center gap-2 border-b border-polks-surface px-5 py-3.5">
                <Settings size={14} className="text-polks-brand" />
                <h3 className="text-[13px] font-bold text-polks-text">Integrasi POS</h3>
              </div>
              <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
                <Field label="Webhook URL" hint="Endpoint penerima event POS">
                  <input
                    type="text"
                    value={cfg.webhookUrl ?? ""}
                    onChange={(e) => patch("webhookUrl", e.target.value)}
                    placeholder="https://…"
                    className={inputClass}
                  />
                </Field>
                <Field label="Wajib Idempotency Key" hint="Tolak event tanpa kunci dedup">
                  <button
                    type="button"
                    onClick={() =>
                      patch("requireIdempotencyKeys", !cfg.requireIdempotencyKeys)
                    }
                    className={
                      "flex h-10 items-center rounded-[10px] border-[1.5px] px-3 text-[13px] font-semibold " +
                      (cfg.requireIdempotencyKeys
                        ? "border-polks-brand bg-polks-brand text-white"
                        : "border-polks-border bg-polks-bg text-polks-muted")
                    }
                  >
                    {cfg.requireIdempotencyKeys ? "Aktif" : "Nonaktif"}
                  </button>
                </Field>
              </div>
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
                {saving ? "Menyimpan…" : saved ? "Tersimpan!" : "Simpan Konfigurasi"}
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
