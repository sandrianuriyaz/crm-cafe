import Image from "next/image";
import Link from "next/link";

// Ditampilkan service worker saat navigasi gagal dan halamannya belum pernah
// dibuka (jadi tidak ada salinan cache). Sengaja tanpa "use client" dan tanpa
// data fetching — halaman ini harus bisa dirender walau jaringan mati total.
export const metadata = {
  title: "Tidak ada koneksi — POLKS",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-5 bg-polks-bg px-6 text-center">
      <Image
        src="/polks/icon.png"
        alt=""
        width={56}
        height={56}
        className="size-14 object-contain opacity-40"
      />
      <div>
        <p className="font-display text-[16px] font-extrabold text-polks-text">
          Tidak ada koneksi
        </p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-polks-muted">
          Halaman ini butuh internet. Poin dan riwayat transaksi akan muncul
          lagi begitu kamu kembali online.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-full bg-polks-brand px-5 py-2.5 text-[13px] font-semibold text-white"
      >
        Coba lagi
      </Link>
    </div>
  );
}
