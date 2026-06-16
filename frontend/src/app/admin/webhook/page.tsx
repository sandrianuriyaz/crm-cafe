"use client";

import { useEffect, useState } from "react";
import { Webhook, ShieldCheck, AlertCircle, CheckCircle2, Search } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { MetricCard, AdminTable, AdminBadge, SectionHeader } from "@/components/admin/admin-ui";
import { api } from "@/lib/api";
import { type Paginated } from "@/lib/loyalty/types";

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
  const [data, setData] = useState<Paginated<WebhookEvent> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api<Paginated<WebhookEvent>>("/admin/webhooks")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const items = data?.items ?? [];
  const q = search.toLowerCase();
  const filtered = items.filter(
    (e) =>
      (e.eventId ?? "").toLowerCase().includes(q) ||
      e.idempotencyKey.toLowerCase().includes(q) ||
      e.status.toLowerCase().includes(q),
  );

  const total = data?.total ?? items.length;
  const processedCount = items.filter((e) => e.status === "processed").length;
  const duplicateCount = items.filter((e) => e.status === "duplicate").length;
  const errorCount = items.filter((e) => e.status === "error" || e.status === "invalid_signature").length;

  return (
    <AdminShell title="Webhook Inbox">
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <MetricCard label="Total Events" value={total} Icon={Webhook} accent />
          <MetricCard label="Processed" value={processedCount} Icon={ShieldCheck} />
          <MetricCard label="Failed" value={errorCount} Icon={AlertCircle} />
          <MetricCard label="Duplicates" value={duplicateCount} Icon={CheckCircle2} />
        </div>

        <div className="relative flex items-center">
          <Search size={14} className="absolute left-3 text-[#8A959D]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari event / key / status..."
            className="h-10 w-full max-w-[280px] rounded-xl border-[1.5px] border-polks-border bg-white pl-9 pr-3 text-sm text-polks-text outline-none focus:border-polks-brand"
          />
        </div>

        <SectionHeader title={`${filtered.length} Event`} />
        <AdminTable
          columns={["Event ID", "Idempotency Key", "Status", "Error", "Waktu"]}
          empty={loading ? "Memuat…" : "Belum ada event webhook."}
          rows={filtered.map((e) => {
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
          })}
        />
      </div>
    </AdminShell>
  );
}
