import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import PhoneOtpActions from "@/components/auth/phone-otp-actions";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen justify-center bg-white font-body text-polks-text md:bg-transparent">
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
              className="size-16 object-contain brightness-0 invert"
              priority
            />
          </div>
        </div>

        {/* Heading */}
        <div className="mb-10 px-6">
          <h1 className="text-[28px] font-bold leading-tight tracking-[-0.01em] text-polks-text">
            Selamat datang
            <br />
            di POLKS.
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#8A959D]">
            Masuk untuk kumpulkan poin resmi dan tukar reward dari setiap kunjungan.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4 px-6">
          <PhoneOtpActions mode="login" />

          {/* Divider */}
          <div className="my-1 flex items-center gap-3">
            <div className="h-px flex-1 bg-polks-surface" />
            <span className="text-xs text-[#C0CBD3]">atau</span>
            <div className="h-px flex-1 bg-polks-surface" />
          </div>

          {/* Register link */}
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-[13px] text-[#8A959D]">Belum punya akun?</span>
            <Link href="/register" className="text-[13px] font-semibold text-polks-brand">
              Daftar sekarang
            </Link>
          </div>
        </div>

        {/* Terms */}
        <div className="mt-auto px-6 pb-8 pt-6">
          <p className="text-center text-[11px] leading-relaxed text-[#C0CBD3]">
            Dengan melanjutkan, kamu menyetujui{" "}
            <span className="font-semibold text-polks-muted">Syarat &amp; Ketentuan</span> dan{" "}
            <span className="font-semibold text-polks-muted">Kebijakan Privasi</span> POLKS.
          </p>
        </div>
      </div>
    </main>
  );
}
