"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const OTP_LENGTH = 6;

export default function VerifyAccountPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(Array<string>(OTP_LENGTH).fill(""));
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const filled = otp.every(Boolean);

  function updateOtp(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setOtp((current) => {
      const next = [...current];
      next[index] = digit;
      return next;
    });
    if (digit && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function onKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!filled) return;
    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-screen justify-center bg-polks-bg font-body text-polks-text">
      <div className="polks-phone min-h-screen w-full bg-polks-bg px-5 py-6">
        <div className="mb-5 flex items-center">
          <button
            type="button"
            onClick={() => router.back()}
            className="group flex items-center text-sm font-semibold text-polks-muted transition-colors hover:text-polks-brand"
          >
            <Icon
              name="arrow_back"
              className="mr-2 size-5 transition-transform group-hover:-translate-x-1"
            />
            Kembali
          </button>
        </div>

        <div className="flex flex-col overflow-hidden rounded-[24px] border border-polks-border bg-white shadow-sm">
          <div className="relative flex flex-col items-center border-b border-polks-border px-5 pb-5 pt-6 text-center">
            <div className="absolute left-0 top-0 h-1 w-full bg-polks-smile" />
            <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-polks-surface">
              <Icon name="verified_user" fill className="size-8 text-polks-brand" />
            </div>
            <h1 className="mb-1 text-xl font-black text-polks-text">
              Verifikasi Akun
            </h1>
            <p className="text-xs text-polks-muted">
              Masukkan kode OTP yang dikirim ke nomor kamu.
            </p>
          </div>

          <div className="p-5">
            <form onSubmit={onSubmit} className="flex flex-col gap-lg">
              <div className="grid grid-cols-6 gap-2">
                {otp.map((value, index) => (
                  <input
                    key={index}
                    ref={(node) => {
                      inputsRef.current[index] = node;
                    }}
                    value={value}
                    onChange={(e) => updateOtp(index, e.target.value)}
                    onKeyDown={(e) => onKeyDown(index, e)}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    aria-label={`Digit OTP ${index + 1}`}
                    className={cn(
                      "ds-input h-14 min-w-0 rounded-xl border border-polks-border bg-white text-center text-base font-bold text-polks-text outline-none transition-all",
                      value && "border-polks-smile",
                    )}
                  />
                ))}
              </div>

              <div className="text-center">
                <button
                  type="button"
                  className="text-sm font-semibold text-polks-smile"
                >
                  Resend OTP
                </button>
                <p className="mt-1 text-xs text-polks-muted">
                  Wait 0:59
                </p>
              </div>

              <Button type="submit" disabled={!filled} className="w-full bg-polks-smile text-white hover:bg-polks-smile/90">
                Verifikasi
                <Icon name="check_circle" />
              </Button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-center text-xs font-semibold text-polks-muted">
          <Link href="/login" className="transition-colors hover:text-polks-brand">
            Kembali ke Login
          </Link>
        </div>
      </div>
    </main>
  );
}
