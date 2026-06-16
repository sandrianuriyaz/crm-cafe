"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const sections = [
  {
    title: "1. Data yang Kami Kumpulkan",
    body: "Kami mengumpulkan data yang kamu berikan saat mendaftar (nama, email, nomor HP) serta data transaksi & poin yang tercatat dari outlet POLKS GROUP.",
  },
  {
    title: "2. Penggunaan Data",
    body: "Data digunakan untuk mengelola keanggotaan, mencatat poin, memproses penukaran reward, serta mengirim informasi promo yang relevan.",
  },
  {
    title: "3. Berbagi Data",
    body: "Kami tidak menjual data pribadimu. Data hanya dibagikan kepada penyedia layanan yang mendukung operasional (mis. pengiriman notifikasi) sesuai kebutuhan dan dengan kerahasiaan yang terjaga.",
  },
  {
    title: "4. Keamanan",
    body: "Kami menerapkan langkah teknis dan organisasi yang wajar untuk melindungi data. Akun diamankan dengan token; jaga kerahasiaan akses akunmu.",
  },
  {
    title: "5. Hak Kamu",
    body: "Kamu dapat meminta akses, perbaikan, atau penghapusan data pribadimu melalui Pusat Bantuan. Beberapa data transaksi tetap disimpan untuk keperluan audit sesuai ketentuan.",
  },
  {
    title: "6. Cookie & Penyimpanan Lokal",
    body: "Aplikasi menyimpan token sesi di perangkat untuk menjaga kamu tetap masuk. Menghapusnya akan mengeluarkan kamu dari sesi.",
  },
  {
    title: "7. Kontak",
    body: "Pertanyaan terkait privasi dapat disampaikan melalui Pusat Bantuan di aplikasi atau email support@polksgroup.com.",
  },
];

export default function PrivacyPage() {
  const router = useRouter();
  return (
    <main className="flex min-h-screen justify-center bg-white font-body text-polks-text md:bg-transparent">
      <div className="polks-phone min-h-screen w-full bg-white">
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-polks-surface bg-white px-5 py-4">
          <button type="button" onClick={() => router.back()} aria-label="Kembali" className="text-polks-text">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-base font-bold text-polks-text">Kebijakan Privasi</h1>
        </div>

        <div className="px-5 pb-12 pt-5">
          <p className="mb-5 text-xs text-polks-muted">Terakhir diperbarui: Juni 2026</p>
          <div className="flex flex-col gap-5">
            {sections.map((s) => (
              <section key={s.title}>
                <h2 className="mb-1.5 text-[14px] font-bold text-polks-text">{s.title}</h2>
                <p className="text-[13px] leading-relaxed text-polks-muted">{s.body}</p>
              </section>
            ))}
          </div>
          <p className="mt-8 text-[11px] leading-relaxed text-[#C0CBD3]">
            Dokumen ini contoh untuk keperluan aplikasi dan sebaiknya ditinjau oleh tim legal POLKS GROUP sebelum produksi.
          </p>
        </div>
      </div>
    </main>
  );
}
