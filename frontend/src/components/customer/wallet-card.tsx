/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type WalletCardProps = {
  points: number;
  tier: string;
  memberId: string;
  className?: string;
};

export function WalletCard({ points, tier, memberId, className }: WalletCardProps) {
  // QR asli dari backend (berisi memberCode — id milik CRM, dipindai POS).
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [showLarge, setShowLarge] = useState(false);

  useEffect(() => {
    let active = true;
    api<{ image_data_url: string }>("/member/qr")
      .then((res) => {
        if (active) setQrImage(res.image_data_url);
      })
      .catch(() => {
        if (active) setQrImage(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const copyId = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(memberId).catch(() => {});
    }
  }, [memberId]);

  return (
    <>
      <div
        className={cn(
          "overflow-hidden rounded-[24px] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.28)]",
          className
        )}
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-polks-brand to-[#17212A] px-[18px] py-4">
          <div className="absolute -right-5 -top-5 size-24 rounded-full bg-white/5" />
          <div className="relative flex items-center justify-between">
            <span className="inline-flex items-center gap-1 rounded-full border border-polks-point/35 bg-polks-point/15 px-2.5 py-1 text-[9px] font-extrabold uppercase text-polks-point">
              <Icon name="stars" fill className="size-3" />
              {tier.replace(" Tier Member", "")}
            </span>
            <button
              type="button"
              onClick={() => qrImage && setShowLarge(true)}
              aria-label="Tampilkan QR member ukuran besar"
              className="rounded-[10px] border-2 border-white/25 bg-white p-1.5 shadow-lg transition-transform hover:scale-105 disabled:cursor-default disabled:hover:scale-100"
              disabled={!qrImage}
            >
              {qrImage ? (
                <img src={qrImage} alt="QR member" className="size-11 rounded" />
              ) : (
                <Icon name="qr_code_2" className="size-11 text-polks-text" />
              )}
            </button>
          </div>
        </div>

        <div className="h-[3px] bg-polks-point/70" />

        <div className="px-[18px] pb-[18px] pt-4">
          <p className="mb-1 text-[10px] text-polks-muted">Saldo Poin Resmi</p>
          <div className="mb-1 flex items-end gap-2">
            <span className="text-[34px] font-bold leading-none text-polks-text">
              {points.toLocaleString("id-ID")}
            </span>
            <span className="mb-1 text-[13px] font-medium text-polks-muted">pts</span>
          </div>
          <p className="mb-3 text-[10px] text-polks-muted">{memberId}</p>

          <div className="mb-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[10px] text-polks-muted">
                750 pts lagi ke Platinum Member
              </span>
              <Icon name="workspace_premium" className="size-3.5 text-polks-point" />
            </div>
            <div className="h-[5px] overflow-hidden rounded-full bg-polks-surface">
              <div
                className="h-full rounded-full bg-polks-point"
                style={{ width: `${Math.min(100, (points / 2000) * 100)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-polks-surface pt-3">
            <div className="flex items-center gap-1.5">
              <Icon name="location_on" className="size-3 text-[#C0CBD3]" />
              <span className="text-[10px] text-[#8A959D]">Semua outlet POLKS</span>
            </div>
            <button
              type="button"
              onClick={copyId}
              className="inline-flex items-center gap-1 rounded-lg bg-polks-surface px-2.5 py-1 text-[11px] font-semibold text-polks-brand"
            >
              Salin ID
              <Icon name="content_copy" className="size-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal QR besar */}
      {showLarge && qrImage ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="QR member"
          onClick={() => setShowLarge(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex w-full max-w-xs flex-col items-center gap-4 rounded-3xl bg-white p-6 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setShowLarge(false)}
              aria-label="Tutup"
              className="absolute right-4 top-4 text-on-surface-variant hover:text-on-surface"
            >
              <Icon name="close" className="size-6" />
            </button>
            <p className="font-section-title text-section-title text-on-surface">
              Member QR
            </p>
            <img src={qrImage} alt={`QR member ${memberId}`} className="w-full rounded-xl" />
            <p className="font-body-semibold text-body-semibold tracking-widest text-on-surface">
              {memberId}
            </p>
            <p className="font-caption text-caption text-on-surface-variant text-center">
              Tunjukkan QR ini ke kasir
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
