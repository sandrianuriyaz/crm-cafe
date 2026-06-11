"use client";

import Link from "next/link";
import { PromoCard } from "@/components/customer/promo-card";
import { WalletCard } from "@/components/customer/wallet-card";
import { CustomerShell } from "@/components/layout/customer-shell";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useAuth } from "@/lib/auth";
import { member, promos } from "@/lib/loyalty/mock-data";

export default function MemberDashboardPage() {
  const { user } = useAuth();

  const name = user?.name || member.name;
  const points = user?.pointBalance ?? member.points;
  const memberId = user?.memberCode || member.memberId;
  const tier = member.tier;

  const initial = (name || "?").charAt(0).toUpperCase();

  return (
    <CustomerShell
      maxWidth="max-w-3xl"
      topbarRight={
        <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-body-semibold text-body-semibold">
          {initial}
        </div>
      }
      drawerFooter={
        <Link
          href="/profile"
          className="flex items-center gap-3 px-2 py-1 rounded-lg hover:bg-on-secondary-fixed-variant/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-body-semibold text-body-semibold shrink-0">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="font-body-semibold text-body-semibold text-primary-fixed truncate">
              {name}
            </p>
            <p className="font-caption text-caption text-secondary-fixed-dim">
              View profile
            </p>
          </div>
        </Link>
      }
    >
      <div className="flex flex-col gap-xl">
        {/* Greeting */}
        <div>
          <h2 className="font-page-title text-page-title text-on-background">
            Hi, {name}
          </h2>
          <p className="font-body text-body text-on-surface-variant">
            Welcome back to your POLKS account.
          </p>
        </div>

        {/* Wallet + Quick Actions */}
        <section className="flex flex-col gap-md">
          <WalletCard points={points} tier={tier} memberId={memberId} />

          <div className="grid grid-cols-2 gap-4">
            <Button
              asChild
              className="bg-primary-container text-on-primary-container py-3 px-4 rounded-xl hover:bg-primary hover:text-white shadow-sm"
            >
              <Link href="/member-card">
                <Icon name="credit_card" className="size-5" />
                View Card
              </Link>
            </Button>
            <Button
              asChild
              className="bg-surface-container text-on-surface py-3 px-4 rounded-xl hover:bg-surface-container-high border border-outline-variant shadow-sm"
            >
              <Link href="/history">
                <Icon name="history" className="size-5" />
                History
              </Link>
            </Button>
          </div>
        </section>

        {/* Today's Promo */}
        <section className="flex flex-col gap-md">
          <div className="flex justify-between items-center">
            <h3 className="font-section-title text-section-title text-on-background">
              Today&apos;s Promo
            </h3>
            <Link
              href="/rewards"
              className="font-body-semibold text-body-semibold text-primary hover:underline"
            >
              See all
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {promos.map((promo) => (
              <PromoCard
                key={promo.id}
                title={promo.title}
                description={promo.description}
                badge={promo.label}
              />
            ))}
          </div>
        </section>
      </div>
    </CustomerShell>
  );
}
