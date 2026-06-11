"use client";

import { useState } from "react";
import Link from "next/link";
import { CustomerShell } from "@/components/layout/customer-shell";
import { RewardCard } from "@/components/customer/reward-card";
import { Chip } from "@/components/ui/chip";
import { Icon } from "@/components/ui/icon";
import { member, rewards, vouchers, type RewardCategory } from "@/lib/loyalty/mock-data";

const categories: { value: RewardCategory; label: string }[] = [
  { value: "all", label: "All" },
  { value: "drinks", label: "Drinks" },
  { value: "pastry", label: "Pastry" },
  { value: "voucher", label: "Voucher" },
];

export default function RewardCatalogPage() {
  const [active, setActive] = useState<RewardCategory>("all");

  const showRewards = active === "all" || active === "drinks" || active === "pastry";
  const showVouchers = active === "all" || active === "voucher";

  const visibleRewards =
    active === "all" ? rewards : rewards.filter((r) => r.category === active);

  return (
    <CustomerShell>
      <div className="space-y-lg">
        {/* Header + Balance card */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md">
          <div>
            <h1 className="font-page-title text-page-title text-on-surface">
              Reward Catalog
            </h1>
            <p className="font-body text-body text-on-surface-variant mt-xs">
              Explore and redeem your points.
            </p>
          </div>

          <div className="bg-primary text-on-primary rounded-xl p-md shadow-sm border border-outline-variant/20 flex items-center gap-md min-w-[200px]">
            <div className="bg-primary-fixed text-on-primary-fixed p-sm rounded-full flex items-center justify-center">
              <Icon name="stars" className="size-5" />
            </div>
            <div>
              <div className="font-caption text-caption text-primary-fixed-dim">
                Available Balance
              </div>
              <div className="font-card-title text-card-title font-bold">
                {member.points.toLocaleString("id-ID")} pts
              </div>
            </div>
          </div>
        </div>

        {/* Category chips */}
        <div className="flex gap-sm overflow-x-auto pb-xs">
          {categories.map((c) => (
            <Chip
              key={c.value}
              active={active === c.value}
              onClick={() => setActive(c.value)}
            >
              {c.label}
            </Chip>
          ))}
        </div>

        {/* Rewards grid */}
        <div className="grid grid-cols-2 gap-lg">
          {showVouchers &&
            vouchers.map((v) => (
              <Link key={v.id} href="/voucher-success" className="block">
                <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden group hover:border-primary transition-colors flex flex-col h-full">
                  <div className="h-40 bg-secondary-container flex items-center justify-center relative">
                    <Icon
                      name="local_activity"
                      className="size-16 text-on-secondary-container opacity-50"
                    />
                    <div className="absolute top-sm right-sm bg-surface-container-lowest text-primary font-label-xs text-label-xs px-sm py-xs rounded-full shadow-sm flex items-center gap-xs">
                      <Icon name="stars" className="size-3.5" />
                      {v.points.toLocaleString("id-ID")} pts
                    </div>
                  </div>
                  <div className="p-md flex-1 flex flex-col justify-between">
                    <div>
                      <div className="font-caption text-caption text-primary mb-xs">
                        Voucher
                      </div>
                      <h3 className="font-card-title text-card-title text-on-surface">
                        {v.title} {v.value}
                      </h3>
                      <p className="font-body text-body text-on-surface-variant mt-xs">
                        {v.validUntil}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}

          {showRewards &&
            visibleRewards.map((reward) => (
              <Link key={reward.id} href="/voucher-success" className="block">
                <RewardCard
                  title={reward.title}
                  points={reward.points}
                  availability={reward.availability}
                  className="h-full"
                />
              </Link>
            ))}
        </div>
      </div>
    </CustomerShell>
  );
}
