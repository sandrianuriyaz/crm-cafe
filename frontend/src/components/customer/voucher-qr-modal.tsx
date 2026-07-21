"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, Copy, Check } from "lucide-react";
import { type Voucher } from "@/lib/loyalty/types";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function VoucherQrModal({ voucher, onClose }: { voucher: Voucher; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(voucher.code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      // Di atas bottom nav (z-50) agar tidak tertimpa di layar pendek.
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[340px] rounded-[24px] bg-polks-card p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div className="text-left">
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-polks-brand">
              Voucher Reward
            </p>
            <p className="mt-0.5 text-[15px] font-bold text-polks-text">
              {voucher.reward?.name ?? "Reward"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-polks-surface text-polks-muted"
          >
            <X size={16} />
          </button>
        </div>

        {/* QR */}
        <div className="flex justify-center">
          <div className="rounded-2xl border border-polks-border bg-white p-4">
            <QRCodeSVG value={voucher.code} size={184} fgColor="#25343F" bgColor="#ffffff" level="M" />
          </div>
        </div>

        {/* Kode */}
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-polks-bg px-4 py-3">
          <span className="font-mono text-base font-bold tracking-[0.18em] text-polks-text">
            {voucher.code}
          </span>
          <button
            type="button"
            onClick={copy}
            className="flex items-center gap-1.5 text-xs font-semibold text-polks-brand"
          >
            {copied ? <Check size={15} color="#38A169" /> : <Copy size={15} />}
            {copied ? "Disalin" : "Salin"}
          </button>
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-polks-muted">
          Tunjukkan QR ini ke kasir untuk di-scan, atau berikan kodenya untuk diketik.
          {voucher.expiredAt ? ` Berlaku hingga ${formatDate(voucher.expiredAt)}.` : ""}
        </p>
      </div>
    </div>
  );
}
