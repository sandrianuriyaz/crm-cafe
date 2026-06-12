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
          "bg-deep-navy rounded-3xl p-6 relative overflow-hidden shadow-2xl",
          className
        )}
      >
        {/* Decorative subtle circle */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white opacity-5 rounded-full blur-2xl" />
        <div className="flex justify-between items-start relative z-10">
          <div>
            <p className="font-caption text-caption text-secondary-fixed-dim mb-1 uppercase tracking-wider">
              Available Balance
            </p>
            <h3 className="text-[36px] leading-[40px] font-bold text-gold tracking-tight mb-4 flex items-center gap-2">
              {points.toLocaleString("id-ID")}{" "}
              <span className="text-[18px] font-medium text-soft-gold opacity-80 mt-2">pts</span>
            </h3>
            <div className="inline-flex items-center bg-soft-gold/10 px-3 py-1.5 rounded-full border border-soft-gold/20">
              <Icon name="stars" fill className="text-[16px] text-gold mr-2 size-4" />
              <span className="font-caption text-caption text-soft-gold">{tier}</span>
            </div>
          </div>
          {/* Mini QR Preview — klik untuk tampil besar */}
          <button
            type="button"
            onClick={() => qrImage && setShowLarge(true)}
            aria-label="Tampilkan QR member ukuran besar"
            className="bg-white p-2 rounded-xl flex items-center justify-center shadow-lg border border-white/20 transition-transform hover:scale-105 disabled:cursor-default disabled:hover:scale-100"
            disabled={!qrImage}
          >
            {qrImage ? (
              <img src={qrImage} alt="QR member" className="size-10 rounded" />
            ) : (
              <Icon name="qr_code_2" className="text-[40px] text-on-background size-10" />
            )}
          </button>
        </div>
        <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center relative z-10">
          <div>
            <p className="font-caption text-caption text-secondary-fixed-dim mb-0.5">Member ID</p>
            <p className="font-body-semibold text-body-semibold text-white tracking-widest">
              {memberId}
            </p>
          </div>
          <button
            type="button"
            onClick={copyId}
            aria-label="Salin Member ID"
            className="text-white hover:text-gold transition-colors"
          >
            <Icon name="content_copy" className="size-6" />
          </button>
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
