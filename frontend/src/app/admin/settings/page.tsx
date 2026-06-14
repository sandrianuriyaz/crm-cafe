"use client";

import { useState } from "react";
import { User, Shield, Key, Bell, Save } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";

type Field = { label: string; key: string; value: string; type?: string; disabled?: boolean };

const sections: { Icon: typeof User; title: string; fields: Field[] }[] = [
  {
    Icon: User,
    title: "Akun Admin",
    fields: [
      { label: "Nama Lengkap", key: "name", value: "Admin POLKS" },
      { label: "Email", key: "email", value: "admin@polks.test", type: "email" },
      { label: "Role", key: "role", value: "Super Admin", disabled: true },
    ],
  },
  {
    Icon: Shield,
    title: "Keamanan",
    fields: [
      { label: "Password Lama", key: "cur_pass", value: "", type: "password" },
      { label: "Password Baru", key: "new_pass", value: "", type: "password" },
      { label: "Konfirmasi Password", key: "conf_pass", value: "", type: "password" },
    ],
  },
  {
    Icon: Key,
    title: "API Keys",
    fields: [
      { label: "POS Webhook Secret", key: "webhook_secret", value: "••••••••••••••••••••", type: "password" },
      { label: "CRM API Key", key: "api_key", value: "••••••••••••••••••••", type: "password" },
    ],
  },
  {
    Icon: Bell,
    title: "Notifikasi",
    fields: [
      { label: "Email saat Webhook Gagal", key: "notif_webhook", value: "admin@polks.test", type: "email" },
      { label: "Ambang Peringatan", key: "alert_count", value: "5", type: "number" },
    ],
  },
];

export default function AdminSettingsPage() {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(sections.flatMap((s) => s.fields.map((f) => [f.key, f.value]))),
  );
  const [saved, setSaved] = useState(false);

  return (
    <AdminShell title="Settings">
      <div className="flex flex-col gap-4">
        {sections.map(({ Icon, title, fields }) => (
          <div key={title} className="overflow-hidden rounded-2xl border border-polks-border bg-white">
            <div className="flex items-center gap-2 border-b border-polks-surface px-5 py-3.5">
              <Icon size={14} className="text-polks-brand" />
              <h3 className="text-[13px] font-bold text-polks-text">{title}</h3>
            </div>
            <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
              {fields.map((f) => (
                <div key={f.key}>
                  <label className="mb-1.5 block text-xs font-semibold text-polks-text">{f.label}</label>
                  <input
                    type={f.type ?? "text"}
                    disabled={f.disabled}
                    value={values[f.key] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    className="h-10 w-full rounded-[10px] border-[1.5px] border-polks-border bg-polks-bg px-3 text-[13px] text-polks-text outline-none focus:border-polks-brand focus:bg-white disabled:opacity-60"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);
            }}
            className={"flex h-[42px] items-center gap-2 rounded-xl px-7 text-[13px] font-bold text-white " + (saved ? "bg-polks-success" : "bg-polks-brand")}
          >
            <Save size={15} />
            {saved ? "Tersimpan!" : "Simpan Pengaturan"}
          </button>
        </div>
        <p className="text-center text-[11px] text-polks-muted">Data contoh — menunggu endpoint <code>/admin/settings</code>.</p>
      </div>
    </AdminShell>
  );
}
