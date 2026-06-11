import { BottomNav } from "@/components/loyalty/bottom-nav";
import { CustomerMobileShell } from "@/components/loyalty/customer-mobile-shell";
import {
  CategoryPills,
  PointsBanner,
  RewardGrid,
  SectionTitle,
  VoucherRail,
} from "@/components/loyalty/loyalty-ui";
import { rewards, vouchers } from "@/lib/loyalty/mock-data";

export default function RewardCatalogPage() {
  return (
    <CustomerMobileShell>
      <div className="space-y-7">
        <section>
          <h1 className="text-[30px] font-bold leading-tight">Reward Catalog</h1>
          <p className="mt-3 text-lg text-polks-cocoa">
            Redeem your points for rewards and vouchers.
          </p>
        </section>

        <PointsBanner />
        <CategoryPills />

        <section>
          <SectionTitle title="Vouchers" />
          <VoucherRail vouchers={vouchers} />
        </section>

        <section>
          <SectionTitle title="Product Rewards" />
          <RewardGrid rewards={rewards} />
        </section>
      </div>
      <BottomNav />
    </CustomerMobileShell>
  );
}
