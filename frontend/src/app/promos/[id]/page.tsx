"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Calendar, Info, CheckCircle2 } from "lucide-react";
import { CustomerShell } from "@/components/layout/customer-shell";
import { api, ApiError } from "@/lib/api";
import { type Promo } from "@/lib/loyalty/types";

const terms = [
  "Promo berlaku sesuai periode yang tercantum.",
  "Tidak dapat digabungkan dengan promo atau diskon lain.",
  "Berlaku untuk pembelian langsung di kasir.",
  "Poin tetap dihitung dari harga setelah diskon.",
  "POLKS berhak membatalkan promo sewaktu-waktu.",
];

function formatPeriod(startAt: string | null, endAt: string | null): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  if (startAt && endAt) return `${fmt(startAt)} – ${fmt(endAt)}`;
  if (endAt) return `s/d ${fmt(endAt)}`;
  if (startAt) return `mulai ${fmt(startAt)}`;
  return "Berlaku terus";
}

export default function PromoDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [promo, setPromo] = useState<Promo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api<Promo>(`/promos/${params.id}`)
      .then((p) => alive && setPromo(p))
      .catch((err) => {
        if (!alive) return;
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login");
          return;
        }
        setError(err instanceof Error ? err.message : "Promo tidak ditemukan");
      });
    return () => {
      alive = false;
    };
  }, [params.id, router]);

  return (
    <CustomerShell showHeader={false} showBottomNav={false} topbarRight={null}>
      {/* Header */}
      <div className="bg-polks-brand px-5 pb-7 pt-4">
        <button
          type="button"
          onClick={() => router.push("/promos")}
          className="mb-4 flex items-center gap-1.5 text-[13px] font-medium text-white/50"
        >
          <ArrowLeft size={16} />
          Kembali ke Promo
        </button>
        <div className="mb-3 flex items-start justify-between">
          <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-polks-point">
            Promo
          </span>
          <span className="rounded-full bg-polks-brand px-2 py-0.5 text-[10px] font-bold text-white ring-1 ring-white/20">
            Active
          </span>
        </div>
        <h1 className="text-[22px] font-bold leading-tight tracking-[-0.02em] text-white">
          {promo?.title ?? (error ? "Promo" : "Memuat…")}
        </h1>
      </div>

      {/* Wave */}
      <div className="bg-polks-brand leading-none">
        <svg viewBox="0 0 390 28" preserveAspectRatio="none" className="block h-7 w-full">
          <path d="M0,0 Q195,28 390,0 L390,28 L0,28 Z" fill="#F6F8FA" />
        </svg>
      </div>

      <div className="flex flex-col gap-4 bg-polks-bg px-5 pb-10">
        {error ? (
          <div className="rounded-2xl border border-polks-border bg-white p-6 text-center">
            <p className="text-sm text-polks-muted">{error}</p>
          </div>
        ) : (
          <>
            {/* Meta */}
            <div className="flex flex-col gap-3 rounded-2xl border border-polks-border bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-polks-surface">
                  <MapPin size={14} color="#25343F" />
                </div>
                <div>
                  <div className="text-[11px] text-[#8A959D]">Outlet</div>
                  <div className="text-[13px] font-semibold text-polks-text">All Outlets</div>
                </div>
              </div>
              <div className="h-px bg-polks-border" />
              <div className="flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-polks-surface">
                  <Calendar size={14} color="#25343F" />
                </div>
                <div>
                  <div className="text-[11px] text-[#8A959D]">Periode</div>
                  <div className="text-[13px] font-semibold text-polks-text">
                    {promo ? formatPeriod(promo.startAt, promo.endAt) : "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="rounded-2xl border border-polks-border bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <Info size={14} color="#25343F" />
                <span className="text-[13px] font-semibold text-polks-text">Deskripsi Promo</span>
              </div>
              <p className="text-[13px] leading-relaxed text-polks-muted">
                {promo?.description || "Tidak ada deskripsi untuk promo ini."}
              </p>
            </div>

            {/* Terms */}
            <div className="rounded-2xl border border-polks-border bg-white p-4">
              <span className="mb-3 block text-[13px] font-semibold text-polks-text">
                Syarat &amp; Ketentuan
              </span>
              <div className="flex flex-col gap-2.5">
                {terms.map((t) => (
                  <div key={t} className="flex items-start gap-2.5">
                    <CheckCircle2 size={13} color="#8A959D" className="mt-0.5 shrink-0" />
                    <span className="text-xs leading-relaxed text-polks-muted">{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notice */}
            <div className="flex items-start gap-3 rounded-2xl border border-[rgba(246,184,75,0.4)] bg-polks-point-soft px-4 py-3">
              <Info size={14} color="#92400E" className="mt-0.5 shrink-0" />
              <p className="text-xs leading-relaxed text-[#92400E]">
                Tunjukkan member QR ke kasir saat bertransaksi di outlet untuk menikmati promo ini.
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push("/promos")}
              className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-polks-border bg-white text-sm font-semibold text-polks-brand"
            >
              <ArrowLeft size={16} />
              Kembali ke Promo
            </button>
          </>
        )}
      </div>
    </CustomerShell>
  );
}
