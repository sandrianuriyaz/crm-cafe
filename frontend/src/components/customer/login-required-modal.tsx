"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { X, QrCode, Star, Gift, Lock } from "lucide-react";

const features = [
  { Icon: QrCode, text: "Tunjukkan QR member ke kasir" },
  { Icon: Star, text: "Kumpulkan poin resmi POLKS" },
  { Icon: Gift, text: "Tukar poin dengan reward & voucher" },
];

export function LoginRequiredModal({
  open,
  onClose,
  reason,
}: {
  open: boolean;
  onClose: () => void;
  reason?: string;
}) {
  const router = useRouter();
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(23,33,42,0.6)] backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex w-full max-w-[430px] flex-col rounded-t-3xl bg-white px-5 pb-9 pt-5">
        <div className="mb-5 flex justify-center">
          <div className="h-1 w-9 rounded-full bg-polks-border" />
        </div>

        <div className="mb-5 flex items-start justify-between">
          <Image src="/polks/icon.png" alt="POLKS" width={28} height={28} className="size-7 object-contain" />
          <button type="button" onClick={onClose} aria-label="Tutup" className="p-1 text-polks-muted">
            <X size={20} />
          </button>
        </div>

        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-polks-surface">
          <Lock size={24} className="text-polks-brand" strokeWidth={2} />
        </div>

        <h2 className="mb-2 text-[22px] font-bold leading-tight tracking-[-0.01em] text-polks-text">
          Login Dulu
        </h2>
        <p className="mb-5 text-[13px] leading-relaxed text-polks-muted">
          {reason ?? "Login atau daftar untuk melihat member card, kumpulkan poin, dan tukar reward."}
        </p>

        <div className="mb-6 flex flex-col gap-2">
          {features.map(({ Icon, text }) => (
            <div key={text} className="flex items-center gap-3 rounded-xl bg-polks-bg px-3 py-2.5">
              <Icon size={14} className="text-polks-brand" strokeWidth={2} />
              <span className="text-xs font-medium text-polks-text">{text}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="h-[50px] rounded-[14px] bg-polks-brand text-sm font-bold text-white"
          >
            Login ke Akun
          </button>
          <button
            type="button"
            onClick={() => router.push("/register")}
            className="h-[50px] rounded-[14px] border-[1.5px] border-polks-border bg-white text-sm font-bold text-polks-brand"
          >
            Daftar Gratis
          </button>
          <button type="button" onClick={onClose} className="pt-1 text-[13px] font-medium text-polks-muted">
            Lanjut tanpa login
          </button>
        </div>
      </div>
    </div>
  );
}
