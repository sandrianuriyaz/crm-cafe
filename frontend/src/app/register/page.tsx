import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Smartphone } from "lucide-react";

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const perks = [
  "Kumpulkan poin resmi dari setiap transaksi",
  "Tukar poin dengan reward & voucher",
  "Berlaku di semua outlet POLKS",
];

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen justify-center bg-white font-body text-polks-text">
      <div className="polks-phone flex min-h-screen w-full flex-col bg-white">
        {/* Back */}
        <div className="px-5 pt-5">
          <Link href="/" aria-label="Kembali" className="inline-flex p-1">
            <ArrowLeft size={22} color="#17212A" />
          </Link>
        </div>

        {/* Logo mark */}
        <div className="flex flex-col items-center px-8 pb-6 pt-8">
          <div className="flex size-[120px] items-center justify-center rounded-[32px] bg-polks-brand shadow-[0_12px_40px_rgba(37,52,63,0.2)]">
            <Image
              src="/polks/icon.png"
              alt="POLKS"
              width={64}
              height={64}
              className="size-16 object-contain"
              priority
            />
          </div>
        </div>

        {/* Heading */}
        <div className="mb-10 px-6">
          <h1 className="text-[28px] font-bold leading-tight tracking-[-0.01em] text-polks-text">
            Buat akun
            <br />
            POLKS gratis.
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#8A959D]">
            Daftar dalam hitungan detik dan mulai kumpulkan poin dari setiap kunjungan.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4 px-6">
          <Link
            href="/verify-account"
            className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] text-[15px] font-bold text-white shadow-[0_4px_16px_rgba(37,211,102,0.35)]"
          >
            <WhatsAppIcon />
            Daftar dengan WhatsApp
          </Link>

          <Link
            href="/verify-account"
            className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl border-[1.5px] border-polks-border bg-polks-bg text-[15px] font-semibold text-polks-text"
          >
            <Smartphone size={18} color="#66737D" />
            Daftar dengan SMS
          </Link>

          {/* Perks */}
          <div className="mt-1 flex flex-col gap-2 rounded-2xl border border-polks-surface bg-polks-bg px-4 py-3">
            {perks.map((t) => (
              <div key={t} className="flex items-center gap-2">
                <span className="size-[5px] shrink-0 rounded-full bg-polks-brand" />
                <span className="text-xs text-polks-muted">{t}</span>
              </div>
            ))}
          </div>

          {/* Login link */}
          <div className="mt-1 flex items-center justify-center gap-1.5">
            <span className="text-[13px] text-[#8A959D]">Sudah punya akun?</span>
            <Link href="/login" className="text-[13px] font-semibold text-polks-brand">
              Masuk
            </Link>
          </div>
        </div>

        {/* Terms */}
        <div className="mt-auto px-6 pb-8 pt-6">
          <p className="text-center text-[11px] leading-relaxed text-[#C0CBD3]">
            Dengan mendaftar, kamu menyetujui{" "}
            <span className="font-semibold text-polks-muted">Syarat &amp; Ketentuan</span> dan{" "}
            <span className="font-semibold text-polks-muted">Kebijakan Privasi</span> POLKS.
          </p>
        </div>
      </div>
    </main>
  );
}
