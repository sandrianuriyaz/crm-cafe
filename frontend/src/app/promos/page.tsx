"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, ChevronRight, Search } from "lucide-react";
import { CustomerShell } from "@/components/layout/customer-shell";
import { api, ApiError } from "@/lib/api";
import { type Promo } from "@/lib/loyalty/types";

function formatPeriod(startAt: string | null, endAt: string | null): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  if (startAt && endAt) return `${fmt(startAt)} – ${fmt(endAt)}`;
  if (endAt) return `s/d ${fmt(endAt)}`;
  if (startAt) return `mulai ${fmt(startAt)}`;
  return "Berlaku terus";
}

export default function PromoListPage() {
  const router = useRouter();
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let alive = true;
    api<Promo[]>("/promos")
      .then((d) => alive && setPromos(d))
      .catch((err) => {
        if (!alive) return;
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login");
          return;
        }
        setError(err instanceof Error ? err.message : "Gagal memuat promo");
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [router]);

  const filtered = useMemo(
    () => promos.filter((p) => p.title.toLowerCase().includes(search.toLowerCase())),
    [promos, search],
  );

  return (
    <CustomerShell showHeader={false} topbarRight={null}>
      {/* Header */}
      <div className="bg-polks-brand px-5 pb-4 pt-4">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mb-4 flex items-center gap-1.5 text-[13px] font-medium text-white/50"
        >
          <ArrowLeft size={16} />
          Kembali
        </button>
        <h1 className="text-[22px] font-bold tracking-[-0.02em] text-white">Promo</h1>
        <p className="mt-2 text-[13px] text-white/50">Penawaran spesial untuk member POLKS.</p>
      </div>

      {/* Wave */}
      <div className="bg-polks-brand leading-none">
        <svg viewBox="0 0 390 28" preserveAspectRatio="none" className="block h-7 w-full">
          <path d="M0,0 Q195,28 390,0 L390,28 L0,28 Z" fill="#F6F8FA" />
        </svg>
      </div>

      <div className="flex flex-col gap-4 bg-polks-bg px-5 pb-28">
        {/* Search */}
        <div className="relative flex items-center">
          <Search size={15} color="#8A959D" className="absolute left-3.5" />
          <input
            type="text"
            placeholder="Cari promo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-xl border-[1.5px] border-polks-border bg-white pl-10 pr-4 text-[13px] text-polks-text outline-none focus:border-polks-brand"
          />
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl border border-polks-border bg-white" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-polks-border bg-white p-6 text-center">
            <p className="text-sm text-polks-muted">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-[13px] text-[#8A959D]">
              {promos.length === 0 ? "Belum ada promo aktif." : "Tidak ada promo yang sesuai."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((p) => (
              <Link
                key={p.id}
                href={`/promos/${p.id}`}
                className="overflow-hidden rounded-2xl border border-polks-border bg-white"
              >
                {p.imageUrl ? (
                  <div className="aspect-[16/9] w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.imageUrl} alt={p.title} className="size-full object-cover" />
                  </div>
                ) : null}
                <div className="flex items-center justify-between border-b border-polks-border bg-polks-bg px-4 py-2">
                  <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-polks-brand">
                    Promo
                  </span>
                  <span className="rounded-full bg-polks-brand px-2 py-0.5 text-[10px] font-bold text-white">
                    Aktif
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="mb-1.5 text-sm font-semibold text-polks-text">{p.title}</h3>
                  {p.description ? (
                    <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-polks-muted">
                      {p.description}
                    </p>
                  ) : null}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[11px] text-[#8A959D]">
                      <MapPin size={10} color="#8A959D" />
                      Semua Outlet
                      <span className="mx-1 text-[#C0CBD3]">·</span>
                      {formatPeriod(p.startAt, p.endAt)}
                    </div>
                    <span className="flex items-center gap-1 text-xs font-semibold text-polks-brand">
                      Detail <ChevronRight size={13} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </CustomerShell>
  );
}
