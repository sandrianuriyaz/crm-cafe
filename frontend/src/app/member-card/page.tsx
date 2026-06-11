import { BadgeCheck } from "lucide-react";
import { BottomNav } from "@/components/loyalty/bottom-nav";
import { CustomerMobileShell } from "@/components/loyalty/customer-mobile-shell";
import { HistoryLinkCard, MemberQrCard } from "@/components/loyalty/loyalty-ui";
import { member } from "@/lib/loyalty/mock-data";

export default function MemberCardPage() {
  return (
    <CustomerMobileShell>
      <div className="space-y-8">
        <section>
          <h1 className="text-[30px] font-bold leading-tight">Member Card</h1>
          <p className="mt-2 text-lg text-polks-cocoa">Show this QR to cashier</p>
        </section>

        <MemberQrCard />
        <HistoryLinkCard />

        <p className="flex items-center justify-center gap-2 pt-6 text-sm text-polks-cocoa">
          <BadgeCheck className="size-5" aria-hidden="true" />
          {member.validAt}
        </p>
      </div>
      <BottomNav />
    </CustomerMobileShell>
  );
}
