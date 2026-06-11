import Link from "next/link";
import {
  BadgeCheck,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Coffee,
  CreditCard,
  Gift,
  History,
  MapPin,
  QrCode,
  ReceiptText,
  RefreshCw,
  Star,
  Store,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { member, type RewardCategory } from "@/lib/loyalty/mock-data";

export function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {action ? (
        <Link href="#" className="text-sm font-medium text-polks-caramel">
          {action}
        </Link>
      ) : null}
    </div>
  );
}

export function GuestHero() {
  return (
    <section className="rounded-[14px] border border-polks-line bg-polks-blush px-4 py-8 text-center shadow-[0_8px_18px_rgba(49,24,17,0.04)]">
      <h1 className="text-[26px] font-bold leading-tight">
        Collect points from every purchase.
      </h1>
      <p className="mx-auto mt-3 max-w-[280px] text-sm leading-5 text-polks-cocoa">
        Show your member QR to cashier and earn rewards.
      </p>
      <div className="mt-5 grid gap-2">
        <Button asChild className="h-12 rounded-[8px] bg-black text-white hover:bg-polks-espresso">
          <Link href="/login">Login</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-12 rounded-[8px] border-polks-line bg-transparent text-foreground hover:bg-white/50"
        >
          <Link href="/register">Register</Link>
        </Button>
      </div>
    </section>
  );
}

export function PromoImageCard() {
  return (
    <article className="overflow-hidden rounded-[8px] border border-polks-line bg-white shadow-[0_8px_18px_rgba(49,24,17,0.04)]">
      <div className="relative h-[126px] overflow-hidden bg-[radial-gradient(circle_at_62%_35%,#fff7ec_0_7%,#d8a46d_8%_13%,#402114_28%,#100a07_72%)]">
        <span className="absolute left-3 top-3 rounded-[4px] bg-polks-caramel px-2 py-1 text-xs font-bold uppercase text-white">
          Promo
        </span>
        <div className="absolute bottom-[-36px] left-[48%] h-36 w-24 -translate-x-1/2 rounded-t-[42px] bg-[linear-gradient(90deg,#fff8ef,#efe0cf,#fffaf4)] opacity-95 shadow-[0_0_28px_rgba(255,255,255,0.3)]" />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold">Diskon Kopi Susu 20%</h3>
        <p className="mt-1 text-sm text-polks-cocoa">
          Enjoy our signature Kopi Susu at a special price today.
        </p>
      </div>
    </article>
  );
}

export function RewardTeaser() {
  return (
    <Link
      href="/rewards"
      className="flex items-center gap-4 rounded-[8px] border border-polks-line bg-white p-4 shadow-[0_8px_18px_rgba(49,24,17,0.04)]"
    >
      <ProductVisual type="coffee" className="size-[66px] shrink-0 rounded-[6px]" />
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold">Free Americano</h3>
        <p className="text-sm text-polks-cocoa">Redeem with 500 Points</p>
      </div>
      <ChevronRight className="size-5 text-polks-caramel" aria-hidden="true" />
    </Link>
  );
}

export function HowItWorks() {
  const steps: Array<{ label: string; icon: LucideIcon }> = [
    { label: "Order at cashier", icon: Store },
    { label: "Show member QR", icon: QrCode },
    { label: "Points added", icon: Star },
    { label: "Redeem rewards", icon: Gift },
  ];

  return (
    <section className="rounded-[14px] border border-polks-line bg-polks-blush px-5 py-6 text-center">
      <h2 className="text-xl font-semibold">How it Works</h2>
      <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-7">
        {steps.map(({ label, icon: Icon }, index) => (
          <div key={label} className="flex flex-col items-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-[#ecd9d1] text-polks-caramel">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <span className="mt-4 rounded-full border border-polks-line bg-white px-2 text-xs">
              {index + 1}
            </span>
            <span className="mt-2 text-sm">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function LocationList({
  locations,
}: {
  locations: Array<{ id: string; name: string; address: string }>;
}) {
  return (
    <div className="divide-y divide-polks-line">
      {locations.map((location) => (
        <div key={location.id} className="flex items-center gap-4 py-4">
          <div className="min-w-0 flex-1">
            <h3 className="font-medium">{location.name}</h3>
            <p className="text-sm text-polks-cocoa">{location.address}</p>
          </div>
          <MapPin className="size-6 shrink-0 text-polks-cocoa" aria-hidden="true" />
        </div>
      ))}
    </div>
  );
}

export function WalletPanel() {
  return (
    <section className="rounded-[18px] bg-polks-espresso p-5 text-white shadow-[0_14px_26px_rgba(48,22,15,0.16)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-[#a98278]">
            POLKS Wallet
          </p>
          <p className="mt-5 text-[42px] font-bold leading-none tracking-tight">
            {member.points.toLocaleString("en-US")}
            <span className="ml-2 text-lg font-medium text-[#b99b93]">pts</span>
          </p>
        </div>
        <div className="flex size-[62px] items-center justify-center rounded-[12px] border border-white/15 bg-white/10">
          <QrCode className="size-8" aria-hidden="true" />
        </div>
      </div>
      <div className="mt-7 space-y-1 text-[#a98278]">
        <p>ID: {member.memberId}</p>
        <p>{member.validAt}</p>
      </div>
      <Link
        href="/member-card"
        className="mt-7 flex items-center justify-between border-t border-white/10 pt-5 text-lg font-bold"
      >
        View Member Card
        <ChevronRight className="size-7" aria-hidden="true" />
      </Link>
    </section>
  );
}

export function QuickActions() {
  const actions = [
    { label: "Card", href: "/member-card", icon: CreditCard },
    { label: "Promo", href: "/promo", icon: Tag },
    { label: "Rewards", href: "/rewards", icon: Gift },
    { label: "History", href: "/history", icon: History },
  ];

  return (
    <nav className="grid grid-cols-4 gap-4" aria-label="Aksi cepat">
      {actions.map(({ label, href, icon: Icon }) => (
        <Link key={label} href={href} className="flex flex-col items-center gap-3">
          <span className="flex size-[64px] items-center justify-center rounded-full border border-polks-line bg-polks-soft text-foreground shadow-[0_4px_10px_rgba(47,22,15,0.06)]">
            <Icon className="size-6" aria-hidden="true" />
          </span>
          <span className="text-sm font-medium text-polks-coffee">{label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function RecommendationList() {
  const items = [
    {
      label: "Today's Promo",
      title: "Diskon Kopi Susu 20%",
      meta: "Ends today at 23:59",
      icon: Coffee,
      tone: "bg-[#ffd9d7] text-[#9c1b20]",
    },
    {
      label: "Recommended Reward",
      title: "Free Americano",
      meta: "1,000 pts to redeem",
      icon: BadgeCheck,
      tone: "bg-[#ffdfb2] text-polks-espresso",
    },
  ];

  return (
    <div className="space-y-5">
      {items.map(({ label, title, meta, icon: Icon, tone }) => (
        <Link
          key={title}
          href={label.includes("Reward") ? "/rewards" : "/promo"}
          className="flex items-center gap-4 rounded-[8px] border border-polks-line bg-white p-4 shadow-[0_8px_18px_rgba(49,24,17,0.04)]"
        >
          <span className={cn("flex size-[66px] shrink-0 items-center justify-center rounded-[8px]", tone)}>
            <Icon className="size-7" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold uppercase text-polks-caramel">
              {label}
            </span>
            <span className="mt-1 block text-xl font-semibold leading-tight">{title}</span>
            <span className="mt-1 block text-sm text-polks-cocoa">{meta}</span>
          </span>
          <ChevronRight className="size-6 text-polks-cocoa" aria-hidden="true" />
        </Link>
      ))}
    </div>
  );
}

export function MemberQrCard() {
  return (
    <section className="overflow-hidden rounded-[14px] border border-polks-line bg-white shadow-[0_10px_24px_rgba(49,24,17,0.06)]">
      <div className="bg-polks-espresso p-5 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">{member.name}</h2>
            <p className="mt-1 text-sm font-bold uppercase tracking-widest text-[#ffe1d5]">
              {member.tier}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-[#d9bdb5]">Balance</p>
            <p className="text-2xl font-bold text-[#ffc36d]">
              {member.points.toLocaleString("en-US")} pts
            </p>
          </div>
        </div>
        <p className="mt-9 font-mono text-sm uppercase tracking-[0.16em] text-[#b99991]">
          ID: {member.memberId}
        </p>
      </div>
      <div className="p-7 text-center">
        <div className="mx-auto flex aspect-square w-full max-w-[260px] items-center justify-center rounded-[8px] border border-polks-line bg-[radial-gradient(circle_at_center,#141414_0_34%,#050505_65%)] p-12 shadow-sm">
          <div className="flex size-36 items-center justify-center bg-white shadow-xl">
            <QrCode className="size-24 text-black" aria-hidden="true" />
          </div>
        </div>
        <p className="mx-auto mt-5 max-w-[270px] text-sm leading-5 text-polks-cocoa">
          Show this QR to cashier to earn points or redeem rewards.
        </p>
        <Button variant="ghost" className="mt-7 text-base font-bold text-polks-caramel hover:bg-polks-soft">
          <RefreshCw className="size-5" aria-hidden="true" />
          Refresh QR
        </Button>
      </div>
    </section>
  );
}

export function HistoryLinkCard() {
  return (
    <Link
      href="/history"
      className="flex items-center gap-4 rounded-[14px] border border-polks-line bg-polks-soft p-5"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-[#ead8d0]">
        <ReceiptText className="size-6" aria-hidden="true" />
      </span>
      <span className="flex-1 text-lg font-semibold">Transaction History</span>
      <ChevronRight className="size-6 text-polks-cocoa" aria-hidden="true" />
    </Link>
  );
}

export function PointsBanner() {
  return (
    <section className="flex items-end justify-between rounded-[20px] bg-polks-espresso p-6 text-white shadow-[0_14px_26px_rgba(48,22,15,0.16)]">
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-[#a98278]">
          Available Points
        </p>
        <p className="mt-16 text-[48px] font-bold leading-none">
          {member.points.toLocaleString("en-US")}
          <span className="ml-2 text-lg font-medium text-[#b99b93]">pts</span>
        </p>
      </div>
      <span className="mb-1 flex size-[58px] items-center justify-center rounded-full border border-white/20 bg-white/10 text-[#ffd89c]">
        <Star className="size-8" aria-hidden="true" />
      </span>
    </section>
  );
}

export function CategoryPills() {
  const pills: Array<{ label: string; value: RewardCategory }> = [
    { label: "All", value: "all" },
    { label: "Drinks", value: "drinks" },
    { label: "Pastry", value: "pastry" },
    { label: "Voucher", value: "voucher" },
  ];

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {pills.map((pill) => (
        <button
          key={pill.value}
          type="button"
          className={cn(
            "h-12 min-w-[82px] rounded-full border border-polks-line px-5 text-sm font-medium",
            pill.value === "all"
              ? "border-polks-caramel bg-polks-caramel text-white"
              : "bg-polks-soft text-polks-coffee"
          )}
        >
          {pill.label}
        </button>
      ))}
    </div>
  );
}

export function VoucherRail({
  vouchers,
}: {
  vouchers: Array<{ id: string; title: string; value: string; points: number; validUntil: string }>;
}) {
  return (
    <div className="-mx-5 flex gap-4 overflow-x-auto px-5 pb-2">
      {vouchers.map((voucher) => (
        <Link
          key={voucher.id}
          href="/voucher-success"
          className="grid min-w-[300px] grid-cols-[110px_1fr] overflow-hidden rounded-[14px] border border-polks-line bg-white shadow-[0_8px_18px_rgba(49,24,17,0.04)]"
        >
          <div className="flex flex-col items-center justify-center bg-polks-soft">
            <span className="text-sm text-polks-cocoa">Value</span>
            <span className="mt-2 text-2xl font-bold">{voucher.value}</span>
          </div>
          <div className="p-5">
            <h3 className="font-semibold">{voucher.title}</h3>
            <p className="mt-2 flex items-center gap-2 text-sm text-polks-cocoa">
              <CalendarDays className="size-4" aria-hidden="true" />
              {voucher.validUntil}
            </p>
            <span className="mt-4 inline-flex items-center gap-2 rounded-[8px] border border-[#f0cfc0] bg-[#fff0e8] px-3 py-2 text-sm font-semibold text-polks-caramel">
              <CircleDollarSign className="size-4" aria-hidden="true" />
              {voucher.points.toLocaleString("en-US")} pts
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function RewardGrid({
  rewards,
}: {
  rewards: Array<{
    id: string;
    title: string;
    points: number;
    availability: string;
    visual: string;
  }>;
}) {
  return (
    <div className="grid grid-cols-2 gap-5">
      {rewards.map((reward) => (
        <Link
          key={reward.id}
          href="/voucher-success"
          className="overflow-hidden rounded-[14px] border border-polks-line bg-white shadow-[0_8px_18px_rgba(49,24,17,0.04)]"
        >
          <div className="relative">
            <ProductVisual type={reward.visual} className="h-40 w-full" />
            <span className="absolute left-3 top-3 rounded-[5px] bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-polks-coffee shadow-sm">
              {reward.availability}
            </span>
          </div>
          <div className="p-4">
            <h3 className="text-lg font-semibold leading-tight">{reward.title}</h3>
            <div className="mt-3 border-t border-polks-line pt-3">
              <span className="inline-flex items-center gap-2 rounded-[8px] border border-[#f0cfc0] bg-[#fff0e8] px-3 py-2 text-sm font-semibold text-polks-caramel">
                <CircleDollarSign className="size-4" aria-hidden="true" />
                {reward.points.toLocaleString("en-US")} pts
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function VoucherSuccessCard() {
  return (
    <section className="rounded-[16px] border border-polks-line bg-white p-6 text-center shadow-[0_12px_24px_rgba(49,24,17,0.07)]">
      <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-[#eaf6ed] text-green-700">
        <BadgeCheck className="size-11" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-[28px] font-bold leading-tight">Voucher Ready</h1>
      <p className="mt-2 text-sm leading-5 text-polks-cocoa">
        Show this voucher code to cashier. It can be used at eligible POLKS GROUP outlets.
      </p>
      <div className="mt-6 rounded-[12px] border border-dashed border-polks-line bg-polks-soft p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-polks-caramel">
          Discount Voucher
        </p>
        <p className="mt-2 text-4xl font-bold">Rp25k</p>
        <p className="mt-1 text-sm text-polks-cocoa">Valid until 31 Jul 2026</p>
      </div>
      <div className="mt-5 rounded-[8px] bg-polks-espresso p-4 text-white">
        <p className="text-xs uppercase tracking-widest text-[#b99b93]">Voucher Code</p>
        <p className="mt-1 font-mono text-2xl font-bold tracking-[0.18em]">PLKS25</p>
      </div>
      <Button asChild className="mt-6 h-12 w-full rounded-[8px] bg-black text-white hover:bg-polks-espresso">
        <Link href="/rewards">Back to Rewards</Link>
      </Button>
    </section>
  );
}

export function ProductVisual({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  if (type === "pastry") {
    return (
      <div
        className={cn(
          "relative overflow-hidden bg-[linear-gradient(160deg,#d8c5b4,#f6efe8_48%,#b69f8e)]",
          className
        )}
      >
        <div className="absolute bottom-8 left-1/2 h-10 w-28 -translate-x-1/2 rounded-[50%] bg-white/85 shadow-[0_8px_24px_rgba(53,31,18,0.22)]" />
        <div className="absolute bottom-12 left-1/2 h-16 w-28 -translate-x-1/2 rounded-[100%_100%_42%_42%] bg-[repeating-linear-gradient(105deg,#bf5d17_0_10px,#ed9a3f_11px_20px,#9e4616_21px_25px)] shadow-[0_10px_20px_rgba(53,31,18,0.18)]" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-[linear-gradient(135deg,#2c180f,#8f582b_48%,#1a0d08)]",
        className
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_0_34%,rgba(255,215,145,0.28)_35%_41%,transparent_42%_100%)]" />
      <div className="absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-[10px] border-[#1f120d] bg-[radial-gradient(circle,#efe0bb_0_8%,#442113_9%_16%,#17100c_17%_22%,#c49a64_23%_26%,#2a140d_27%_100%)] shadow-[0_10px_24px_rgba(0,0,0,0.28)]" />
    </div>
  );
}
