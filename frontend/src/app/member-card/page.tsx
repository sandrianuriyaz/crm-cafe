"use client";

import Link from "next/link";
import { CustomerShell } from "@/components/layout/customer-shell";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useAuth } from "@/lib/auth";
import { member } from "@/lib/loyalty/mock-data";

export default function MemberCardPage() {
  const { user } = useAuth();

  const name = user?.name ?? member.name;
  const memberId = user?.memberCode ?? member.memberId;
  const points = user?.pointBalance ?? member.points;

  return (
    <CustomerShell maxWidth="max-w-md">
      <div className="flex flex-col items-center">
        {/* Page heading */}
        <div className="w-full mb-lg">
          <h1 className="font-page-title text-page-title text-on-surface">
            Member Card
          </h1>
          <p className="font-body text-body text-on-surface-variant mt-xs">
            Show this QR to cashier
          </p>
        </div>

        {/* Digital Card */}
        <div className="w-full bg-deep-navy text-on-primary rounded-xl p-lg shadow-sm flex flex-col items-center mb-lg relative overflow-hidden">
          {/* Decorative accent */}
          <div className="absolute top-0 left-0 w-full h-2 bg-primary-fixed-dim" />

          <div className="w-full flex justify-between items-start mb-xl">
            <div>
              <h2 className="font-card-title text-card-title text-on-primary">
                {name}
              </h2>
              <p className="font-caption text-caption text-primary-fixed-dim">
                {member.tier}
              </p>
            </div>
            <div className="text-right">
              <span className="font-card-title text-card-title text-primary-fixed">
                {points.toLocaleString("id-ID")}
              </span>
              <span className="font-caption text-caption text-primary-fixed-dim ml-1">
                pts
              </span>
            </div>
          </div>

          {/* QR Code Area (placeholder block) */}
          <div className="w-full max-w-[240px] aspect-square bg-surface-container-lowest rounded-lg flex items-center justify-center mb-md relative overflow-hidden">
            <Icon name="qr_code_2" className="size-40 text-on-surface" />
            {/* Decorative scan-line overlay */}
            <div
              className="absolute left-0 w-full h-1 bg-primary/50 blur-sm"
              style={{ animation: "membercard-scan 2s ease-in-out infinite" }}
            />
            <style>{`@keyframes membercard-scan {
              0% { transform: translateY(0); }
              50% { transform: translateY(240px); }
              100% { transform: translateY(0); }
            }`}</style>
          </div>

          <p className="font-body-semibold text-body-semibold text-primary-fixed-dim mb-xl text-center">
            Show this QR to cashier
          </p>

          <div className="text-center">
            <p className="font-caption text-caption text-primary-fixed-dim mb-1">
              Member ID
            </p>
            <p className="font-body text-body text-on-primary tracking-widest">
              {memberId}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full flex gap-md">
          <Button variant="outline" className="flex-1">
            <Icon name="refresh" className="size-5" />
            Refresh QR
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/history">
              <Icon name="history" className="size-5" />
              History
            </Link>
          </Button>
        </div>

        <p className="flex items-center justify-center gap-2 pt-lg font-caption text-caption text-on-surface-variant">
          <Icon name="verified" className="size-4 text-primary" />
          {member.validAt}
        </p>
      </div>
    </CustomerShell>
  );
}
