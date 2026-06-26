/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, History, MapPin, QrCode, Star, Sparkles, CreditCard, Coffee } from "lucide-react";
import { CustomerShell } from "@/components/layout/customer-shell";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { TIER_META } from "@/lib/loyalty/tier";

export default function MemberCardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const name = user?.name || "Member";
  const memberId = user?.memberCode || "—";
  const points = user?.pointBalance ?? 0;
  const tierMeta = TIER_META[user?.tier ?? "bronze"];

  const [qrImage, setQrImage] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(true);

  const loadQr = useCallback(() => {
    setLoadingQr(true);
    api<{ image_data_url: string }>("/member/qr")
      .then((res) => setQrImage(res.image_data_url))
      .catch(() => setQrImage(null))
      .finally(() => setLoadingQr(false));
  }, []);

  useEffect(() => {
    loadQr();
  }, [loadQr]);

  return (
    <CustomerShell showHeader={false} topbarRight={null}>
      <div className="min-h-screen bg-polks-bg pb-28">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 pt-4">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 text-[13px] font-medium text-polks-muted"
          >
            <ArrowLeft size={18} />
            Kembali
          </button>
          <button
            type="button"
            onClick={loadQr}
            disabled={loadingQr}
            className="flex items-center gap-1.5 text-xs font-medium text-polks-muted disabled:opacity-50"
          >
            <RefreshCw size={13} className={loadingQr ? "animate-spin" : ""} />
            {loadingQr ? "Memuat…" : "Refresh"}
          </button>
        </div>

        {/* Card */}
        <div className="mx-5 mt-5 overflow-hidden rounded-[28px] shadow-[0_18px_48px_rgba(37,52,63,0.22)]">

          {/* ── Top: cream section ── */}
          <div style={{ background: "#EDE8DC" }} className="px-6 pb-6 pt-6">
            {/* Logo — teks navy langsung, logo PNG putih tidak kontras di krem */}
            <div className="mb-5 flex flex-col items-center gap-0.5">
              <Coffee size={22} className="text-polks-brand" strokeWidth={1.8} />
              <p className="text-[22px] font-black tracking-[-0.04em] text-polks-brand">POLKS</p>
            </div>

            {/* Labels */}
            <div className="mb-5 text-center">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-polks-muted">
                MEMBER QR CODE
              </p>
              <p className="mt-1 text-[24px] font-black leading-none tracking-[-0.02em] text-polks-text">
                SCAN TO EARN
              </p>
              <p className="mt-1.5 text-[12px] text-polks-muted">
                Tunjukkan QR ini ke kasir saat transaksi
              </p>
            </div>

            {/* QR */}
            <div className="flex justify-center">
              <div className="rounded-2xl bg-white p-3.5 shadow-sm">
                <div className="flex size-[164px] items-center justify-center">
                  {loadingQr ? (
                    <span className="text-xs font-medium text-polks-muted">Memuat QR…</span>
                  ) : qrImage ? (
                    <img src={qrImage} alt={`QR member ${memberId}`} className="size-full object-contain" />
                  ) : (
                    <QrCode size={144} color="#17212A" strokeWidth={1} />
                  )}
                </div>
              </div>
            </div>

            {/* Member code */}
            <p className="mt-4 text-center font-mono text-[13px] font-semibold tracking-[0.12em] text-polks-text">
              {memberId}
            </p>
          </div>

          {/* Wave: cream → dark navy */}
          <div style={{ background: "#EDE8DC" }}>
            <svg viewBox="0 0 390 32" preserveAspectRatio="none" className="block w-full">
              <path d="M0,0 Q195,32 390,0 L390,32 L0,32 Z" fill="#25343F" />
            </svg>
          </div>

          {/* ── Bottom: dark navy section ── */}
          <div className="bg-polks-brand px-6 py-5">
            <div className="flex items-start justify-between">
              {/* Member Level */}
              <div className="flex flex-col items-center gap-1.5">
                <Star size={16} color="#F6B84B" fill="#F6B84B" />
                <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-white/40">
                  MEMBER LEVEL
                </p>
                <p className="text-[13px] font-bold" style={{ color: tierMeta.badgeText }}>
                  {tierMeta.label.toUpperCase()}
                </p>
              </div>

              <div className="mt-1 h-10 w-px bg-white/10" />

              {/* Points Balance */}
              <div className="flex flex-col items-center gap-1.5">
                <Sparkles size={16} className="text-white/60" />
                <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-white/40">
                  POINTS BALANCE
                </p>
                <p className="text-[13px] font-bold text-white">
                  {points.toLocaleString("id-ID")}
                  <span className="ml-0.5 text-[10px] font-medium text-white/50"> PTS</span>
                </p>
              </div>

              <div className="mt-1 h-10 w-px bg-white/10" />

              {/* Member name */}
              <div className="flex max-w-[80px] flex-col items-center gap-1.5">
                <CreditCard size={16} className="text-white/60" />
                <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-white/40">
                  NAMA
                </p>
                <p className="line-clamp-1 text-center text-[11px] font-bold text-white">
                  {name}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Note */}
        <p className="flex items-center gap-1.5 px-6 pt-4 text-[11px] text-polks-muted">
          <MapPin size={12} className="shrink-0" />
          Berlaku di semua outlet POLKS
        </p>

        {/* Actions */}
        <div className="flex gap-2.5 px-5 pt-4">
          <Link
            href="/history"
            className="flex h-[46px] flex-1 items-center justify-center gap-1.5 rounded-2xl border border-polks-border bg-white text-[13px] font-semibold text-polks-text"
          >
            <History size={15} />
            Riwayat
          </Link>
          <Link
            href="/outlets"
            className="flex h-[46px] flex-1 items-center justify-center gap-1.5 rounded-2xl border border-polks-border bg-white text-[13px] font-semibold text-polks-text"
          >
            <MapPin size={15} />
            Outlet
          </Link>
        </div>
      </div>
    </CustomerShell>
  );
}
