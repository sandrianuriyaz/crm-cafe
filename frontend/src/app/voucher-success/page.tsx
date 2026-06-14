"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ShoppingBag, Copy, Check } from "lucide-react";
import { LAST_REDEEM_KEY, type RedeemResult } from "@/lib/loyalty/types";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function VoucherSuccessPage() {
  const [result, setResult] = useState<RedeemResult | null>(null);
  const [copied, setCopied] = useState(false);

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
  const code = voucher?.code ?? "—";

  function copyCode() {
    if (!voucher?.code) return;
    navigator.clipboard?.writeText(voucher.code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main className="flex min-h-screen justify-center bg-polks-bg font-body text-polks-text">
      <div className="polks-phone min-h-screen w-full bg-polks-bg">
        {/* Success header */}
        <div className="flex flex-col items-center bg-polks-brand px-5 pb-8 pt-10 text-center">
          <div className="mb-5 flex size-20 items-center justify-center rounded-full border-[2.5px] border-[rgba(56,161,105,0.35)] bg-[rgba(56,161,105,0.15)]">
            <div className="flex size-[60px] items-center justify-center rounded-full bg-polks-success">
              <CheckCircle2 size={30} color="#ffffff" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-[22px] font-bold tracking-[-0.02em] text-white">
            Voucher Berhasil Ditukar!
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-white/50">
            Voucher POLKS kamu sudah siap digunakan.
          </p>
          {result ? (
            <div className="mt-4 flex items-center gap-2 rounded-full border border-[rgba(56,161,105,0.3)] bg-[rgba(56,161,105,0.15)] px-4 py-2">
              <span className="text-xs font-semibold text-[#6EE7B7]">
                Sisa poin: {result.pointBalance.toLocaleString("id-ID")} pts
              </span>
            </div>
          ) : null}
        </div>

        {/* Wave */}
        <div className="bg-polks-brand leading-none">
          <svg viewBox="0 0 390 28" preserveAspectRatio="none" className="block h-7 w-full">
            <path d="M0,0 Q195,28 390,0 L390,28 L0,28 Z" fill="#F6F8FA" />
          </svg>
        </div>

        <div className="flex flex-col gap-4 bg-polks-bg px-5 pb-10">
          {/* Voucher ticket */}
          <div className="overflow-hidden rounded-2xl border border-polks-border bg-white">
            <div className="flex items-center justify-between px-5 pb-4 pt-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-polks-smile">
                  Reward Voucher
                </p>
                <p className="mt-1 text-lg font-bold text-polks-text">
                  {voucher?.reward.name ?? "—"}
                </p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-polks-point-soft">
                <ShoppingBag size={22} color="#F6B84B" />
              </div>
            </div>

            {/* Dashed divider */}
            <div className="relative">
              <div className="absolute -left-2 top-1/2 size-4 -translate-y-1/2 rounded-full bg-polks-bg" />
              <div className="absolute -right-2 top-1/2 size-4 -translate-y-1/2 rounded-full bg-polks-bg" />
              <div className="mx-5 border-t border-dashed border-polks-border" />
            </div>

            {/* Code */}
            <div className="px-5 pb-5 pt-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-polks-muted">
                Kode Voucher
              </p>
              <div className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-polks-bg px-4 py-3">
                <span className="font-mono text-base font-bold tracking-[0.18em] text-polks-text">
                  {code}
                </span>
                <button
                  type="button"
                  onClick={copyCode}
                  className="flex items-center gap-1.5 text-xs font-semibold text-polks-brand"
                >
                  {copied ? <Check size={15} color="#38A169" /> : <Copy size={15} />}
                  {copied ? "Disalin" : "Salin"}
                </button>
              </div>
              {voucher?.expiredAt ? (
                <p className="mt-2 text-[11px] text-polks-muted">
                  Berlaku hingga {formatDate(voucher.expiredAt)}
                </p>
              ) : null}
            </div>
          </div>

          {/* Notice */}
          <div className="flex items-center gap-3 rounded-2xl border border-[rgba(246,184,75,0.4)] bg-polks-point-soft px-4 py-3">
            <ShoppingBag size={15} color="#92400E" className="shrink-0" />
            <p className="text-xs font-semibold text-[#92400E]">
              Tunjukkan voucher ke kasir sebelum transaksi dimulai.
            </p>
          </div>

          {/* Actions */}
          <Link
            href="/history"
            className="flex h-[50px] w-full items-center justify-center rounded-[14px] bg-polks-brand text-sm font-bold text-white"
          >
            Lihat Riwayat Penukaran
          </Link>
          <Link
            href="/dashboard"
            className="flex h-[50px] w-full items-center justify-center rounded-[14px] border-[1.5px] border-polks-border bg-white text-sm font-semibold text-polks-brand"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </main>
  );
}
