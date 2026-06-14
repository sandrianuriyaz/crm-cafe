"use client";

import Link from "next/link";
import Image from "next/image";
import { WalletCard } from "@/components/customer/wallet-card";
import { CustomerShell } from "@/components/layout/customer-shell";
import { Icon } from "@/components/ui/icon";
import { useAuth } from "@/lib/auth";
import { member, promos, rewards } from "@/lib/loyalty/mock-data";

const quickActions = [
  { href: "/member-card", icon: "card_membership", label: "Member Card", color: "text-polks-brand", bg: "bg-polks-surface" },
  { href: "/rewards", icon: "redeem", label: "Reward", color: "text-polks-point", bg: "bg-polks-point-soft" },
  { href: "/rewards", icon: "stars", label: "Promo", color: "text-polks-smile", bg: "bg-polks-smile-soft" },
  { href: "/history", icon: "history", label: "Riwayat", color: "text-polks-brand", bg: "bg-polks-surface" },
] as const;

export default function MemberDashboardPage() {
  const { user } = useAuth();

  const name = user?.name || member.name;
  const points = user?.pointBalance ?? member.points;
  const memberId = user?.memberCode || member.memberId;
  const tier = member.tier;

  return (
    <CustomerShell
      showHeader={false}
      topbarRight={null}
    >
      <section className="bg-polks-brand px-5 pb-7 pt-4 text-white">
        <div className="mb-5 flex items-center justify-between">
          <Image
            src="/polks/logo.png"
            alt="POLKS"
            width={96}
            height={44}
            className="h-9 w-auto"
            priority
          />
          <button
            type="button"
            aria-label="Notifikasi"
            className="relative text-white/60"
          >
            <Icon name="notifications" className="size-5" />
            <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full border border-polks-brand bg-polks-smile" />
          </button>
        </div>

        <div className="mb-5">
          <p className="text-xs text-white/45">Selamat datang,</p>
          <h1 className="text-xl font-bold text-white">{name}</h1>
        </div>

        <WalletCard points={points} tier={tier} memberId={memberId} />
      </section>

      <div className="bg-polks-brand leading-none">
        <svg viewBox="0 0 390 28" preserveAspectRatio="none" className="polks-wave">
          <path d="M0,0 Q195,28 390,0 L390,28 L0,28 Z" fill="#F6F8FA" />
        </svg>
      </div>

      <div className="flex flex-col gap-6 bg-polks-bg px-5 pb-28">
        <section className="grid grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-2"
            >
              <div className={`flex size-14 items-center justify-center rounded-2xl ${action.bg}`}>
                <Icon name={action.icon} className={`size-5 ${action.color}`} />
              </div>
              <span className="text-center text-[10px] font-semibold text-polks-muted">
                {action.label}
              </span>
            </Link>
          ))}
        </section>

        <section id="promo" className="scroll-mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-polks-text">Promo Hari Ini</h2>
            <Link href="/rewards" className="flex items-center text-xs font-semibold text-polks-smile">
              Lihat Semua <Icon name="chevron_right" className="size-3" />
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {promos.map((promo) => (
              <Link
                key={promo.id}
                href="/rewards"
                className="rounded-2xl border border-polks-border bg-white p-4"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h3 className="text-[13px] font-bold text-polks-text">{promo.title}</h3>
                  <span className="rounded-full bg-polks-smile-soft px-2.5 py-1 text-[10px] font-bold text-polks-smile">
                    Aktif
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-polks-muted">
                  <span className="flex items-center gap-1">
                    <Icon name="location_on" className="size-3" />
                    All Outlets
                  </span>
                  <span>{promo.endsAt}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-polks-text">Rekomendasi Reward</h2>
            <Link href="/rewards" className="flex items-center text-xs font-semibold text-polks-smile">
              Lihat Semua <Icon name="chevron_right" className="size-3" />
            </Link>
          </div>
          <div className="flex gap-3">
            {rewards.slice(0, 2).map((reward) => (
              <Link
                href="/rewards"
                key={reward.id}
                className="flex-1 rounded-2xl border border-polks-border bg-white p-4"
              >
                <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-polks-point-soft">
                  <Icon name="redeem" className="size-5 text-polks-point" />
                </div>
                <h3 className="mb-2 text-[13px] font-bold text-polks-text">
                  {reward.title}
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-polks-point-soft px-2.5 py-1 text-xs font-bold text-amber-800">
                  <Icon name="stars" fill className="size-3 text-polks-point" />
                  {reward.points} pts
                </span>
                <p className="mt-2 text-[10px] text-polks-muted">
                  {reward.availability}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </CustomerShell>
  );
}
