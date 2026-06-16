"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Clock, Phone, CheckCircle2 } from "lucide-react";
import { CustomerShell } from "@/components/layout/customer-shell";
import { api } from "@/lib/api";

type Outlet = {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  hours: string | null;
  phone: string | null;
  status: "ACTIVE" | "INACTIVE";
};

export default function OutletListPage() {
  const router = useRouter();

  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api<Outlet[]>("/outlets")
      .then((res) => setOutlets(Array.isArray(res) ? res : []))
      .catch(() => setOutlets([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <CustomerShell showHeader={false} topbarRight={null}>
      {/* Header */}
      <div className="bg-polks-brand px-5 pb-7 pt-4">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mb-4 flex items-center gap-1.5 text-[13px] font-medium text-white/50"
        >
          <ArrowLeft size={16} />
          Kembali
        </button>
        <h1 className="text-[22px] font-bold tracking-[-0.02em] text-white">Lokasi Outlet</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-white/50">
          Member card kamu berlaku di semua outlet POLKS berikut.
        </p>
      </div>

      {/* Wave */}
      <div className="bg-polks-brand leading-none">
        <svg viewBox="0 0 390 28" preserveAspectRatio="none" className="block h-7 w-full">
          <path d="M0,0 Q195,28 390,0 L390,28 L0,28 Z" fill="#F6F8FA" />
        </svg>
      </div>

      <div className="bg-polks-bg px-5">
        <div className="flex items-center gap-3 rounded-2xl border border-polks-border bg-polks-surface px-4 py-3">
          <CheckCircle2 size={16} color="#38A169" strokeWidth={2.5} />
          <p className="text-xs font-semibold text-polks-text">
            1 akun member berlaku di semua outlet POLKS
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4 bg-polks-bg px-5 pb-28">
        {loading ? (
          <p className="py-8 text-center text-xs font-medium text-polks-muted">Memuat…</p>
        ) : outlets.length === 0 ? (
          <p className="py-8 text-center text-xs font-medium text-polks-muted">Belum ada outlet.</p>
        ) : (
          outlets.map((o) => (
            <div key={o.id} className="overflow-hidden rounded-2xl border border-polks-border bg-white">
              <div className="flex items-center justify-between bg-polks-brand px-4 py-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-[15px] font-bold text-white">{o.name}</span>
                  {o.city ? <span className="text-xs text-white/50">{o.city}</span> : null}
                </div>
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold text-white ring-1 ring-white/15">
                  {o.status === "ACTIVE" ? "Buka" : "Tutup"}
                </span>
              </div>
              <div className="flex flex-col gap-3 px-4 py-4">
                <div className="flex items-start gap-3">
                  <MapPin size={14} color="#8A959D" className="mt-0.5 shrink-0" />
                  <span className="text-[13px] leading-relaxed text-polks-text">{o.address ?? "—"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock size={14} color="#8A959D" className="shrink-0" />
                  <span className="text-xs text-polks-muted">{o.hours ?? "—"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={14} color="#8A959D" className="shrink-0" />
                  <span className="text-xs text-polks-muted">{o.phone ?? "—"}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </CustomerShell>
  );
}
