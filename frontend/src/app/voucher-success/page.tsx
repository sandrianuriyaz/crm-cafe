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
    <main className="flex min-h-screen justify-center bg-polks-bg font-body text-polks-text">
      <div className="polks-phone flex min-h-screen w-full items-center bg-polks-bg px-5">
        <div className="flex w-full flex-col overflow-hidden rounded-[24px] border border-polks-border bg-white p-5 text-center shadow-sm">
          <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-success-container text-on-success-container">
            <Icon name="verified" fill className="size-11" />
          </span>

          <h1 className="mt-4 text-[22px] font-black text-polks-text">
            Voucher Siap
          </h1>
          <p className="mt-2 text-sm leading-6 text-polks-muted">
            Tunjukkan kode voucher ini ke kasir di outlet POLKS yang berlaku.
          </p>

          <div className="mt-5 rounded-2xl border border-dashed border-polks-border bg-polks-surface p-5">
            <p className="text-[10px] font-bold uppercase text-polks-smile">
              Reward Voucher
            </p>
            <p className="mt-2 text-xl font-bold text-polks-text">
              {voucher?.reward.name ?? "—"}
            </p>
            <p className="mt-2 text-sm text-polks-muted">
              {voucher?.expiredAt
                ? `Valid until ${formatDate(voucher.expiredAt)}`
                : "Your voucher is ready to use"}
            </p>
          </div>

          <div className="mt-4 rounded-2xl bg-polks-brand p-4 text-white">
            <p className="text-[10px] font-bold uppercase text-white/55">
              Voucher Code
            </p>
            <p className="mt-2 font-mono text-base font-bold tracking-[0.18em]">
              {voucher?.code ?? "—"}
            </p>
          </div>

          <Button asChild className="mt-5 w-full bg-polks-smile text-white hover:bg-polks-smile/90">
            <Link href="/rewards">
              <Icon name="arrow_back" />
              Kembali ke Reward
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
