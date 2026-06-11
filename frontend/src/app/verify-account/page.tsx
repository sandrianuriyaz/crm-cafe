"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-ui";
import { Button } from "@/components/ui/button";
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
    <AuthShell className="flex min-h-[calc(100dvh-76px)] flex-col pt-24">
      <form onSubmit={onSubmit} className="flex min-h-[calc(100dvh-176px)] flex-col">
        <section className="text-center">
          <h1 className="text-[31px] font-bold leading-tight">Verify Your Account</h1>
          <p className="mt-5 text-xl leading-7 text-polks-cocoa">
            Enter the code sent to your phone.
          </p>
        </section>

        <div className="mt-10 grid grid-cols-6 gap-3">
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
                "h-[62px] min-w-0 border border-[#6f7680] bg-white text-center text-3xl font-bold outline-none transition-colors focus:border-polks-caramel focus:ring-2 focus:ring-polks-caramel/15",
                value && "border-polks-caramel"
              )}
            />
          ))}
        </div>

        <div className="mt-9 text-center">
          <button type="button" className="text-xl font-bold text-polks-caramel">
            Resend OTP
          </button>
          <p className="mt-5 text-lg text-polks-cocoa/80">Wait 0:59</p>
        </div>

        <Button
          type="submit"
          disabled={!filled}
          className="mt-auto h-[58px] w-full rounded-[10px] bg-polks-espresso text-lg font-bold text-white hover:bg-polks-coffee disabled:text-[#a98d85] disabled:opacity-100"
        >
          Verify
        </Button>
      </form>
    </AuthShell>
  );
}
