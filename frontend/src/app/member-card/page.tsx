/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, History, MapPin, QrCode } from "lucide-react";
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

        {/* Title */}
        <div className="px-5 pb-5 pt-3">
          <h1 className="text-[22px] font-bold tracking-[-0.02em] text-polks-text">Member Card</h1>
          <p className="mt-0.5 text-[13px] text-polks-muted">
            Tunjukkan QR ini ke kasir saat transaksi
          </p>
        </div>

        {/* Kartu member — satu kartu navy */}
        <div className="px-5">
          <div
            className="rounded-[28px] p-6 shadow-[0_18px_45px_rgba(37,52,63,0.28)]"
            style={{ background: "linear-gradient(135deg,#25343F 0%,#2A3D4D 55%,#1E3040 100%)" }}
          >
            {/* Logo + tier */}
            <div className="flex items-center justify-between">
              <Image
                src="/polks/logo.png"
                alt="POLKS"
                width={84}
                height={32}
                className="h-7 w-auto object-contain"
              />
              <span
                className="rounded-full bg-white/10 px-2.5 py-[3px] text-[9px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: tierMeta.badgeText }}
              >
                {tierMeta.label} Member
              </span>
            </div>

            {/* QR dalam tile putih */}
            <div className="mt-6 flex justify-center">
              <div className="rounded-2xl bg-white p-3.5">
                <div className="flex size-[168px] items-center justify-center">
                  {loadingQr ? (
                    <span className="text-xs font-medium text-polks-muted">Memuat QR…</span>
                  ) : qrImage ? (
                    <img src={qrImage} alt={`QR member ${memberId}`} className="size-full object-contain" />
                  ) : (
                    <QrCode size={148} color="#17212A" strokeWidth={1} />
                  )}
                </div>
              </div>
            </div>

            {/* Nama + ID */}
            <div className="mt-4 text-center">
              <p className="text-[15px] font-semibold text-white">{name}</p>
              <p className="mt-0.5 font-mono text-[11px] tracking-[0.04em] text-white/45">{memberId}</p>
            </div>

            {/* Saldo + scan */}
            <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
              <div>
                <p className="text-[10px] text-white/40">Saldo Poin</p>
                <p className="text-base font-bold text-white">
                  {points.toLocaleString("id-ID")}
                  <span className="ml-1 text-[11px] font-medium text-white/50">pts</span>
                </p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/70">
                <span className="size-1.5 rounded-full bg-polks-success" />
                Scan di kasir
              </span>
            </div>
          </div>
        </div>

        {/* Catatan + aksi */}
        <p className="flex items-center gap-1.5 px-6 pt-4 text-[11px] text-polks-muted">
          <MapPin size={12} className="shrink-0" />
          Berlaku di semua outlet POLKS
        </p>

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
