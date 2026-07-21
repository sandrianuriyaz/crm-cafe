"use client";

import { useEffect, useState } from "react";
import { Webhook, ShieldCheck, AlertCircle, CheckCircle2, X } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { MetricCard, AdminBadge, SectionHeader } from "@/components/admin/admin-ui";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { useAdminList } from "@/components/admin/use-admin-list";
import { api } from "@/lib/api";

type WebhookEvent = {
  id: string;
  eventId: string | null;
  idempotencyKey: string;
  status: string;
  errorMessage: string | null;
  createdAt: string;
};

// Payload mentah dari POS (kontrak docs/integrasi-crm.md §4). Dibaca defensif
// karena baris invalid_signature bisa berisi body yang tidak sesuai kontrak.
type RawPayload = {
  customer?: { id?: string | null; name?: string | null; phone?: string | null };
  transaction?: {
    order_number?: string | null;
    grand_total?: number | null;
    payment_method?: string | null;
  };
  raw?: string;
};

type WebhookDetail = WebhookEvent & {
  rawPayload: RawPayload;
  transaction: {
    id: string;
    posOrderNumber: string | null;
    memberId: string | null;
    pointsAwarded: number;
    grandTotal: number;
    occurredAt: string;
  } | null;
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

function rupiah(n: number) {
  return "Rp" + n.toLocaleString("id-ID");
}

export default function AdminWebhookPage() {
  const list = useAdminList<WebhookEvent>("/admin/webhooks", { searchable: true });
  const [detailId, setDetailId] = useState<string | null>(null);

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
          searchPlaceholder="Cari no. order / key / status..."
          columns={["Event ID", "Idempotency Key", "Status", "Error", "Waktu", ""]}
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
              <button
                key="d"
                type="button"
                onClick={() => setDetailId(e.id)}
                className="whitespace-nowrap rounded-lg border-[1.5px] border-polks-border px-2.5 py-1 text-[11px] font-semibold text-polks-text hover:border-polks-brand hover:text-polks-brand"
              >
                Detail
              </button>,
            ];
          }}
        />
      </div>

      {detailId ? (
        <WebhookDetailModal id={detailId} onClose={() => setDetailId(null)} />
      ) : null}
    </AdminShell>
  );
}

function WebhookDetailModal({ id, onClose }: { id: string; onClose: () => void }) {
  const [data, setData] = useState<WebhookDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api<WebhookDetail>(`/admin/webhooks/${id}`)
      .then((d) => alive && setData(d))
      .catch((e: unknown) =>
        alive && setError(e instanceof Error ? e.message : "Gagal memuat detail"),
      );
    return () => {
      alive = false;
    };
  }, [id]);

  const payload = data?.rawPayload ?? {};
  const cust = payload.customer;
  const trx = payload.transaction;
  const meta = data ? statusMeta(data.status) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Tutup" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-2xl bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-polks-text">Detail Event POS</h2>
          <button type="button" onClick={onClose} aria-label="Tutup" className="text-polks-muted">
            <X size={18} />
          </button>
        </div>

        {error ? (
          <p className="py-6 text-center text-xs text-polks-muted">{error}</p>
        ) : !data ? (
          <p className="py-6 text-center text-xs text-polks-muted">Memuat…</p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field label="Status">
                {meta ? <AdminBadge label={meta.label} type={meta.type} /> : null}
              </Field>
              <Field label="Waktu">{new Date(data.createdAt).toLocaleString("id-ID")}</Field>
              <Field label="No. Order">{trx?.order_number ?? "—"}</Field>
              <Field label="Total">
                {typeof trx?.grand_total === "number" ? rupiah(trx.grand_total) : "—"}
              </Field>
              <Field label="Pelanggan">{cust?.name ?? "—"}</Field>
              <Field label="HP">{cust?.phone ?? "—"}</Field>
              <Field label="customer.id (POS)" mono>
                {cust?.id ?? "— (walk-in / tidak scan QR)"}
              </Field>
              <Field label="Idempotency Key" mono>{data.idempotencyKey}</Field>
            </div>

            {data.errorMessage ? (
              <p className="rounded-xl bg-[#FDECEC] px-3 py-2 text-[11px] text-[#B42318]">
                {data.errorMessage}
              </p>
            ) : null}

            {/* Jawaban langsung untuk komplain "poin belum masuk". */}
            <div className="rounded-xl border-[1.5px] border-polks-border p-3 text-[11px] text-polks-text">
              {data.transaction ? (
                <>
                  Transaksi tercatat · poin diberikan:{" "}
                  <b>{data.transaction.pointsAwarded}</b> ·{" "}
                  {data.transaction.memberId ? (
                    <>member <span className="font-mono">{data.transaction.memberId}</span></>
                  ) : (
                    <b className="text-[#B42318]">tanpa member (guest)</b>
                  )}
                </>
              ) : (
                <b className="text-[#B42318]">
                  Belum ada transaksi tercatat untuk key ini — event gagal diproses.
                </b>
              )}
            </div>

            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.07em] text-[#8A959D]">
                Payload mentah
              </p>
              <pre className="max-h-[280px] overflow-auto rounded-xl bg-polks-bg p-3 font-mono text-[11px] leading-relaxed text-polks-text">
                {JSON.stringify(data.rawPayload, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  mono = false,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.07em] text-[#8A959D]">
        {label}
      </p>
      <div className={"text-xs text-polks-text " + (mono ? "break-all font-mono text-[11px]" : "")}>
        {children}
      </div>
    </div>
  );
}
