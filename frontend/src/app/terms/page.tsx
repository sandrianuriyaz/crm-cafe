"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const sections = [
  {
    title: "1. Penerimaan Ketentuan",
    body: "Dengan mendaftar dan menggunakan aplikasi POLKS, kamu setuju untuk terikat pada Syarat & Ketentuan ini serta Kebijakan Privasi yang berlaku. Jika tidak setuju, mohon untuk tidak menggunakan layanan.",
  },
  {
    title: "2. Keanggotaan & Akun",
    body: "Keanggotaan bersifat pribadi dan tidak dapat dipindahtangankan. Kamu bertanggung jawab menjaga kerahasiaan akun. Satu nomor/akun berlaku di seluruh outlet POLKS GROUP.",
  },
  {
    title: "3. Poin Loyalti",
    body: "Poin diperoleh dari transaksi yang tercatat di kasir/POS setelah sinkronisasi. POLKS berhak menyesuaikan jumlah poin bila terjadi kesalahan sistem, transaksi dibatalkan, atau indikasi kecurangan.",
  },
  {
    title: "4. Penukaran Reward & Voucher",
    body: "Poin dapat ditukar dengan reward atau voucher selama saldo mencukupi dan stok tersedia. Penukaran bersifat final dan tidak dapat dibatalkan. Voucher tidak dapat diuangkan dan berlaku sesuai masa berlakunya.",
  },
  {
    title: "5. Larangan",
    body: "Dilarang menyalahgunakan layanan, memanipulasi poin, atau menggunakan akun orang lain tanpa izin. Pelanggaran dapat berakibat pembekuan akun dan penghapusan poin.",
  },
  {
    title: "6. Perubahan Layanan",
    body: "POLKS dapat mengubah, menambah, atau menghentikan fitur, aturan poin, serta promo sewaktu-waktu dengan pemberitahuan yang wajar melalui aplikasi.",
  },
  {
    title: "7. Kontak",
    body: "Pertanyaan terkait ketentuan ini dapat disampaikan melalui Pusat Bantuan di aplikasi atau email support@polksgroup.com.",
  },
];

export default function TermsPage() {
  const router = useRouter();
  return (
    <main className="flex min-h-screen justify-center bg-white font-body text-polks-text md:bg-transparent">
      <div className="polks-phone min-h-screen w-full bg-white">
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-polks-surface bg-white px-5 py-4">
          <button type="button" onClick={() => router.back()} aria-label="Kembali" className="text-polks-text">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-base font-bold text-polks-text">Syarat &amp; Ketentuan</h1>
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
