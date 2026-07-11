"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CustomerShell } from "@/components/layout/customer-shell";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Item = { key: string; apiKey: string; label: string; desc: string; on: boolean };

const DEFAULTS: Item[] = [
  { key: "promo",  apiKey: "promoNotifications",  label: "Promo & Penawaran", desc: "Info promo terbaru di outlet POLKS",       on: true  },
  { key: "points", apiKey: "pointNotifications",  label: "Poin Masuk",        desc: "Notifikasi saat poin bertambah",           on: true  },
  { key: "reward", apiKey: "rewardNotifications", label: "Reward Tersedia",   desc: "Reward baru yang bisa ditukar",            on: true  },
  { key: "email",  apiKey: "emailEnabled",        label: "Email",             desc: "Notifikasi dikirim ke email kamu",         on: true  },
  { key: "push",   apiKey: "pushEnabled",         label: "Push Notification", desc: "Notifikasi langsung di perangkat ini",     on: true  },
];

const STORAGE_KEY = "polks_notif_prefs";

function loadLocalPrefs(): Record<string, boolean> | null {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export default function NotificationsPage() {
  const router     = useRouter();
  const { user }   = useAuth();
  const [items,    setItems]   = useState<Item[]>(DEFAULTS);
  const [loading,  setLoading] = useState(true);
  const [saving,   setSaving]  = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      // Guest: pakai localStorage saja
      const local = loadLocalPrefs();
      if (local) {
        setItems(DEFAULTS.map((it) => ({ ...it, on: it.key in local ? local[it.key] : it.on })));
      }
      setLoading(false);
      return;
    }

    api<Record<string, boolean>>("/member/notifications/settings")
      .then((settings) => {
        setItems(DEFAULTS.map((it) => ({
          ...it,
          on: it.apiKey in settings ? settings[it.apiKey] : it.on,
        })));
      })
      .catch(() => {
        // Fallback ke localStorage
        const local = loadLocalPrefs();
        if (local) setItems(DEFAULTS.map((it) => ({ ...it, on: it.key in local ? local[it.key] : it.on })));
      })
      .finally(() => setLoading(false));
  }, [user]);

  async function toggle(apiKey: string) {
    const next = items.map((i) => (i.apiKey === apiKey ? { ...i, on: !i.on } : i));
    setItems(next);

    // Simpan ke localStorage selalu (offline fallback)
    try {
      const prefs: Record<string, boolean> = {};
      next.forEach((i) => { prefs[i.key] = i.on; });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {}

    // Sync ke backend kalau login
    if (!user) return;
    setSaving(apiKey);
    const changed = next.find((i) => i.apiKey === apiKey);
    try {
      await api("/member/notifications/settings", {
        method: "PATCH",
        body: { [apiKey]: changed?.on },
      });
    } catch {
      // Rollback
      setItems(items);
    } finally {
      setSaving(null);
    }
  }

  return (
    <CustomerShell showHeader={false} showBottomNav={false} topbarRight={null}>
      <div className="bg-polks-brand px-5 pb-7 pt-4">
        <button
          type="button"
          onClick={() => router.push("/profile")}
          aria-label="Kembali"
          className="mb-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors active:bg-white/20"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-[22px] font-bold tracking-[-0.02em] text-white">Notifikasi</h1>
        <p className="mt-1 text-[13px] text-white/50">Atur notifikasi yang ingin kamu terima.</p>
      </div>

      <div className="bg-polks-brand leading-none">
        <svg viewBox="0 0 390 28" preserveAspectRatio="none" className="block h-7 w-full">
          <path d="M0,0 Q195,28 390,0 L390,28 L0,28 Z" fill="#F6F8FA" />
        </svg>
      </div>

      <div className="bg-polks-bg px-5 pb-10">
        {loading ? (
          <div className="overflow-hidden rounded-2xl border border-polks-border bg-polks-card">
            {DEFAULTS.map((_, i) => (
              <div key={i} className={"flex items-center justify-between gap-3 px-4 py-3.5 " + (i > 0 ? "border-t border-polks-surface" : "")}>
                <div className="flex-1">
                  <div className="skeleton mb-1.5 h-3 w-1/3 rounded" />
                  <div className="skeleton h-2.5 w-2/3 rounded" />
                </div>
                <div className="skeleton h-6 w-11 shrink-0 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-polks-border bg-polks-card">
            {items.map((it, i) => (
              <div
                key={it.key}
                className={"flex items-center justify-between gap-3 px-4 py-3.5 " + (i > 0 ? "border-t border-polks-surface" : "")}
              >
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-polks-text">{it.label}</p>
                  <p className="text-[11px] text-polks-muted">{it.desc}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={it.on}
                  disabled={saving === it.apiKey}
                  onClick={() => toggle(it.apiKey)}
                  className={
                    "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 " +
                    (it.on ? "bg-polks-brand" : "bg-polks-border")
                  }
                >
                  <span
                    className={
                      "absolute top-0.5 size-5 rounded-full bg-polks-card shadow transition-all " +
                      (it.on ? "left-[22px]" : "left-0.5")
                    }
                  />
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 px-1 text-[11px] leading-relaxed text-polks-muted">
          {user
            ? "Preferensi disimpan ke akun kamu dan berlaku di semua perangkat."
            : "Preferensi disimpan di perangkat ini. Login untuk sinkronisasi antar perangkat."}
        </p>
      </div>
    </CustomerShell>
  );
}
