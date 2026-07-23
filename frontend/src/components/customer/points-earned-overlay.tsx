"use client";

import { useEffect } from "react";
import { Coins } from "lucide-react";

const AUTO_CLOSE_MS = 3200;

// Overlay full-screen saat poin masuk dari transaksi POS — bukan toast kecil,
// biar terasa "dirayakan" mirip notifikasi coin di Gopay. Tutup otomatis atau
// ketuk di mana saja untuk lanjut lebih cepat.
//
// Kembarannya: VoucherUsedOverlay. Keduanya memakai kelas animasi celebrate-*
// yang sama; kalau tata letaknya berubah, samakan juga di sana.
export function PointsEarnedOverlay({
  amount,
  onClose,
}: {
  amount: number;
  onClose: () => void;
}) {
  useEffect(() => {
    const t = window.setTimeout(onClose, AUTO_CLOSE_MS);
    return () => window.clearTimeout(t);
  }, [onClose]);

  return (
    <div
      role="button"
      aria-label="Tutup notifikasi poin"
      onClick={onClose}
      className="celebrate-in fixed inset-0 z-[70] flex flex-col items-center justify-center px-6"
      style={{ background: "linear-gradient(160deg,#1A2830 0%,#25343F 55%,#2D3A28 100%)" }}
    >
      <div className="celebrate-pop flex size-28 items-center justify-center rounded-full bg-[#F6B84B] shadow-[0_0_60px_rgba(246,184,75,0.45)]">
        <Coins size={52} className="text-[#25343F]" strokeWidth={1.8} />
      </div>
      <p className="celebrate-text mt-6 text-[15px] font-semibold text-white/60">Poin masuk!</p>
      <p className="celebrate-text text-[40px] font-black leading-tight tracking-[-0.02em] text-[#F6B84B]">
        +{amount.toLocaleString("id-ID")}
      </p>
      <p className="celebrate-text text-center text-[13px] text-white/50">
        Poin dari transaksimu di outlet POLKS sudah ditambahkan.
      </p>
      <p className="celebrate-text mt-10 text-[11px] text-white/30">Ketuk di mana saja untuk lanjut</p>
    </div>
  );
}
