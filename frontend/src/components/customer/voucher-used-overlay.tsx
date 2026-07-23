"use client";

import { useEffect } from "react";
import { Ticket } from "lucide-react";

const AUTO_CLOSE_MS = 3200;

// Overlay full-screen saat kasir selesai memakai voucher di kasir. Kembaran
// PointsEarnedOverlay — tata letak & kelas animasi (celebrate-*) sengaja
// disamakan supaya dua momen perayaan ini terasa satu keluarga; yang beda
// hanya ikon dan warna aksen (hijau "berhasil", bukan emas poin).
export function VoucherUsedOverlay({
  rewardName,
  onClose,
}: {
  rewardName: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    const t = window.setTimeout(onClose, AUTO_CLOSE_MS);
    return () => window.clearTimeout(t);
  }, [onClose]);

  return (
    <div
      role="button"
      aria-label="Tutup notifikasi voucher"
      onClick={onClose}
      className="celebrate-in fixed inset-0 z-[70] flex flex-col items-center justify-center px-6"
      style={{ background: "linear-gradient(160deg,#1A2830 0%,#25343F 55%,#1F3A2E 100%)" }}
    >
      <div className="celebrate-pop flex size-28 items-center justify-center rounded-full bg-[#38A169] shadow-[0_0_60px_rgba(56,161,105,0.45)]">
        <Ticket size={52} className="text-white" strokeWidth={1.8} />
      </div>
      <p className="celebrate-text mt-6 text-[15px] font-semibold text-white/60">Voucher terpakai!</p>
      {/* Nama reward bisa panjang — batasi 2 baris supaya tidak mendorong teks
          di bawahnya keluar layar pada ponsel pendek. */}
      <p className="celebrate-text line-clamp-2 text-center text-[30px] font-black leading-tight tracking-[-0.02em] text-[#6FCF97]">
        {rewardName ?? "Reward"}
      </p>
      <p className="celebrate-text mt-1 text-center text-[13px] text-white/50">
        Sudah ditukarkan di kasir. Selamat menikmati!
      </p>
      <p className="celebrate-text mt-10 text-[11px] text-white/30">Ketuk di mana saja untuk lanjut</p>
    </div>
  );
}
