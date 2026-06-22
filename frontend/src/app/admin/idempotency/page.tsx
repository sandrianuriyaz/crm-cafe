"use client";

import { ShieldCheck } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { MetricCard, SectionHeader } from "@/components/admin/admin-ui";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { useAdminList } from "@/components/admin/use-admin-list";

type IdempotencyKey = {
  idempotencyKey: string;
  posOrderId: string | null;
  posOrderNumber: string | null;
  memberId: string | null;
  pointsAwarded: number;
  createdAt: string;
};

export default function AdminIdempotencyPage() {
  const list = useAdminList<IdempotencyKey>("/admin/idempotency-keys");
  const withMember = list.items.filter((r) => r.memberId !== null).length;
  const pagePoints = list.items.reduce((sum, r) => sum + r.pointsAwarded, 0);

  return (
    <AdminShell title="Idempotency">
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <MetricCard label="Total Keys" value={list.loading ? "—" : list.total} Icon={ShieldCheck} accent />
          <MetricCard label="Dengan Member" value={list.loading ? "—" : withMember} sub="Halaman ini" />
          <MetricCard label="Total Poin" value={list.loading ? "—" : pagePoints} sub="Halaman ini" />
        </div>

        <div className="rounded-xl bg-polks-surface px-4 py-3">
          <p className="text-xs leading-relaxed text-polks-brand">
            <strong>Idempotency</strong> mencegah pemrosesan ganda event webhook yang sama. Tiap key disimpan
            & dicek sebelum diproses; event duplikat dilewati otomatis.
          </p>
        </div>

        <SectionHeader title={list.loading ? "Records" : `${list.total} Records`} />
        <AdminDataTable
          list={list}
          columns={["Idempotency Key", "Order ID", "No. Order", "Poin", "Waktu"]}
          empty="Belum ada record."
          renderRow={(r) => [
            <span key="k" className="block max-w-[220px] truncate font-mono text-[11px] font-semibold text-polks-text">
              {r.idempotencyKey}
            </span>,
            <span key="oid" className="font-mono text-[11px] text-polks-muted">{r.posOrderId ?? "—"}</span>,
            <span key="onum" className="font-mono text-[11px] text-polks-muted">{r.posOrderNumber ?? "—"}</span>,
            <span key="p" className="font-semibold text-polks-success">+{r.pointsAwarded}</span>,
            <span key="t" className="text-[11px] text-polks-muted">
              {new Date(r.createdAt).toLocaleString("id-ID")}
            </span>,
          ]}
        />
      </div>
    </AdminShell>
  );
}
