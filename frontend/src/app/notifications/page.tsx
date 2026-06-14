"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CustomerShell } from "@/components/layout/customer-shell";

const initial = [
  { key: "promo", label: "Promo & Penawaran", desc: "Info promo terbaru di outlet POLKS", on: true },
  { key: "points", label: "Poin Masuk", desc: "Notifikasi saat poin bertambah", on: true },
  { key: "reward", label: "Reward Tersedia", desc: "Reward baru yang bisa ditukar", on: true },
  { key: "trx", label: "Update Transaksi", desc: "Status transaksi & sinkronisasi POS", on: false },
];

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState(initial);

  function toggle(key: string) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, on: !i.on } : i)));
  }

  return (
    <CustomerShell showHeader={false} showBottomNav={false} topbarRight={null}>
      <div className="bg-polks-brand px-5 pb-7 pt-4">
        <button
          type="button"
          onClick={() => router.push("/profile")}
          className="mb-4 flex items-center gap-1.5 text-[13px] font-medium text-white/50"
        >
          <ArrowLeft size={16} />
          Kembali
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
        <div className="overflow-hidden rounded-2xl border border-polks-border bg-white">
          {items.map((it, i) => (
            <div
              key={it.key}
              className={
                "flex items-center justify-between gap-3 px-4 py-3.5 " +
                (i > 0 ? "border-t border-polks-surface" : "")
              }
            >
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-polks-text">{it.label}</p>
                <p className="text-[11px] text-polks-muted">{it.desc}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={it.on}
                onClick={() => toggle(it.key)}
                className={
                  "relative h-6 w-11 shrink-0 rounded-full transition-colors " +
                  (it.on ? "bg-polks-brand" : "bg-polks-border")
                }
              >
                <span
                  className={
                    "absolute top-0.5 size-5 rounded-full bg-white shadow transition-all " +
                    (it.on ? "left-[22px]" : "left-0.5")
                  }
                />
              </button>
            </div>
          ))}
        </div>
        <p className="mt-3 px-1 text-[11px] leading-relaxed text-polks-muted">
          Preferensi disimpan di perangkat ini (pengaturan penuh tersedia setelah layanan notifikasi aktif).
        </p>
      </div>
    </CustomerShell>
  );
}
