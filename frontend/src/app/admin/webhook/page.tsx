"use client";

import { Webhook, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { MetricCard, AdminBadge, SectionHeader } from "@/components/admin/admin-ui";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { useAdminList } from "@/components/admin/use-admin-list";

type WebhookEvent = {
  id: string;
  eventId: string | null;
  idempotencyKey: string;
  status: string;
  errorMessage: string | null;
  createdAt: string;
};

const STATUS_META: Record<
  string,
  { label: string; type: "success" | "warning" | "error" | "neutral" | "info" }
> = {
  received: { label: "Received", type: "info" },
  processed: { label: "Processed", type: "success" },
  duplicate: { label: "Duplicate", type: "warning" },
  invalid_signature: { label: "Invalid Signature", type: "error" },
  error: { label: "Error", type: "error" },
};

function statusMeta(status: string) {
  return STATUS_META[status] ?? { label: status, type: "neutral" as const };
}

export default function AdminWebhookPage() {
  const list = useAdminList<WebhookEvent>("/admin/webhooks", { searchable: true });

  const processedCount = list.items.filter((e) => e.status === "processed").length;
  const duplicateCount = list.items.filter((e) => e.status === "duplicate").length;
  const errorCount = list.items.filter(
    (e) => e.status === "error" || e.status === "invalid_signature",
  ).length;

  return (
    <AdminShell title="Webhook Inbox">
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <MetricCard label="Total Events" value={list.total} Icon={Webhook} accent />
          <MetricCard label="Processed" value={processedCount} Icon={ShieldCheck} sub="Halaman ini" />
          <MetricCard label="Failed" value={errorCount} Icon={AlertCircle} sub="Halaman ini" />
          <MetricCard label="Duplicates" value={duplicateCount} Icon={CheckCircle2} sub="Halaman ini" />
        </div>

        <SectionHeader title={`${list.total} Event`} />
        <AdminDataTable
          list={list}
          searchable
          searchPlaceholder="Cari event / key / status..."
          columns={["Event ID", "Idempotency Key", "Status", "Error", "Waktu"]}
          empty="Belum ada event webhook."
          renderRow={(e) => {
            const meta = statusMeta(e.status);
            return [
              <span key="e" className="font-mono text-[11px] font-semibold text-polks-brand">
                {e.eventId ?? "—"}
              </span>,
              <span key="k" className="block max-w-[200px] truncate font-mono text-[11px] text-polks-muted">
                {e.idempotencyKey}
              </span>,
              <AdminBadge key="s" label={meta.label} type={meta.type} />,
              <span key="err" className="text-[11px] text-polks-muted">
                {e.errorMessage ?? "—"}
              </span>,
              <span key="t" className="text-[11px] text-polks-muted">
                {new Date(e.createdAt).toLocaleString("id-ID")}
              </span>,
            ];
          }}
        />
      </div>
    </AdminShell>
  );
}
