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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background font-body text-on-background">
      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] h-[50%] w-[50%] rounded-full bg-primary-fixed opacity-30 blur-[120px]" />
        <div className="absolute bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-secondary-fixed opacity-40 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-[420px] px-md md:px-0">
        {/* Back link */}
        <div className="mb-lg flex items-center">
          <button
            type="button"
            onClick={() => router.back()}
            className="group flex items-center text-on-surface-variant transition-colors hover:text-primary"
          >
            <Icon
              name="arrow_back"
              className="mr-sm size-5 transition-transform group-hover:-translate-x-1"
            />
            <span className="font-body-semibold text-body-semibold">Back</span>
          </button>
        </div>

        {/* Main Card */}
        <div className="flex flex-col overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm">
          {/* Header */}
          <div className="relative flex flex-col items-center border-b border-outline-variant/20 px-lg pt-lg pb-md text-center">
            <div className="absolute top-0 left-0 h-1 w-full bg-primary" />
            <div className="mb-md flex size-16 items-center justify-center rounded-xl border border-outline-variant/30 bg-surface-container-low shadow-sm">
              <Icon name="verified_user" fill className="size-8 text-primary" />
            </div>
            <h1 className="mb-xs font-app-name text-app-name tracking-tight text-primary">
              Verify Your Account
            </h1>
            <p className="font-caption text-caption text-on-surface-variant">
              Enter the code sent to your phone.
            </p>
          </div>

          {/* Form */}
          <div className="p-lg">
            <form onSubmit={onSubmit} className="flex flex-col gap-lg">
              <div className="grid grid-cols-6 gap-sm">
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
                      "ds-input h-14 min-w-0 rounded-lg border border-outline-variant/50 bg-surface-container-lowest text-center font-card-title text-card-title font-bold text-on-surface outline-none transition-all",
                      value && "border-primary",
                    )}
                  />
                ))}
              </div>

              <div className="text-center">
                <button
                  type="button"
                  className="font-body-semibold text-body-semibold text-primary transition-colors hover:text-primary-fixed-dim"
                >
                  Resend OTP
                </button>
                <p className="mt-xs font-caption text-caption text-on-surface-variant">
                  Wait 0:59
                </p>
              </div>

              <Button type="submit" disabled={!filled} className="w-full">
                Verify
                <Icon name="check_circle" />
              </Button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-xl flex items-center justify-center gap-md font-caption text-caption text-outline">
          <Link href="/login" className="transition-colors hover:text-on-surface-variant">
            Back to Login
          </Link>
        </div>
      </div>
    </main>
  );
}
