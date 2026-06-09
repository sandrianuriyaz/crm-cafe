import { Star } from "lucide-react";
import { TopAppBar } from "@/components/member/top-app-bar";
import { WalletCard } from "@/components/member/wallet-card";
import { QuickActions } from "@/components/member/quick-actions";
import { BottomNav } from "@/components/member/bottom-nav";
import { OfferThumbnail } from "@/components/member/offer-thumbnail";

// Mock data — replace with API once endpoints are ready.
const member = {
  name: "Sandria",
  tier: "Regular Member",
  points: 1250,
  memberId: "POLKS-8492-331",
};

const deals = [
  {
    id: "deal-1",
    title: "Diskon Kopi Susu 20%",
    validUntil: "Valid until 31 July 2026",
    status: "Active",
  },
];

const rewards = [
  {
    id: "reward-1",
    title: "Free Americano",
    points: 500,
    status: "Available",
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-dvh bg-background pb-40">
      <TopAppBar />

      <main className="flex flex-col gap-6 px-5 pt-6">
        {/* Greeting */}
        <section>
          <h1 className="mb-1 font-heading text-[26px] font-bold leading-8 tracking-tight text-foreground">
            Hi, {member.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Ready for your coffee break?
          </p>
        </section>

        <WalletCard
          tier={member.tier}
          points={member.points}
          memberId={member.memberId}
        />

        <QuickActions />

        {/* Today's Deals */}
        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Today&apos;s Deals
          </h2>
          {deals.map((deal) => (
            <article
              key={deal.id}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-[0px_4px_12px_rgba(43,23,18,0.05)]"
            >
              <OfferThumbnail />
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-heading text-base font-semibold text-foreground">
                    {deal.title}
                  </h3>
                  <span className="rounded-full bg-accent/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-accent">
                    {deal.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{deal.validUntil}</p>
                <button
                  type="button"
                  className="mt-1 w-max cursor-pointer text-left text-sm font-semibold text-secondary transition-opacity hover:opacity-80"
                >
                  View Details
                </button>
              </div>
            </article>
          ))}
        </section>

        {/* Recommended Reward */}
        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Recommended Reward
          </h2>
          {rewards.map((reward) => (
            <article
              key={reward.id}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-[0px_4px_12px_rgba(43,23,18,0.05)]"
            >
              <OfferThumbnail />
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-heading text-base font-semibold text-foreground">
                    {reward.title}
                  </h3>
                  <span className="rounded-full bg-accent/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-accent">
                    {reward.status}
                  </span>
                </div>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="size-3.5" aria-hidden="true" />
                  {reward.points.toLocaleString("id-ID")} points
                </p>
                <button
                  type="button"
                  className="mt-1 w-max cursor-pointer rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[0px_8px_20px_rgba(43,23,18,0.1)] transition-opacity hover:opacity-90"
                >
                  Redeem
                </button>
              </div>
            </article>
          ))}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
