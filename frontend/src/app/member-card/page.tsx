/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  RefreshCw,
  History,
  MapPin,
  Shield,
  CheckCircle2,
  User,
  QrCode,
} from "lucide-react";
import { CustomerShell } from "@/components/layout/customer-shell";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { getTier, TIER_META } from "@/lib/loyalty/tier";

export default function MemberCardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const name = user?.name || "Member";
  const memberId = user?.memberCode || "—";
  const points = user?.pointBalance ?? 0;
  const tierMeta = TIER_META[getTier(points)];

  // QR asli dari backend (berisi memberCode — id milik CRM, dipindai POS).
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
      <div className="min-h-screen bg-polks-brand pb-28">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 pt-4">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 text-[13px] font-medium text-white/55"
          >
            <ArrowLeft size={18} />
            Kembali
          </button>
          <button
            type="button"
            onClick={loadQr}
            disabled={loadingQr}
            className="flex items-center gap-1.5 text-xs text-white/45 disabled:opacity-50"
          >
            <RefreshCw size={13} className={loadingQr ? "animate-spin" : ""} />
            {loadingQr ? "Memuat…" : "Refresh"}
          </button>
        </div>

        {/* Title */}
        <div className="px-5 pb-5 pt-3">
          <h1 className="text-xl font-bold tracking-[-0.01em] text-white">Member Card</h1>
          <p className="mt-0.5 text-xs text-white/40">
            Tunjukkan QR ini ke kasir saat transaksi
          </p>
        </div>

        {/* THE CARD */}
        <div className="px-4">
          <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
            {/* Header strip */}
            <div className="flex items-center justify-between bg-polks-brand px-5 py-4">
              <Image
                src="/polks/logo.png"
                alt="POLKS"
                width={80}
                height={32}
                className="h-7 w-auto object-contain"
              />
              <div className="text-right">
                <span
                  className="inline-block rounded-full px-2.5 py-[3px] text-[9px] font-semibold uppercase tracking-[0.08em]"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)", color: tierMeta.badgeText }}
                >
                  {tierMeta.label} Member
                </span>
                <div className="mt-1.5 flex items-baseline justify-end gap-1">
                  <span className="text-[22px] font-bold leading-none tracking-[-0.02em] text-white">
                    {points.toLocaleString("id-ID")}
                  </span>
                  <span className="text-[11px] text-white/45">pts</span>
                </div>
              </div>
            </div>

            {/* QR area */}
            <div className="flex flex-col items-center gap-4 px-5 pb-5 pt-6">
              <div className="inline-block rounded-2xl border border-polks-border bg-white p-2.5">
                <div className="flex size-[200px] items-center justify-center">
                  {loadingQr ? (
                    <span className="text-xs font-medium text-polks-muted">Memuat QR…</span>
                  ) : qrImage ? (
                    <img
                      src={qrImage}
                      alt={`QR member ${memberId}`}
                      className="size-full object-contain"
                    />
                  ) : (
                    <QrCode size={140} color="#17212A" strokeWidth={1} />
                  )}
                </div>
              </div>

              {/* Member info */}
              <div className="text-center">
                <p className="text-[15px] font-semibold text-polks-text">{name}</p>
                <p className="mt-0.5 font-mono text-[11px] tracking-[0.04em] text-[#8A959D]">
                  {memberId}
                </p>
              </div>

              {/* Scan pill */}
              <div className="flex items-center gap-1.5 rounded-full border border-polks-surface bg-polks-bg px-4 py-[7px]">
                <span className="size-1.5 rounded-full bg-polks-success" />
                <span className="text-xs font-medium text-polks-text">
                  Scan di kasir untuk catat poin
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-1.5 border-t border-polks-surface px-5 pb-4 pt-3">
              <div className="flex items-center gap-1.5">
                <MapPin size={11} color="#C0CBD3" />
                <span className="text-[11px] text-[#8A959D]">Berlaku di semua outlet POLKS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield size={11} color="#C0CBD3" />
                <span className="text-[11px] text-[#8A959D]">
                  Untuk verifikasi member dan pencatatan poin
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 px-4 pb-4 pt-4">
          <Link
            href="/history"
            className="flex h-[46px] flex-1 items-center justify-center gap-1.5 rounded-[14px] border border-white/12 bg-white/10 text-[13px] font-semibold text-white/70"
          >
            <History size={15} />
            Riwayat
          </Link>
          <Link
            href="/profile"
            className="flex h-[46px] flex-1 items-center justify-center gap-1.5 rounded-[14px] border border-white/12 bg-white/10 text-[13px] font-semibold text-white/70"
          >
            <User size={15} />
            Profil
          </Link>
        </div>

        {/* Tips */}
        <div className="flex flex-col gap-2 px-4">
          {[
            { Icon: CheckCircle2, text: "QR ini hanya untuk ditunjukkan ke kasir POLKS." },
            { Icon: Shield, text: "Poin otomatis tercatat setelah kasir scan QR." },
          ].map(({ Icon, text }) => (
            <div
              key={text}
              className="flex items-start gap-2.5 rounded-xl bg-white/[0.06] px-3.5 py-2.5"
            >
              <Icon size={13} color="rgba(255,255,255,0.3)" className="mt-0.5 shrink-0" />
              <span className="text-[11px] leading-relaxed text-white/35">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </CustomerShell>
  );
}
