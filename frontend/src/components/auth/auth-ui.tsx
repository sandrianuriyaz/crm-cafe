"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { InputHTMLAttributes, ReactNode } from "react";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  children: ReactNode;
  className?: string;
  showLogo?: boolean;
};

export function AuthShell({
  children,
  className,
  showLogo = false,
}: AuthShellProps) {
  return (
    <div className="min-h-dvh bg-[#ead9d2] text-foreground">
      <div className="mx-auto min-h-dvh w-full max-w-[430px] bg-polks-cream">
        <AuthTopBar />
        <main className={cn("px-5 pb-10", showLogo ? "pt-20" : "pt-16", className)}>
          {children}
        </main>
      </div>
    </div>
  );
}

export function AuthTopBar() {
  const router = useRouter();

  return (
    <header className="flex h-[76px] items-center px-5">
      <button
        type="button"
        aria-label="Kembali"
        onClick={() => router.back()}
        className="flex size-11 items-center justify-center text-polks-cocoa"
      >
        <ArrowLeft className="size-8" aria-hidden="true" />
      </button>
      <div className="flex-1 text-center text-[21px] font-semibold uppercase tracking-[0.03em]">
        POLKS GROUP
      </div>
      <div className="size-11" aria-hidden="true" />
    </header>
  );
}

export function BrandMark() {
  return (
    <div className="mx-auto size-[88px] rounded-full border border-polks-line bg-polks-espresso shadow-[0_8px_18px_rgba(49,24,17,0.13)]" />
  );
}

export function AuthHeading({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle: string;
  icon?: LucideIcon;
}) {
  return (
    <section className="text-center">
      {Icon ? (
        <div className="mx-auto mb-8 flex size-[88px] items-center justify-center rounded-[24px] bg-polks-blush text-black shadow-[inset_0_0_0_1px_rgba(58,28,19,0.06)]">
          <Icon className="size-10" aria-hidden="true" />
        </div>
      ) : null}
      <h1 className="text-[32px] font-bold leading-tight tracking-normal">{title}</h1>
      <p className="mt-3 text-lg leading-6 text-polks-cocoa">{subtitle}</p>
    </section>
  );
}

type AuthInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: LucideIcon;
  action?: ReactNode;
};

export function AuthInput({
  label,
  icon: Icon,
  action,
  className,
  ...props
}: AuthInputProps) {
  return (
    <label className="block">
      <span className="mb-3 flex items-center justify-between text-base text-polks-coffee">
        <span>{label}</span>
        {action}
      </span>
      <span className="flex h-[58px] items-center gap-4 rounded-[12px] border border-polks-line bg-polks-soft px-4 text-polks-cocoa focus-within:border-polks-caramel focus-within:ring-2 focus-within:ring-polks-caramel/10">
        <Icon className="size-6 shrink-0" aria-hidden="true" />
        <input
          className={cn(
            "min-w-0 flex-1 bg-transparent text-lg text-foreground outline-none placeholder:text-[#8b7a75]",
            className
          )}
          {...props}
        />
      </span>
    </label>
  );
}

export function AuthDivider() {
  return (
    <div className="flex items-center gap-5 text-sm uppercase text-polks-cocoa/70">
      <span className="h-px flex-1 bg-polks-line" />
      OR
      <span className="h-px flex-1 bg-polks-line" />
    </div>
  );
}

export function AuthTextLink({
  text,
  href,
  action,
}: {
  text: string;
  href: string;
  action: string;
}) {
  return (
    <p className="text-center text-lg text-polks-cocoa">
      {text}{" "}
      <Link href={href} className="font-bold text-polks-caramel">
        {action}
      </Link>
    </p>
  );
}
