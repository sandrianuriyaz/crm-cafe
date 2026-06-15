"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const SPLASH_KEY = "polks-splash-seen";

export function SplashGate({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<"in" | "hold" | "out" | "done">("done");

  useEffect(() => {
    if (window.sessionStorage.getItem(SPLASH_KEY)) return;

    setPhase("in");
    const t1 = window.setTimeout(() => setPhase("hold"), 120);
    const t2 = window.setTimeout(() => setPhase("out"), 1600);
    const t3 = window.setTimeout(() => {
      window.sessionStorage.setItem(SPLASH_KEY, "1");
      setPhase("done");
    }, 2100);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, []);

  const visible = phase !== "done";
  const opacity = phase === "hold" ? 1 : 0;
  const translateY = phase === "in" ? 16 : 0;

  return (
    <>
      {children}
      {visible ? (
        <div className="fixed inset-0 z-[9999] flex justify-center bg-[#dee3e7] font-body">
          <div className="polks-phone relative flex w-full flex-col items-center justify-center gap-6 bg-polks-brand">
            <div
              className="flex flex-col items-center gap-4 transition-all duration-500 ease-out"
              style={{
                opacity,
                transform: `translateY(${translateY}px)`,
              }}
            >
              <Image
                src="/polks/icon.png"
                alt="POLKS"
                width={64}
                height={64}
                priority
                className="size-16 object-contain brightness-0 invert"
              />
              <Image
                src="/polks/logo.png"
                alt="POLKS"
                width={120}
                height={55}
                priority
                className="h-6 w-auto object-contain opacity-90"
              />
            </div>

            <p
              className="text-[11px] uppercase tracking-[0.12em] text-white/35 transition-opacity duration-500"
              style={{ opacity: phase === "hold" ? 1 : 0 }}
            >
              Loyalty & Rewards
            </p>

            <div
              className="absolute bottom-12 flex gap-1.5 transition-opacity duration-300"
              style={{ opacity: phase === "hold" ? 1 : 0 }}
            >
              {[0, 1, 2].map((item) => (
                <span
                  key={item}
                  className={
                    item === 1
                      ? "size-1.5 rounded-full bg-white"
                      : "size-1.5 rounded-full bg-white/25"
                  }
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
