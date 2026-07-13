/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, RefreshCw, QrCode, Coffee,
  ChevronRight, History, MapPin,
} from "lucide-react";
import { CustomerShell } from "@/components/layout/customer-shell";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { TIER_META } from "@/lib/loyalty/tier";

export default function MemberCardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const name     = user?.name        || "Member";
  const memberId = user?.memberCode  || "—";
  const points   = user?.pointBalance ?? 0;
  const tierMeta = TIER_META[user?.tier ?? "bronze"];

  const [qrImage,   setQrImage]   = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(true);
  const [qrError,   setQrError]   = useState(false);

  const loadQr = useCallback(() => {
    setLoadingQr(true);
    setQrError(false);
    api<{ image_data_url: string }>("/member/qr")
      .then((res) => setQrImage(res.image_data_url))
      .catch(() => { setQrImage(null); setQrError(true); })
      .finally(() => setLoadingQr(false));
  }, []);

  useEffect(() => { loadQr(); }, [loadQr]);

  return (
    <CustomerShell showHeader={false} topbarRight={null}>
      <div className="min-h-screen bg-polks-bg pb-28">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-5 pb-3 pt-4">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            aria-label="Kembali"
            className="flex size-9 items-center justify-center rounded-full bg-polks-surface text-polks-muted"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            type="button"
            onClick={loadQr}
            disabled={loadingQr}
            className="flex items-center gap-1.5 rounded-xl border border-polks-border bg-polks-card px-3 py-1.5 text-xs font-semibold text-polks-text disabled:opacity-50"
          >
            <RefreshCw size={12} className={loadingQr ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* ── Page title ── */}
        <div className="px-5 pb-4">
          <h1 className="text-[24px] font-black tracking-[-0.02em] text-polks-text">QR Code</h1>
          <p className="text-[13px] text-polks-muted">Tunjukkan QR ini ke kasir saat transaksi</p>
        </div>

        {/* ── QR Card ── */}
        <div
          className="mx-5 overflow-hidden rounded-[24px] shadow-[0_12px_40px_rgba(37,52,63,0.18)]"
          style={{ background: "#1C2B36" }}
        >
          {/* Gold badge */}
          <div className="flex justify-center pb-2 pt-3">
            <div className="rounded-full px-4 py-1.5" style={{ background: "#B07C35" }}>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white">
                MEMBER QR CODE
              </p>
            </div>
          </div>

          {/* Logo */}
          <div className="flex flex-col items-center gap-0.5 pb-2">
            <Coffee size={22} className="text-white" strokeWidth={1.8} />
            <p className="text-[18px] font-black tracking-[-0.04em] text-white">POLKS</p>
            <div className="mt-1 h-[2px] w-8 rounded-full" style={{ background: "#B07C35" }} />
          </div>

          {/* Scan label */}
          <p className="pb-5 pt-2 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-white/50">
            SCAN TO EARN
          </p>

          {/* QR */}
          <div className="flex justify-center pb-5">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex size-[180px] items-center justify-center">
                {loadingQr ? (
                  <span className="text-xs font-medium text-polks-muted">Memuat QR…</span>
                ) : qrImage ? (
                  <img src={qrImage} alt={`QR member ${memberId}`} className="size-full object-contain" />
                ) : qrError ? (
                  <div className="flex flex-col items-center gap-2 px-2 text-center">
                    <QrCode size={36} color="#C0CBD3" strokeWidth={1.2} />
                    <p className="text-[11px] font-semibold leading-snug text-polks-muted">
                      QR gagal dimuat
                    </p>
                    <button
                      type="button"
                      onClick={loadQr}
                      className="rounded-lg bg-polks-brand px-3 py-1.5 text-[11px] font-bold text-white"
                    >
                      Coba lagi
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* ── Member info ── */}
        <Link
          href="/profile"
          className="mx-5 mt-3 flex items-center justify-between rounded-2xl bg-polks-card px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <div
              className="flex size-10 items-center justify-center rounded-full text-[16px] font-black text-white"
              style={{ background: "#1C2B36" }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-[14px] font-bold text-polks-text">{name}</p>
              <p className="text-[12px] font-semibold" style={{ color: "#B07C35" }}>
                {tierMeta.label} Member
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-polks-muted" />
        </Link>

        {/* ── Stats row ── */}
        <div className="mx-5 mt-3 grid grid-cols-3 divide-x divide-polks-surface rounded-2xl bg-polks-card py-3">
          <div className="flex flex-col items-center gap-1 px-2">
            <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-polks-muted">MEMBER LEVEL</p>
            <p className="text-[13px] font-bold" style={{ color: tierMeta.badgeText }}>
              {(user?.tier ?? "bronze").toUpperCase()}
            </p>
          </div>
          <div className="flex flex-col items-center gap-1 px-2">
            <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-polks-muted">POINTS BALANCE</p>
            <p className="text-[13px] font-bold text-polks-text">
              {points.toLocaleString("id-ID")}
              <span className="ml-0.5 text-[10px] font-medium text-polks-muted"> PTS</span>
            </p>
          </div>
          <div className="flex flex-col items-center gap-1 px-2">
            <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-polks-muted">MEMBER ID</p>
            <p className="font-mono text-[10px] font-bold text-polks-text">{memberId}</p>
          </div>
        </div>

        {/* ── Action tiles ── */}
        <div className="mx-5 mt-3 grid grid-cols-2 gap-3">
          <Link href="/history" className="flex items-center gap-3 rounded-2xl bg-polks-card px-4 py-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-polks-brand">
              <History size={16} color="#fff" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold text-polks-text">Riwayat</p>
              <p className="text-[10px] leading-snug text-polks-muted">Lihat transaksi sebelumnya</p>
            </div>
            <ChevronRight size={13} className="shrink-0 text-polks-muted" />
          </Link>
          <Link href="/outlets" className="flex items-center gap-3 rounded-2xl bg-polks-card px-4 py-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-polks-brand">
              <MapPin size={16} color="#fff" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold text-polks-text">Outlet</p>
              <p className="text-[10px] leading-snug text-polks-muted">Temukan outlet terdekat</p>
            </div>
            <ChevronRight size={13} className="shrink-0 text-polks-muted" />
          </Link>
        </div>

      </div>
    </CustomerShell>
  );
}
