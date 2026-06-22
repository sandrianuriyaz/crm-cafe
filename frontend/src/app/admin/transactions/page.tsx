"use client";

import { AdminShell } from "@/components/layout/admin-shell";
import { SectionHeader, AdminBadge } from "@/components/admin/admin-ui";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { useAdminList } from "@/components/admin/use-admin-list";

type AdminTxn = {
  id: string;
  posOrderNumber: string;
  memberId: string | null;
  grandTotal: string | number;
  pointsAwarded: number;
  paymentMethod: string | null;
  storeId: string | null;
  occurredAt: string | null;
  createdAt: string;
};

function rp(v: string | number) {
  return "Rp" + Number(v).toLocaleString("id-ID");
}
function dateTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminTransactionsPage() {
  const list = useAdminList<AdminTxn>("/admin/transactions");

  return (
    <AdminShell title="POS Transactions">
      <div className="flex flex-col gap-4">
        <SectionHeader title={`Transaksi POS (${list.total})`} />
        <AdminDataTable
          list={list}
          columns={["Order", "Member", "Nominal", "Poin", "Metode", "Outlet", "Waktu"]}
          empty="Belum ada transaksi POS."
          renderRow={(t) => [
            <span key="o" className="font-mono text-[11px] font-semibold">{t.posOrderNumber}</span>,
            t.memberId ? (
              <span key="m" className="font-mono text-[11px]">{t.memberId.slice(0, 10)}…</span>
            ) : (
              <AdminBadge key="m" label="Guest" type="neutral" />
            ),
            <span key="g" className="font-semibold text-polks-text">{rp(t.grandTotal)}</span>,
            <span key="p" className="font-semibold text-polks-success">+{t.pointsAwarded}</span>,
            t.paymentMethod ?? "—",
            t.storeId ?? "—",
            dateTime(t.occurredAt ?? t.createdAt),
          ]}
        />
      </div>
    </AdminShell>
  );
}
