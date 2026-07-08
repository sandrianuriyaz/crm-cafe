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
type Outlet = { id: string; name: string };

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
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [outletFilter, setOutletFilter] = useState("");

  useEffect(() => {
    api<Paginated<AdminMember>>("/admin/members?take=5").then(setMembers).catch(() => {});
    api<unknown[]>("/rewards").then((r) => setRewardCount(r.length)).catch(() => {});
    api<Outlet[]>("/outlets").then(setOutlets).catch(() => {});
  }, []);

  // Terpisah dari effect di atas: transaksi ikut re-fetch saat filter outlet berubah.
  useEffect(() => {
    const qs = outletFilter ? `?take=5&outletId=${outletFilter}` : "?take=5";
    api<Paginated<AdminTxn>>(`/admin/transactions${qs}`).then(setTxns).catch(() => {});
  }, [outletFilter]);

  return (
    <AdminShell title="Overview">
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <MetricCard label="Total Members" value={members?.total ?? "—"} Icon={Users} accent sub="Member terdaftar" />
          <MetricCard label="POS Transactions" value={txns?.total ?? "—"} Icon={Zap} sub="Total transaksi masuk" />
          <MetricCard label="Active Outlets" value={outlets.length} Icon={Store} sub="Outlet POLKS" />
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
              <div className="flex items-center gap-3">
                <select
                  value={outletFilter}
                  onChange={(e) => setOutletFilter(e.target.value)}
                  className="h-8 rounded-lg border-[1.5px] border-polks-border bg-white px-2 text-xs text-polks-text outline-none focus:border-polks-brand"
                >
                  <option value="">Semua Outlet</option>
                  {outlets.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
                <Link href="/admin/transactions" className="text-xs font-semibold text-polks-brand">
                  Lihat semua
                </Link>
              </div>
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
