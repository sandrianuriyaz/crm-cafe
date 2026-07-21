"use client";

import { useEffect, useState } from "react";
import { Settings, Save, AlertCircle, Cake } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { api } from "@/lib/api";

type LoyaltyConfig = {
  webhookUrl: string | null;
  requireIdempotencyKeys: boolean;
  tierSilverMin: number;
  tierGoldMin: number;
  tierPlatinumMin: number;
  rateBronze: number;
  rateSilver: number;
  rateGold: number;
  ratePlatinum: number;
  birthdayEnabled: boolean;
  birthdayRewardId: string | null;
  birthdayVoucherDays: number;
  updatedAt?: string;
};

type RewardOption = { id: string; name: string; status: "ACTIVE" | "INACTIVE" };

export default function AdminLoyaltyConfigPage() {
  const [cfg, setCfg] = useState<LoyaltyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rewards, setRewards] = useState<RewardOption[]>([]);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<string | null>(null);

  useEffect(() => {
    api<LoyaltyConfig>("/admin/loyalty-config")
      .then(setCfg)
      .catch(() => setError("Gagal memuat konfigurasi."))
      .finally(() => setLoading(false));
    // Semua reward, termasuk yang nonaktif — hadiah ulang tahun justru
    // sebaiknya nonaktif agar tidak bisa diklaim gratis dari katalog.
    api<{ items: RewardOption[] }>("/admin/rewards?take=100")
      .then((r) => setRewards(r.items ?? []))
      .catch(() => setRewards([]));
  }, []);

  async function runBirthdayNow() {
    setRunning(true);
    setRunResult(null);
    try {
      const r = await api<{ granted: number; skipped: number; candidates: number; reason?: string }>(
        "/admin/birthday/run",
        { method: "POST" },
      );
      setRunResult(
        r.reason
          ? `Tidak dijalankan: ${r.reason}.`
          : `${r.granted} voucher terbit dari ${r.candidates} member berulang tahun` +
            (r.skipped ? ` (${r.skipped} dilewati — sudah pernah dapat tahun ini).` : "."),
      );
    } catch (err) {
      setRunResult(err instanceof Error ? err.message : "Gagal menjalankan.");
    } finally {
      setRunning(false);
    }
  }

  function patch<K extends keyof LoyaltyConfig>(key: K, value: LoyaltyConfig[K]) {
    setCfg((c) => (c ? { ...c, [key]: value } : c));
    setSaved(false);
  }

  async function handleSave() {
    if (!cfg || saving) return;
    if (cfg.birthdayEnabled && !cfg.birthdayRewardId) {
      setError("Pilih reward hadiah ulang tahun dulu, atau matikan fiturnya.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await api<LoyaltyConfig>("/admin/loyalty-config", {
        method: "PATCH",
        body: {
          webhookUrl: cfg.webhookUrl || null,
          requireIdempotencyKeys: cfg.requireIdempotencyKeys,
          tierSilverMin: Number(cfg.tierSilverMin),
          tierGoldMin: Number(cfg.tierGoldMin),
          tierPlatinumMin: Number(cfg.tierPlatinumMin),
          rateBronze: Number(cfg.rateBronze),
          rateSilver: Number(cfg.rateSilver),
          rateGold: Number(cfg.rateGold),
          ratePlatinum: Number(cfg.ratePlatinum),
          birthdayEnabled: cfg.birthdayEnabled,
          birthdayRewardId: cfg.birthdayRewardId || null,
          birthdayVoucherDays: Number(cfg.birthdayVoucherDays),
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

  const selectedBirthdayReward = rewards.find((r) => r.id === cfg?.birthdayRewardId);

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

            {/* Tier (berbasis belanja bulanan) */}
            <div className="overflow-hidden rounded-2xl border border-polks-border bg-white">
              <div className="flex items-center gap-2 border-b border-polks-surface px-5 py-3.5">
                <Settings size={14} className="text-polks-brand" />
                <h3 className="text-[13px] font-bold text-polks-text">Tier (belanja per bulan)</h3>
              </div>
              <div className="px-5 py-4">
                <p className="mb-3 text-[11px] leading-relaxed text-polks-muted">
                  Tier ditentukan dari total belanja member bulan berjalan (reset tiap
                  bulan). Bronze = di bawah ambang Silver. Rate = Rupiah per 1 poin
                  (makin kecil → makin banyak poin).
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Ambang Silver" unit="Rp/bln" hint="Belanja minimum jadi Silver">
                    <input type="number" min={0} value={cfg.tierSilverMin}
                      onChange={(e) => patch("tierSilverMin", Number(e.target.value))} className={inputClass} />
                  </Field>
                  <Field label="Ambang Gold" unit="Rp/bln" hint="Belanja minimum jadi Gold">
                    <input type="number" min={0} value={cfg.tierGoldMin}
                      onChange={(e) => patch("tierGoldMin", Number(e.target.value))} className={inputClass} />
                  </Field>
                  <Field label="Ambang Platinum" unit="Rp/bln" hint="Belanja minimum jadi Platinum">
                    <input type="number" min={0} value={cfg.tierPlatinumMin}
                      onChange={(e) => patch("tierPlatinumMin", Number(e.target.value))} className={inputClass} />
                  </Field>
                  <div className="hidden sm:block" />
                  <Field label="Rate Bronze" unit="Rp / poin">
                    <input type="number" min={1} value={cfg.rateBronze}
                      onChange={(e) => patch("rateBronze", Number(e.target.value))} className={inputClass} />
                  </Field>
                  <Field label="Rate Silver" unit="Rp / poin">
                    <input type="number" min={1} value={cfg.rateSilver}
                      onChange={(e) => patch("rateSilver", Number(e.target.value))} className={inputClass} />
                  </Field>
                  <Field label="Rate Gold" unit="Rp / poin">
                    <input type="number" min={1} value={cfg.rateGold}
                      onChange={(e) => patch("rateGold", Number(e.target.value))} className={inputClass} />
                  </Field>
                  <Field label="Rate Platinum" unit="Rp / poin">
                    <input type="number" min={1} value={cfg.ratePlatinum}
                      onChange={(e) => patch("ratePlatinum", Number(e.target.value))} className={inputClass} />
                  </Field>
                </div>
              </div>
            </div>

            {/* Hadiah ulang tahun */}
            <div className="overflow-hidden rounded-2xl border border-polks-border bg-white">
              <div className="flex items-center gap-2 border-b border-polks-surface px-5 py-3.5">
                <Cake size={14} className="text-polks-brand" />
                <h3 className="text-[13px] font-bold text-polks-text">Hadiah Ulang Tahun</h3>
              </div>
              <div className="px-5 py-4">
                <p className="mb-3 text-[11px] leading-relaxed text-polks-muted">
                  Tiap pagi sistem mencari member yang berulang tahun hari itu dan
                  menerbitkan voucher langsung ke Voucher Saya mereka — tanpa perlu
                  ditukar poin. Tiap member hanya dapat sekali per tahun.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Status" hint="Matikan untuk menghentikan pemberian otomatis">
                    <button
                      type="button"
                      onClick={() => patch("birthdayEnabled", !cfg.birthdayEnabled)}
                      className={
                        "flex h-10 items-center rounded-[10px] border-[1.5px] px-3 text-[13px] font-semibold " +
                        (cfg.birthdayEnabled
                          ? "border-polks-brand bg-polks-brand text-white"
                          : "border-polks-border bg-polks-bg text-polks-muted")
                      }
                    >
                      {cfg.birthdayEnabled ? "Aktif" : "Nonaktif"}
                    </button>
                  </Field>

                  <Field label="Masa Berlaku Voucher" unit="hari" hint="Dihitung sejak voucher terbit">
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={cfg.birthdayVoucherDays}
                      onChange={(e) => patch("birthdayVoucherDays", Number(e.target.value))}
                      className={inputClass}
                    />
                  </Field>

                  <div className="sm:col-span-2">
                    <Field label="Reward yang Dihadiahkan">
                      <select
                        value={cfg.birthdayRewardId ?? ""}
                        onChange={(e) => patch("birthdayRewardId", e.target.value || null)}
                        className={inputClass}
                      >
                        <option value="">— belum dipilih —</option>
                        {rewards.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                            {r.status === "INACTIVE" ? " (nonaktif)" : ""}
                          </option>
                        ))}
                      </select>
                    </Field>
                    {selectedBirthdayReward?.status === "ACTIVE" ? (
                      <p className="mt-2 flex items-start gap-2 rounded-lg border border-[rgba(246,184,75,0.4)] bg-polks-point-soft px-3 py-2 text-[10px] leading-relaxed text-[#92400E]">
                        <AlertCircle size={13} className="mt-px shrink-0" />
                        <span>
                          Reward ini masih <b>Aktif</b>, jadi ikut tampil di katalog
                          dan bisa ditukar member kapan saja. Nonaktifkan di menu
                          Rewards agar benar-benar eksklusif untuk yang berulang
                          tahun — hadiahnya tetap terbit dari sini.
                        </span>
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-polks-surface pt-4">
                  <button
                    type="button"
                    onClick={runBirthdayNow}
                    disabled={running || !cfg.birthdayEnabled}
                    className="h-9 rounded-[10px] border-[1.5px] border-polks-border bg-white px-3 text-xs font-semibold text-polks-brand disabled:opacity-50"
                  >
                    {running ? "Menjalankan…" : "Jalankan Sekarang"}
                  </button>
                  <p className="text-[10px] leading-relaxed text-polks-muted">
                    Untuk menyusulkan hari yang terlewat saat server mati. Aman
                    diulang — yang sudah dapat tidak akan dapat dua kali.
                  </p>
                </div>
                {runResult ? (
                  <p className="mt-2 text-[11px] font-medium text-polks-text">{runResult}</p>
                ) : null}
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
