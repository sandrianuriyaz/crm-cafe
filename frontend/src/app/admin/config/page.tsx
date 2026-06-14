"use client";

import { useState } from "react";
import { Settings, Save, AlertCircle } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";

type Field = { label: string; key: string; value: string; unit?: string; hint?: string };

const sections: { title: string; fields: Field[] }[] = [
  {
    title: "Point Rules",
    fields: [
      { label: "Earning Rate", key: "earn_rate", value: "1", unit: "pt / Rp1.000", hint: "Poin per Rp1.000 belanja" },
      { label: "Min Transaction", key: "min_trx", value: "10000", unit: "Rp", hint: "Belanja minimum untuk dapat poin" },
      { label: "Point Rounding", key: "rounding", value: "floor", hint: "Pembulatan poin (floor / ceil / round)" },
      { label: "Point Expiry", key: "expiry_months", value: "12", unit: "bulan", hint: "Poin kedaluwarsa setelah X bulan" },
    ],
  },
  {
    title: "Redemption Rules",
    fields: [
      { label: "Redeem Rate", key: "redeem_rate", value: "100", unit: "pts = Rp10.000", hint: "Nilai poin saat ditukar" },
      { label: "Min Redeem", key: "min_redeem", value: "500", unit: "pts", hint: "Poin minimum untuk menukar" },
      { label: "Max Redeem/Trx", key: "max_redeem", value: "2000", unit: "pts", hint: "Maks poin per penukaran" },
      { label: "Redeem Channels", key: "channels", value: "all", hint: "all / pos_only / app_only" },
    ],
  },
  {
    title: "Tier Rules",
    fields: [
      { label: "Silver Threshold", key: "silver_pts", value: "0", unit: "pts", hint: "Poin minimum Silver" },
      { label: "Gold Threshold", key: "gold_pts", value: "1000", unit: "pts", hint: "Poin minimum Gold" },
      { label: "Platinum Threshold", key: "plat_pts", value: "5000", unit: "pts", hint: "Poin minimum Platinum" },
      { label: "Tier Evaluation", key: "tier_eval", value: "rolling_12m", hint: "rolling_12m / yearly" },
    ],
  },
  {
    title: "Webhook Config",
    fields: [
      { label: "Webhook URL", key: "webhook_url", value: "https://crm.polks.id/webhook/pos", hint: "Endpoint penerima event POS" },
      { label: "HMAC Secret", key: "hmac_secret", value: "••••••••••••••••", hint: "Secret penandatangan HMAC-SHA256" },
      { label: "Idempotency TTL", key: "idempotency", value: "24", unit: "jam", hint: "Lama key idempotency disimpan" },
      { label: "Max Retry", key: "max_retry", value: "3", hint: "Jumlah retry sinkronisasi POS" },
    ],
  },
];

export default function AdminLoyaltyConfigPage() {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(sections.flatMap((s) => s.fields.map((f) => [f.key, f.value]))),
  );
  const [saved, setSaved] = useState(false);

  function handleSave() {
    // TODO: PATCH /admin/loyalty-config saat endpoint tersedia.
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <AdminShell title="Loyalty Config">
      <div className="flex flex-col gap-5">
        {/* Warning */}
        <div className="flex items-start gap-3 rounded-xl border border-[rgba(246,184,75,0.4)] bg-polks-point-soft px-4 py-3">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-[#92400E]" />
          <p className="text-xs leading-relaxed text-[#92400E]">
            Perubahan konfigurasi berlaku ke semua member. Periksa dengan teliti sebelum menyimpan.
          </p>
        </div>

        {sections.map((section) => (
          <div key={section.title} className="overflow-hidden rounded-2xl border border-polks-border bg-white">
            <div className="flex items-center gap-2 border-b border-polks-surface px-5 py-3.5">
              <Settings size={14} className="text-polks-brand" />
              <h3 className="text-[13px] font-bold text-polks-text">{section.title}</h3>
            </div>
            <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
              {section.fields.map((field) => (
                <div key={field.key}>
                  <label className="mb-1.5 block text-xs font-semibold text-polks-text">
                    {field.label}
                    {field.unit ? <span className="ml-1 font-normal text-[#8A959D]">({field.unit})</span> : null}
                  </label>
                  <input
                    value={values[field.key] ?? field.value}
                    onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                    className="h-10 w-full rounded-[10px] border-[1.5px] border-polks-border bg-polks-bg px-3 text-[13px] text-polks-text outline-none focus:border-polks-brand focus:bg-white"
                  />
                  {field.hint ? <p className="mt-1 text-[10px] text-[#8A959D]">{field.hint}</p> : null}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            className={
              "flex h-[42px] items-center gap-2 rounded-xl px-7 text-[13px] font-bold text-white transition-colors " +
              (saved ? "bg-polks-success" : "bg-polks-brand")
            }
          >
            <Save size={15} />
            {saved ? "Tersimpan!" : "Simpan Konfigurasi"}
          </button>
        </div>

        <p className="text-center text-[11px] text-polks-muted">
          Catatan: penyimpanan masih lokal — akan terhubung saat endpoint <code>/admin/loyalty-config</code> tersedia.
        </p>
      </div>
    </AdminShell>
  );
}
