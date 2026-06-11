import { BottomNav } from "@/components/loyalty/bottom-nav";
import { CustomerMobileShell } from "@/components/loyalty/customer-mobile-shell";
import { VoucherSuccessCard } from "@/components/loyalty/loyalty-ui";

export default function VoucherSuccessPage() {
  return (
    <CustomerMobileShell>
      <VoucherSuccessCard />
      <BottomNav />
    </CustomerMobileShell>
  );
}
