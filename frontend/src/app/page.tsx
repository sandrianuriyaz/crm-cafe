import Link from "next/link";
import { PromoCard } from "@/components/customer/promo-card";
import { CustomerShell } from "@/components/layout/customer-shell";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { locations, promos } from "@/lib/loyalty/mock-data";

const howItWorks = [
  {
    step: "1",
    title: "Order at Cashier",
    description: "Place your order at any participating Polks Group outlet.",
  },
  {
    step: "2",
    title: "Show QR",
    description: "Open the app and display your unique member QR code.",
  },
  {
    step: "3",
    title: "Cashier Scans",
    description: "The cashier scans your code before finalizing the payment.",
  },
  {
    step: "4",
    title: "Earn Points",
    description: "Official points are instantly credited to your CRM account.",
    highlight: true,
  },
];

export default function GuestHomePage() {
  return (
    <CustomerShell
      topbarRight={
        <Button asChild size="sm" className="bg-primary text-on-primary">
          <Link href="/login">Login</Link>
        </Button>
      }
      drawerFooter={
        <div className="flex flex-col gap-sm">
          <Button asChild className="w-full">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/register">Register</Link>
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-lg md:gap-xl">
        {/* Hero Section */}
        <section className="relative w-full rounded-xl bg-[#0F172A] overflow-hidden p-lg md:p-xl flex flex-col md:flex-row items-center justify-between gap-lg">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle, #c4c5d7 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          />
          <div className="relative z-10 flex-1 flex flex-col gap-md">
            <div className="inline-flex items-center gap-xs px-2 py-1 rounded-full bg-primary/20 border border-primary/30 w-fit">
              <Icon name="stars" className="text-primary-fixed size-4" />
              <span className="font-caption text-caption text-primary-fixed">
                Official CRM Points
              </span>
            </div>
            <h2 className="font-page-title text-page-title text-white leading-tight md:text-[32px] md:leading-[40px]">
              Collect points from every purchase.
            </h2>
            <p className="font-body text-body text-secondary-fixed-dim max-w-md">
              Show your member QR to cashier and earn official CRM points to
              unlock exclusive rewards and tiers.
            </p>
            <div className="flex gap-sm mt-sm">
              <Button asChild className="bg-primary-fixed text-on-primary-fixed px-6 py-3">
                <Link href="/register">Join Now</Link>
              </Button>
            </div>
          </div>
          <div className="relative z-10 w-full max-w-[280px] md:max-w-[320px] aspect-[1.6/1] bg-gradient-to-br from-[#1E293B] to-[#0F172A] rounded-xl border border-white/10 p-md flex flex-col justify-between shadow-2xl transform rotate-2 md:rotate-3 hover:rotate-0 transition-transform duration-500">
            <div className="flex justify-between items-start">
              <span className="font-app-name text-app-name text-white">POLKS</span>
              <Icon name="qr_code_scanner" className="text-white/50" />
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="font-caption text-caption text-white/50">Guest Status</p>
                <p className="font-body-semibold text-body-semibold text-white">0 Points</p>
              </div>
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                <Icon name="qr_code" className="text-black" />
              </div>
            </div>
          </div>
        </section>

        {/* Trending Promos */}
        <section className="flex flex-col gap-md">
          <div className="flex justify-between items-end border-b border-outline-variant pb-xs">
            <h3 className="font-section-title text-section-title text-on-surface">
              Trending Promos
            </h3>
            <Link
              href="#"
              className="font-caption text-caption text-primary hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
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

        {/* How It Works */}
        <section className="flex flex-col gap-md">
          <div className="border-b border-outline-variant pb-xs">
            <h3 className="font-section-title text-section-title text-on-surface">
              How It Works
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-sm md:gap-md">
            {howItWorks.map((item) =>
              item.highlight ? (
                <div
                  key={item.step}
                  className="bg-surface-container-lowest rounded-xl border border-primary/30 shadow-[0_0_15px_rgba(29,78,216,0.1)] p-md flex flex-row md:flex-col items-center md:items-start gap-md relative overflow-hidden"
                >
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-xl" />
                  <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 z-10">
                    <span className="font-body-semibold text-body-semibold">{item.step}</span>
                  </div>
                  <div className="z-10">
                    <h4 className="font-body-semibold text-body-semibold text-primary mb-xs">
                      {item.title}
                    </h4>
                    <p className="font-caption text-caption text-on-surface-variant">
                      {item.description}
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  key={item.step}
                  className="bg-surface-container-lowest rounded-xl border border-outline-variant p-md flex flex-row md:flex-col items-center md:items-start gap-md hover:bg-surface-container-low transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-body-semibold text-body-semibold text-primary">
                      {item.step}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-body-semibold text-body-semibold text-on-surface mb-xs">
                      {item.title}
                    </h4>
                    <p className="font-caption text-caption text-on-surface-variant">
                      {item.description}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        </section>

        {/* Outlets & Join CTA */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-md">
          {/* Outlets List */}
          <div className="md:col-span-2 bg-surface-container-lowest rounded-xl border border-outline-variant p-md flex flex-col gap-sm">
            <div className="flex justify-between items-center border-b border-outline-variant pb-xs mb-xs">
              <h3 className="font-body-semibold text-body-semibold text-on-surface">
                Available Outlets
              </h3>
              <Icon name="location_on" className="text-on-surface-variant size-4" />
            </div>
            <div className="flex flex-col">
              {locations.map((location, index) => (
                <div
                  key={location.id}
                  className={`flex items-center justify-between py-sm ${
                    index < locations.length - 1
                      ? "border-b border-outline-variant/50"
                      : ""
                  }`}
                >
                  <div>
                    <p className="font-body-semibold text-body-semibold text-on-surface">
                      {location.name}
                    </p>
                    <p className="font-caption text-caption text-on-surface-variant">
                      {location.address}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-surface-container-high rounded text-xs font-medium text-on-surface">
                    Open
                  </span>
                </div>
              ))}
            </div>
            <button className="mt-auto w-full py-2 text-center font-caption text-caption text-primary hover:bg-surface-container-low rounded-lg transition-colors">
              View All Locations
            </button>
          </div>

          {/* Join CTA Card */}
          <div className="md:col-span-1 bg-[#0F172A] rounded-xl p-md flex flex-col justify-center items-center text-center gap-md relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-0" />
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-colors duration-500" />
            <Icon name="card_membership" className="size-9 text-primary-fixed z-10" />
            <div className="z-10">
              <h3 className="font-card-title text-card-title text-white mb-xs">
                Ready to start earning?
              </h3>
              <p className="font-caption text-caption text-secondary-fixed-dim">
                Join thousands of members enjoying exclusive rewards today.
              </p>
            </div>
            <Button
              asChild
              className="w-full bg-primary text-white z-10 shadow-lg shadow-primary/20"
            >
              <Link href="/register">Register Now</Link>
            </Button>
          </div>
        </section>
      </div>
    </CustomerShell>
  );
}
