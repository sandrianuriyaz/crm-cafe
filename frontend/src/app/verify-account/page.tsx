"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Smartphone, Clock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const OTP_LENGTH = 6;
const PHONE = "+62 812 **** 7890";

export default function VerifyAccountPage() {
  const router = useRouter();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [countdown, setCountdown] = useState(0);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const complete = otp.every((d) => d !== "");

  function handleChange(i: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setOtp((cur) => {
      const next = [...cur];
      next[i] = digit;
      return next;
    });
    if (digit && i < OTP_LENGTH - 1) inputsRef.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[i] && i > 0) inputsRef.current[i - 1]?.focus();
  }

  function handleResend() {
    setOtp(Array(OTP_LENGTH).fill(""));
    setCountdown(30);
    const t = setInterval(() => {
      setCountdown((p) => {
        if (p <= 1) {
          clearInterval(t);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
  }

  function onVerify() {
    if (!complete) return;
    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-screen justify-center bg-white font-body text-polks-text">
      <div className="polks-phone min-h-screen w-full bg-white">
        {/* Back */}
        <div className="px-5 pb-3 pt-5">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="flex items-center gap-1.5 text-[13px] font-medium text-polks-muted"
          >
            <ArrowLeft size={16} />
            Kembali
          </button>
        </div>

        {/* Header */}
        <div className="px-5 pb-8">
          <div className="flex justify-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-polks-brand">
              <Image src="/polks/icon.png" alt="POLKS" width={32} height={32} className="size-8 object-contain" />
            </div>
          </div>
          <div className="mt-6">
            <h1 className="text-[26px] font-bold leading-tight tracking-[-0.02em] text-polks-text">
              Verifikasi Akun
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-polks-muted">
              Kami mengirim kode 6 digit ke
            </p>
            <div className="mt-1 flex items-center gap-2">
              <Smartphone size={14} color="#25343F" />
              <span className="text-sm font-semibold text-polks-text">{PHONE}</span>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="mx-5 flex flex-col gap-5 rounded-2xl border border-polks-border bg-white p-5 shadow-[0_2px_16px_rgba(37,52,63,0.06)]">
          <div>
            <label className="mb-3 block text-[13px] font-semibold text-polks-text">
              Masukkan Kode OTP
            </label>
            <div className="flex items-center justify-between gap-2">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputsRef.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  aria-label={`Digit OTP ${i + 1}`}
                  className={cn(
                    "h-14 w-12 rounded-xl text-center text-[22px] font-bold text-polks-text outline-none transition-colors",
                    digit
                      ? "border-2 border-polks-brand bg-polks-bg"
                      : "border-[1.5px] border-polks-border bg-white focus:border-polks-brand",
                  )}
                />
              ))}
            </div>
          </div>

          {/* Expiry note */}
          <div className="flex items-start gap-3 rounded-xl border border-[rgba(246,184,75,0.4)] bg-polks-point-soft px-4 py-3">
            <Clock size={15} color="#92400E" className="mt-0.5 shrink-0" />
            <p className="text-xs leading-relaxed text-[#92400E]">
              Kode ini berlaku <strong>5 menit</strong>. Jangan bagikan ke siapa pun.
            </p>
          </div>

          <button
            type="button"
            disabled={!complete}
            onClick={onVerify}
            className="flex h-[50px] w-full items-center justify-center rounded-[14px] bg-polks-brand text-sm font-bold text-white disabled:opacity-50"
          >
            Verifikasi &amp; Lanjut
          </button>

          {/* Resend */}
          <div className="flex items-center justify-center gap-1">
            <span className="text-[13px] text-polks-muted">Tidak menerima kode?</span>
            {countdown > 0 ? (
              <span className="text-[13px] text-[#8A959D]">Kirim ulang {countdown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="text-[13px] font-semibold text-polks-brand"
              >
                Kirim ulang OTP
              </button>
            )}
          </div>
        </div>

        {/* Security note */}
        <div className="mt-4 px-5">
          <div className="flex items-start gap-3 rounded-xl bg-polks-surface px-4 py-3">
            <ShieldCheck size={15} color="#25343F" className="mt-0.5 shrink-0" />
            <p className="text-[11px] leading-relaxed text-polks-muted">
              POLKS tidak pernah meminta OTP via telepon, SMS, atau chat. Jaga kerahasiaannya.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
