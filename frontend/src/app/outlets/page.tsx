"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Clock, Phone, CheckCircle2, Navigation } from "lucide-react";
import { CustomerShell } from "@/components/layout/customer-shell";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Outlet = {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  hours: string | null;
  openTime: string | null;
  closeTime: string | null;
  closedDays: number[];
  mapsUrl: string | null;
  phone: string | null;
  status: "ACTIVE" | "INACTIVE";
};

// `hours` di DB itu teks bebas yang diketik admin ("Senin- Minggu 12:00-23:00"),
// jadi rapikan spasinya sebelum tampil ketimbang memaksa admin mengetik rapi.
function formatHours(hours: string) {
  return hours.replace(/\s*-\s*/g, " - ").replace(/\s+/g, " ").trim();
}

const toMinutes = (hhmm: string) => +hhmm.slice(0, 2) * 60 + +hhmm.slice(3, 5);

// Buka/tutup saat ini. Prioritaskan jadwal terstruktur; outlet lama yang
// jadwalnya belum diisi admin masih dibaca dari teks `hours`. Kembalikan null
// kalau keduanya tak terbaca supaya badge jatuh ke label netral, bukan menebak.
function openNow(o: Outlet, at: Date): boolean | null {
  let open: number;
  let close: number;

  if (o.openTime && o.closeTime) {
    if (o.closedDays.includes(at.getDay())) return false;
    open = toMinutes(o.openTime);
    close = toMinutes(o.closeTime);
  } else {
    const m = o.hours?.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
    if (!m) return null;
    open = +m[1] * 60 + +m[2];
    close = +m[3] * 60 + +m[4];
  }

  const now = at.getHours() * 60 + at.getMinutes();
  // Jam tutup lewat tengah malam (mis. 18:00-02:00) jadi rentangnya terbelah.
  return close <= open ? now >= open || now < close : now >= open && now < close;
}

// Pin yang dipasang admin selalu lebih akurat. Kalau belum diisi, jatuh ke
// pencarian — alamat pendek seperti "Jl pagaden" gampang meleset, jadi nama
// outlet dan kota ikut jadi konteks.
function mapsHref(o: Outlet) {
  if (o.mapsUrl) return o.mapsUrl;
  const query = [o.name, o.address, o.city].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export default function OutletListPage() {
  const router = useRouter();

  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    api<Outlet[]>("/outlets")
      .then((res) => setOutlets(Array.isArray(res) ? res : []))
      .catch(() => setError("Gagal memuat data outlet. Cek koneksimu dan coba lagi."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // Aman dihitung saat render: kartu outlet baru muncul setelah fetch selesai,
  // jadi tidak pernah ikut hasil SSR dan tidak memicu hydration mismatch.
  const now = new Date();

  return (
    <CustomerShell showHeader={false} topbarRight={null}>
      {/* Header */}
      <div className="bg-polks-brand px-5 pb-5 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Kembali"
          className="mb-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors active:bg-white/20"
        >
          <ArrowLeft size={18} />
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

      <div className="mt-3 flex flex-col gap-3 bg-polks-bg px-5 pb-28">
        {loading ? (
          /* Skeleton cards */
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-polks-border bg-polks-card">
              <div className="skeleton h-11 w-full rounded-none" />
              <div className="flex flex-col gap-2.5 px-4 py-3">
                <div className="skeleton h-3 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
                <div className="skeleton h-3 w-1/3 rounded" />
              </div>
            </div>
          ))
        ) : error ? (
          <div className="py-8 text-center">
            <p className="mb-3 text-xs font-medium text-polks-muted">{error}</p>
            <button
              type="button"
              onClick={load}
              className="rounded-xl bg-polks-brand px-5 py-2.5 text-xs font-bold text-white"
            >
              Coba Lagi
            </button>
          </div>
        ) : outlets.length === 0 ? (
          <p className="py-8 text-center text-xs font-medium text-polks-muted">Belum ada outlet.</p>
        ) : (
          outlets.map((o) => {
            const inactive = o.status !== "ACTIVE";
            // Badge cuma boleh bilang "Buka"/"Tutup" kalau jamnya terbaca.
            // Kalau tidak, tampilkan status operasional apa adanya supaya
            // pelanggan tidak datang ke outlet yang ternyata tutup.
            const open = inactive ? false : openNow(o, now);
            const badge =
              inactive ? "Nonaktif" : open === null ? "Aktif" : open ? "Buka" : "Tutup";
            return (
            <div
              key={o.id}
              className={cn(
                "overflow-hidden rounded-2xl border border-polks-border bg-polks-card",
                inactive && "opacity-60",
              )}
            >
              <div className="flex items-center justify-between bg-polks-brand px-4 py-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-[15px] font-bold text-white">{o.name}</span>
                  {o.city ? <span className="text-xs text-white/50">{o.city}</span> : null}
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white ring-1",
                    open === false
                      ? "bg-white/5 text-white/60 ring-white/10"
                      : "bg-white/10 ring-white/15",
                  )}
                >
                  {badge}
                </span>
              </div>
              <div className="flex flex-col gap-2.5 px-4 py-3">
                <div className="flex items-start gap-3">
                  <MapPin size={14} color="#8A959D" className="mt-0.5 shrink-0" />
                  <span className="text-[13px] leading-relaxed text-polks-text">
                    {o.address ?? "—"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock size={14} color="#8A959D" className="shrink-0" />
                  <span className="text-xs text-polks-muted">
                    {o.hours ? formatHours(o.hours) : "—"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={14} color="#8A959D" className="shrink-0" />
                  {o.phone ? (
                    <a
                      href={`tel:${o.phone}`}
                      className="text-xs font-medium text-polks-brand underline-offset-2 hover:underline"
                    >
                      {o.phone}
                    </a>
                  ) : (
                    <span className="text-xs text-polks-muted">—</span>
                  )}
                </div>
                {o.address || o.mapsUrl ? (
                  <a
                    href={mapsHref(o)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-polks-surface py-2.5 text-xs font-bold text-polks-brand transition-colors active:bg-polks-border"
                  >
                    <Navigation size={14} />
                    Petunjuk Arah
                  </a>
                ) : null}
              </div>
            </div>
            );
          })
        )}
      </div>
    </CustomerShell>
  );
}
