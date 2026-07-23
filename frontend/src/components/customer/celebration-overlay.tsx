"use client";

import { useEffect } from "react";
import { Coins, Ticket } from "lucide-react";

const AUTO_CLOSE_MS = 3600;

// Overlay perayaan full-screen (gaya coin Gopay) untuk momen di kasir: poin
// masuk dan/atau voucher terpakai. Satu transaksi bisa memicu keduanya, dan
// keduanya ditampilkan BERSAMAAN di sini — sebelumnya tampil bergantian, jadi
// layar tertutup dua kali berturut-turut dan terasa seperti app menggantung.
//
// Poin sengaja jadi bintang utamanya (ikon besar + angka 40px); voucher jadi
// baris pendukung di bawahnya. Kalau poinnya nol (mis. order lunas via poin),
// voucher naik jadi tampilan utama supaya layar tidak terasa kosong.
export function CelebrationOverlay({
  points,
  voucherNames,
  onClose,
}: {
  points: number;
  voucherNames: string[];
  onClose: () => void;
}) {
  const hasPoints = points > 0;
  const hasVoucher = voucherNames.length > 0;
  // Dipakai sebagai dependency efek: array identitasnya berubah tiap merge,
  // string-nya tidak — jadi timer hanya di-reset saat isinya benar-benar beda.
  const voucherLabel = voucherNames.join(" · ");

  useEffect(() => {
    const startedAt = Date.now();
    let timer = window.setTimeout(onClose, AUTO_CLOSE_MS);

    // setTimeout dibekukan browser mobile saat app di latar belakang — dan di
    // kasir itu justru keadaan normalnya: member menaruh/mengunci HP setelah
    // QR discan, overlay muncul selagi layar mati, lalu saat HP dibuka lagi
    // timernya belum jalan. Overlay menutupi seluruh layar (termasuk tombol
    // kembali) entah sampai kapan. Jadi hitung ulang sisa waktunya tiap app
    // terlihat lagi, dan tutup langsung bila jatahnya sudah lewat.
    const recheck = () => {
      if (document.visibilityState !== "visible") return;
      window.clearTimeout(timer);
      const left = AUTO_CLOSE_MS - (Date.now() - startedAt);
      if (left <= 0) onClose();
      else timer = window.setTimeout(onClose, left);
    };

    document.addEventListener("visibilitychange", recheck);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", recheck);
    };
  }, [onClose, points, voucherLabel]);

  return (
    <div
      role="button"
      aria-label="Tutup notifikasi"
      onClick={onClose}
      className="celebrate-in fixed inset-0 z-[70] flex flex-col items-center justify-center px-6"
      style={{ background: "linear-gradient(160deg,#1A2830 0%,#25343F 55%,#2D3A28 100%)" }}
    >
      {hasPoints ? (
        <>
          <div className="celebrate-pop flex size-28 items-center justify-center rounded-full bg-[#F6B84B] shadow-[0_0_60px_rgba(246,184,75,0.45)]">
            <Coins size={52} className="text-[#25343F]" strokeWidth={1.8} />
          </div>
          <p className="celebrate-text mt-6 text-[15px] font-semibold text-white/60">Poin masuk!</p>
          <p className="celebrate-text text-[40px] font-black leading-tight tracking-[-0.02em] text-[#F6B84B]">
            +{points.toLocaleString("id-ID")}
          </p>
          <p className="celebrate-text text-center text-[13px] text-white/50">
            Poin dari transaksimu di outlet POLKS sudah ditambahkan.
          </p>

          {/* Voucher: baris pendukung, sengaja jauh lebih kecil dari poin. */}
          {hasVoucher && (
            <div className="celebrate-text mt-5 flex max-w-full items-center gap-2.5 rounded-2xl border border-white/[0.12] bg-white/[0.07] px-4 py-2.5">
              <Ticket size={16} className="shrink-0 text-[#6FCF97]" strokeWidth={1.8} />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-white/45">Voucher terpakai</p>
                <p className="truncate text-[13px] font-bold text-white/90">{voucherLabel}</p>
              </div>
            </div>
          )}
        </>
      ) : (
        // Voucher saja — mis. order lunas via poin, jadi tidak ada earning.
        <>
          <div className="celebrate-pop flex size-28 items-center justify-center rounded-full bg-[#38A169] shadow-[0_0_60px_rgba(56,161,105,0.45)]">
            <Ticket size={52} className="text-white" strokeWidth={1.8} />
          </div>
          <p className="celebrate-text mt-6 text-[15px] font-semibold text-white/60">
            Voucher terpakai!
          </p>
          <p className="celebrate-text line-clamp-2 text-center text-[30px] font-black leading-tight tracking-[-0.02em] text-[#6FCF97]">
            {voucherLabel || "Reward"}
          </p>
          <p className="celebrate-text mt-1 text-center text-[13px] text-white/50">
            Sudah ditukarkan di kasir. Selamat menikmati!
          </p>
        </>
      )}

      <p className="celebrate-text mt-10 text-[11px] text-white/30">
        Ketuk di mana saja untuk lanjut
      </p>
    </div>
  );
}
