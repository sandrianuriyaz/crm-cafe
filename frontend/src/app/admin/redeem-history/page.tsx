"use client";

import { Gift, Coins } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { MetricCard, SectionHeader } from "@/components/admin/admin-ui";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { useAdminList } from "@/components/admin/use-admin-list";

type RedeemItem = {
  id: string;
  memberName: string | null;
  reward: string | null;
  pointsSpent: number;
  voucherCode: string | null;
  createdAt: string;
};

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function RedeemHistoryPage() {
  const list = useAdminList<RedeemItem>("/admin/redeems");
  const pagePoints = list.items.reduce((sum, it) => sum + it.pointsSpent, 0);

  return (
    <AdminShell title="Redeem History">
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <MetricCard label="Total Redeem" value={list.total} Icon={Gift} accent sub="Reward ditukar" />
          <MetricCard
            label="Poin Ditukar"
            value={list.loading ? "—" : pagePoints.toLocaleString("id-ID")}
            Icon={Coins}
            sub="Halaman ini"
          />
        </div>

        <div>
          <SectionHeader title="Riwayat Penukaran" />
          <AdminDataTable
            list={list}
            columns={["Member", "Reward", "Poin", "Voucher", "Tanggal"]}
            empty="Belum ada penukaran."
            renderRow={(it) => [
              <span key="m" className="font-semibold text-polks-text">{it.memberName ?? "—"}</span>,
              it.reward ?? "—",
              <span key="p" className="font-semibold">{it.pointsSpent.toLocaleString("id-ID")} pts</span>,
              <span key="v" className="font-mono text-[11px]">{it.voucherCode ?? "—"}</span>,
              shortDate(it.createdAt),
            ]}
          />
        </div>
      </div>
    </AdminShell>
  );
}
