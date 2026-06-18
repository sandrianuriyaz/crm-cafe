"use client";

import { Gift, MapPin, AlertCircle } from "lucide-react";
import { type Reward } from "@/lib/loyalty/types";

// Bottom-sheet konfirmasi penukaran (sesuai desain RedeemConfirmation Figma).
export function RedeemSheet({
  reward,
  points,
  redeeming,
  error,
  onCancel,
  onConfirm,
}: {
  reward: Reward;
  points: number;
  redeeming: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const remaining = points - reward.pointCost;
  const canRedeem = remaining >= 0 && reward.stock > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <button
        type="button"
        aria-label="Tutup"
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
      />
      <div className="relative z-10 flex w-full max-w-[420px] flex-col gap-4 rounded-t-[24px] bg-polks-bg p-5 md:rounded-[24px]">
        <h2 className="text-lg font-bold text-polks-text">Konfirmasi Penukaran</h2>

        <div className="overflow-hidden rounded-2xl border border-polks-border">
          <div
            className="flex items-center gap-3.5 px-[18px] py-4"
            style={{ background: "linear-gradient(135deg,#25343F 0%,#3a5068 100%)" }}
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[rgba(246,184,75,0.2)]">
              <Gift size={20} color="#F6B84B" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-white">{reward.name}</p>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-white/40">
                <MapPin size={10} />
                All Outlets
              </div>
            </div>
          </div>
          {reward.description ? (
            <div className="bg-white px-[18px] py-3.5">
              <p className="text-xs leading-relaxed text-polks-muted">{reward.description}</p>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-polks-border bg-white p-4">
          <p className="text-[13px] font-semibold text-polks-text">Detail Poin</p>
          <div className="flex justify-between text-[13px]">
            <span className="text-polks-muted">Saldo saat ini</span>
            <span className="font-semibold text-polks-text">{points.toLocaleString("id-ID")} pts</span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-polks-muted">Poin yang digunakan</span>
            <span className="font-semibold text-polks-error">
              − {reward.pointCost.toLocaleString("id-ID")} pts
            </span>
          </div>
          <div className="h-px bg-polks-surface" />
          <div className="flex justify-between">
            <span className="text-[13px] font-semibold text-polks-text">Sisa setelah tukar</span>
            <span
              className={
                "text-[15px] font-bold " +
                (remaining >= 0 ? "text-polks-success" : "text-polks-error")
              }
            >
              {remaining.toLocaleString("id-ID")} pts
            </span>
          </div>
        </div>

        {error ? (
          <div className="flex items-start gap-3 rounded-2xl border border-[rgba(224,79,79,0.4)] bg-[#FDECEC] px-4 py-3">
            <AlertCircle size={15} color="#E04F4F" className="mt-0.5 shrink-0" />
            <p className="text-xs leading-relaxed text-polks-error">{error}</p>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-2xl border border-[rgba(246,184,75,0.4)] bg-polks-point-soft px-4 py-3">
            <AlertCircle size={15} color="#92400E" className="mt-0.5 shrink-0" />
            <p className="text-xs leading-relaxed text-[#92400E]">
              Penukaran poin <strong>tidak dapat dibatalkan</strong> setelah dikonfirmasi.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={redeeming || !canRedeem}
            onClick={onConfirm}
            className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[14px] bg-polks-brand text-sm font-bold text-white disabled:opacity-50"
          >
            <Gift size={16} />
            {redeeming ? "Memproses…" : !canRedeem ? "Poin tidak cukup" : "Konfirmasi Penukaran"}
          </button>
          <button
            type="button"
            disabled={redeeming}
            onClick={onCancel}
            className="h-[50px] w-full rounded-[14px] border-[1.5px] border-polks-border bg-white text-sm font-semibold text-polks-brand disabled:opacity-50"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
