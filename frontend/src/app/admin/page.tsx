"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Zap, Store, Gift } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { MetricCard, AdminTable, SectionHeader } from "@/components/admin/admin-ui";
import { api } from "@/lib/api";
import { type Paginated } from "@/lib/loyalty/types";

type AdminMember = {
  id: string;
  memberCode: string;
  name: string;
  pointBalance: number;
  createdAt: string;
  user: { email: string } | null;
};
type AdminTxn = {
  id: string;
  posOrderNumber: string;
  grandTotal: string | number;
  pointsAwarded: number;
  paymentMethod: string | null;
  createdAt: string;
};

function rp(v: string | number) {
  return "Rp" + Number(v).toLocaleString("id-ID");
}
function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export default function AdminOverviewPage() {
  const [members, setMembers] = useState<Paginated<AdminMember> | null>(null);
  const [txns, setTxns] = useState<Paginated<AdminTxn> | null>(null);
  const [rewardCount, setRewardCount] = useState<number | null>(null);

  useEffect(() => {
    api<Paginated<AdminMember>>("/admin/members?take=5").then(setMembers).catch(() => {});
    api<Paginated<AdminTxn>>("/admin/transactions?take=5").then(setTxns).catch(() => {});
    api<unknown[]>("/rewards").then((r) => setRewardCount(r.length)).catch(() => {});
  }, []);

  return (
    <AdminShell title="Overview">
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <MetricCard label="Total Members" value={members?.total ?? "—"} Icon={Users} accent sub="Member terdaftar" />
          <MetricCard label="POS Transactions" value={txns?.total ?? "—"} Icon={Zap} sub="Total transaksi masuk" />
          <MetricCard label="Active Outlets" value={3} Icon={Store} sub="Outlet POLKS" />
          <MetricCard label="Reward Aktif" value={rewardCount ?? "—"} Icon={Gift} sub="Katalog reward" />
        </div>

        <div>
          <SectionHeader
            title="Member Terbaru"
            action={
              <Link href="/admin/members" className="text-xs font-semibold text-polks-brand">
                Lihat semua
              </Link>
            }
          />
          <AdminTable
            columns={["Nama", "Member ID", "Poin", "Bergabung"]}
            empty="Belum ada member."
            rows={(members?.items ?? []).map((m) => [
              <div key="n">
                <p className="font-semibold text-polks-text">{m.name}</p>
                <p className="text-[11px] text-polks-muted">{m.user?.email ?? "—"}</p>
              </div>,
              <span key="c" className="font-mono text-[11px]">{m.memberCode}</span>,
              <span key="p" className="font-semibold">{m.pointBalance.toLocaleString("id-ID")} pts</span>,
              shortDate(m.createdAt),
            ])}
          />
        </div>

        <div>
          <SectionHeader
            title="Transaksi Terbaru"
            action={
              <Link href="/admin/transactions" className="text-xs font-semibold text-polks-brand">
                Lihat semua
              </Link>
            }
          />
          <AdminTable
            columns={["Order", "Nominal", "Poin", "Metode", "Tanggal"]}
            empty="Belum ada transaksi."
            rows={(txns?.items ?? []).map((t) => [
              <span key="o" className="font-mono text-[11px]">{t.posOrderNumber}</span>,
              <span key="g" className="font-semibold">{rp(t.grandTotal)}</span>,
              <span key="p" className="font-semibold text-polks-success">+{t.pointsAwarded}</span>,
              t.paymentMethod ?? "—",
              shortDate(t.createdAt),
            ])}
          />
        </div>
      </div>
    </AdminShell>
  );
}
