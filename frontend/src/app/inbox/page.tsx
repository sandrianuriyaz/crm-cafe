"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell } from "lucide-react";
import { CustomerShell } from "@/components/layout/customer-shell";
import { api, getToken } from "@/lib/api";
import { type Paginated } from "@/lib/loyalty/types";

type Notif = {
  id: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function InboxPage() {
  const router = useRouter();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && !getToken()) {
      router.replace("/login");
      return;
    }
    api<Paginated<Notif>>("/member/notifications")
      .then((res) => {
        setItems(res.items);
        // Tandai semua dibaca begitu inbox dibuka (badge bell ikut hilang).
        if (res.items.some((n) => !n.readAt)) {
          api("/member/notifications/read-all", { method: "POST" }).catch(() => {});
        }
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <CustomerShell showHeader={false} showBottomNav={false} topbarRight={null}>
      <div className="bg-polks-brand px-5 pb-7 pt-4">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mb-4 flex items-center gap-1.5 text-[13px] font-medium text-white/50"
        >
          <ArrowLeft size={16} />
          Kembali
        </button>
        <h1 className="text-[22px] font-bold tracking-[-0.02em] text-white">Notifikasi</h1>
        <p className="mt-1 text-[13px] text-white/50">Pengumuman & info terbaru dari POLKS.</p>
      </div>

      <div className="bg-polks-brand leading-none">
        <svg viewBox="0 0 390 28" preserveAspectRatio="none" className="block h-7 w-full">
          <path d="M0,0 Q195,28 390,0 L390,28 L0,28 Z" fill="#F6F8FA" />
        </svg>
      </div>

      <div className="bg-polks-bg px-5 pb-12">
        {loading ? (
          <p className="py-10 text-center text-sm text-polks-muted">Memuat…</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Bell size={32} className="text-polks-border" />
            <p className="text-sm font-semibold text-polks-text">Belum ada notifikasi</p>
            <p className="max-w-[240px] text-xs text-polks-muted">
              Pengumuman & promo dari POLKS akan muncul di sini.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((n) => (
              <div
                key={n.id}
                className="rounded-2xl border border-polks-border bg-white p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-polks-surface">
                    <Bell size={16} className="text-polks-brand" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[14px] font-bold text-polks-text">{n.title}</p>
                      {!n.readAt ? (
                        <span className="mt-1 size-2 shrink-0 rounded-full bg-polks-brand" />
                      ) : null}
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-polks-muted">{n.message}</p>
                    <p className="mt-2 text-[11px] text-[#C0CBD3]">{fmt(n.createdAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CustomerShell>
  );
}
