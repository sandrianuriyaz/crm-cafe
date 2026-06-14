/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CustomerShell } from "@/components/layout/customer-shell";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { member } from "@/lib/loyalty/mock-data";

export default function MemberCardPage() {
  const { user } = useAuth();

  const name = user?.name ?? member.name;
  const memberId = user?.memberCode ?? member.memberId;
  const points = user?.pointBalance ?? member.points;

  // QR asli dari backend (berisi memberCode — id milik CRM, dipindai POS).
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(true);

  const loadQr = useCallback(() => {
    setLoadingQr(true);
    api<{ image_data_url: string }>("/member/qr")
      .then((res) => setQrImage(res.image_data_url))
      .catch(() => setQrImage(null))
      .finally(() => setLoadingQr(false));
  }, []);

  useEffect(() => {
    loadQr();
  }, [loadQr]);

  return (
    <CustomerShell>
      <div className="flex flex-col items-center px-5 pb-28 pt-5">
        <div className="mb-5 w-full">
          <h1 className="text-[22px] font-black text-polks-text">Member Card</h1>
          <p className="mt-1 text-sm text-polks-muted">
            Tunjukkan QR ini ke kasir
          </p>
        </div>

        {/* Digital Card */}
        <div className="relative mb-5 flex w-full flex-col items-center overflow-hidden rounded-[24px] bg-polks-brand p-5 text-white shadow-[0_16px_42px_rgba(37,52,63,0.28)]">
          <div className="absolute left-0 top-0 h-2 w-full bg-polks-point" />
          <div className="absolute -right-10 -top-10 size-32 rounded-full bg-white/5" />

          <div className="mb-8 flex w-full items-start justify-between">
            <div>
              <h2 className="text-base font-bold text-white">
                {name}
              </h2>
              <p className="text-xs text-white/55">
                {member.tier}
              </p>
            </div>
            <div className="text-right">
              <span className="text-base font-bold text-polks-point">
                {points.toLocaleString("id-ID")}
              </span>
              <span className="ml-1 text-xs text-white/55">
                pts
              </span>
            </div>
          </div>

          <div className="relative mb-4 flex aspect-square w-full max-w-[250px] items-center justify-center overflow-hidden rounded-2xl bg-white">
            {loadingQr ? (
              <span className="text-xs font-medium text-polks-muted">
                Memuat QR…
              </span>
            ) : qrImage ? (
              <img
                src={qrImage}
                alt={`QR member ${memberId}`}
                className="size-full object-contain p-3"
              />
            ) : (
              <Icon name="qr_code_2" className="size-40 text-polks-text" />
            )}
            {qrImage ? (
              <>
                <div
                  className="absolute left-0 h-1 w-full bg-polks-smile/60 blur-sm"
                  style={{ animation: "membercard-scan 2s ease-in-out infinite" }}
                />
                <style>{`@keyframes membercard-scan {
                  0% { transform: translateY(0); }
                  50% { transform: translateY(240px); }
                  100% { transform: translateY(0); }
                }`}</style>
              </>
            ) : null}
          </div>

          <p className="mb-6 text-center text-sm font-semibold text-white/65">
            Scan QR untuk transaksi POS
          </p>

          <div className="text-center">
            <p className="mb-1 text-xs text-white/45">
              Member ID
            </p>
            <p className="text-sm font-semibold tracking-widest text-white">
              {memberId}
            </p>
          </div>
        </div>

        <div className="flex w-full gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={loadQr}
            disabled={loadingQr}
          >
            <Icon name="refresh" className="size-5" />
            {loadingQr ? "Memuat…" : "Refresh QR"}
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/history">
              <Icon name="history" className="size-5" />
              History
            </Link>
          </Button>
        </div>

        <p className="flex items-center justify-center gap-2 pt-5 text-center text-xs font-medium text-polks-muted">
          <Icon name="verified" className="size-4 text-polks-smile" />
          {member.validAt}
        </p>
      </div>
    </CustomerShell>
  );
}
