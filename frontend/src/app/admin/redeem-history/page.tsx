"use client";

import { useEffect, useState } from "react";
import { Gift, Coins } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { MetricCard, AdminTable, SectionHeader } from "@/components/admin/admin-ui";
import { api } from "@/lib/api";

type RedeemItem = {
  id: string;
  memberName: string | null;
  reward: string | null;
  pointsSpent: number;
  voucherCode: string | null;
  createdAt: string;
};
type RedeemResponse = {
  total: number;
  skip: number;
  take: number;
  items: RedeemItem[];
};

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function RedeemHistoryPage() {
  const [data, setData] = useState<RedeemResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<RedeemResponse>("/admin/redeems")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const items = data?.items ?? [];
  const totalPoints = items.reduce((sum, it) => sum + it.pointsSpent, 0);

  return (
    <AdminShell title="Redeem History">
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <MetricCard
            label="Total Redeem"
            value={data?.total ?? "—"}
            Icon={Gift}
            accent
            sub="Reward ditukar"
          />
          <MetricCard
            label="Poin Ditukar"
            value={loading ? "—" : totalPoints.toLocaleString("id-ID")}
            Icon={Coins}
            sub="Akumulasi poin"
          />
        </div>

        <div>
          <SectionHeader title="Riwayat Penukaran" />
          <AdminTable
            columns={["Member", "Reward", "Poin", "Voucher", "Tanggal"]}
            empty={loading ? "Memuat…" : "Belum ada penukaran."}
            rows={items.map((it) => [
              <span key="m" className="font-semibold text-polks-text">{it.memberName ?? "—"}</span>,
              it.reward ?? "—",
              <span key="p" className="font-semibold">{it.pointsSpent.toLocaleString("id-ID")} pts</span>,
              <span key="v" className="font-mono text-[11px]">{it.voucherCode ?? "—"}</span>,
              shortDate(it.createdAt),
            ])}
          />
        </div>
      </div>
    </AdminShell>
  );
}
