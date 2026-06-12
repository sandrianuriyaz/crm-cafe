"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { LAST_REDEEM_KEY, type RedeemResult } from "@/lib/loyalty/types";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function VoucherSuccessPage() {
  const [result, setResult] = useState<RedeemResult | null>(null);

  useEffect(() => {
    const raw = window.sessionStorage.getItem(LAST_REDEEM_KEY);
    if (raw) {
      try {
        setResult(JSON.parse(raw) as RedeemResult);
      } catch {
        setResult(null);
      }
    }
  }, []);

  const voucher = result?.voucher;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background font-body text-on-background">
      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] h-[50%] w-[50%] rounded-full bg-primary-fixed opacity-30 blur-[120px]" />
        <div className="absolute bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-secondary-fixed opacity-40 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-[420px] px-md md:px-0">
        <div className="flex flex-col overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-lg text-center shadow-sm">
          {/* Success icon */}
          <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-success-container text-on-success-container">
            <Icon name="verified" fill className="size-11" />
          </span>

          <h1 className="mt-md font-page-title text-page-title text-on-surface">
            Voucher Ready
          </h1>
          <p className="mt-xs font-body text-body text-on-surface-variant">
            Show this voucher code to cashier. It can be used at eligible POLKS GROUP
            outlets.
          </p>

          {/* Voucher value */}
          <div className="mt-lg rounded-2xl border border-dashed border-outline-variant bg-surface-container-low p-lg">
            <p className="font-label-xs text-label-xs uppercase tracking-widest text-primary">
              Reward Voucher
            </p>
            <p className="mt-xs font-page-title text-page-title font-bold text-on-surface">
              {voucher?.reward.name ?? "—"}
            </p>
            <p className="mt-xs font-body text-body text-on-surface-variant">
              {voucher?.expiredAt
                ? `Valid until ${formatDate(voucher.expiredAt)}`
                : "Your voucher is ready to use"}
            </p>
          </div>

          {/* Voucher code */}
          <div className="mt-md rounded-xl bg-primary p-md text-on-primary">
            <p className="font-label-xs text-label-xs uppercase tracking-widest text-primary-fixed-dim">
              Voucher Code
            </p>
            <p className="mt-xs font-mono text-card-title font-bold tracking-[0.18em]">
              {voucher?.code ?? "—"}
            </p>
          </div>

          <Button asChild className="mt-lg w-full">
            <Link href="/rewards">
              <Icon name="arrow_back" />
              Back to Rewards
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
