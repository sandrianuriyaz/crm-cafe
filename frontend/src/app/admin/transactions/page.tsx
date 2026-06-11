"use client";

import { useMemo, useState } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { DataTable, type Column } from "@/components/ui/data-table";
import {
  posTransactions,
  type PosTransaction,
  type PosTransactionStatus,
} from "@/lib/loyalty/mock-data";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<
  PosTransactionStatus,
  { label: string; icon: string; className: string }
> = {
  synced: {
    label: "Synced",
    icon: "cloud_done",
    className: "text-on-secondary-container bg-secondary-container",
  },
  pending: {
    label: "Pending",
    icon: "sync",
    className: "text-deep-navy bg-soft-gold",
  },
  failed: {
    label: "Failed",
    icon: "error",
    className: "text-on-error-container bg-error-container",
  },
};

const STATUS_OPTIONS: { value: "all" | PosTransactionStatus; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "synced", label: "Synced" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
];

const columns: Column<PosTransaction>[] = [
  {
    key: "transactionId",
    header: "Transaction ID",
    className: "text-primary font-body-semibold",
  },
  { key: "outlet", header: "Outlet" },
  {
    key: "memberId",
    header: "Member ID",
    className: "text-on-surface-variant",
  },
  {
    key: "amount",
    header: "Amount",
    className: "text-right font-body-semibold",
  },
  {
    key: "points",
    header: "Points",
    className: "text-right",
    render: (row) =>
      row.points === null ? (
        <span className="font-caption text-caption text-outline">N/A</span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded bg-soft-gold px-2 py-1 font-label-xs text-label-xs text-deep-navy">
          <Icon name="stars" className="size-3.5" fill />+
          {row.points.toLocaleString("id-ID")}
        </span>
      ),
  },
  {
    key: "status",
    header: "Status",
    className: "text-center",
    render: (row) => {
      const style = STATUS_STYLE[row.status];
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded px-2 py-1 font-caption text-caption",
            style.className,
          )}
        >
          <Icon name={style.icon} className="size-3.5" />
          {style.label}
        </span>
      );
    },
  },
  {
    key: "hmacVerified",
    header: "HMAC",
    className: "text-center",
    render: (row) =>
      row.hmacVerified ? (
        <Icon name="verified_user" className="inline size-[18px] text-primary" />
      ) : row.status === "failed" ? (
        <Icon name="warning" className="inline size-[18px] text-error" />
      ) : (
        <Icon name="gpp_maybe" className="inline size-[18px] text-outline" />
      ),
  },
  {
    key: "date",
    header: "Date",
    className: "text-on-surface-variant font-caption text-caption",
  },
];

export default function AdminTransactionsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | PosTransactionStatus>("all");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posTransactions.filter((t) => {
      const matchesStatus = status === "all" || t.status === status;
      const matchesQuery =
        q === "" ||
        t.transactionId.toLowerCase().includes(q) ||
        t.outlet.toLowerCase().includes(q) ||
        t.memberId.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [query, status]);

  return (
    <AdminShell title="POS Transactions">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <p className="font-body text-body text-secondary">
          Manage and verify point-of-sale synchronizations.
        </p>
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-primary hover:bg-surface-container-high transition-colors font-body-semibold text-body-semibold"
        >
          <Icon name="download" className="size-[18px]" />
          Export CSV
        </button>
      </div>

      {/* Filters Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg">
        <div className="flex flex-col md:flex-row gap-4 md:items-end">
          <div className="w-full md:flex-1">
            <label className="block font-caption text-caption text-secondary mb-2">
              Search
            </label>
            <Input
              iconName="search"
              placeholder="Transaction, outlet, or member ID"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="w-full md:flex-1">
            <label className="block font-caption text-caption text-secondary mb-2">
              Outlet
            </label>
            <div className="relative">
              <Icon
                name="storefront"
                className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-outline"
              />
              <select className="h-12 w-full pl-10 pr-4 border border-outline-variant/50 rounded-lg font-body text-body bg-surface-container-lowest text-on-surface outline-none appearance-none">
                <option>All Outlets</option>
                <option>Downtown Flagship</option>
                <option>Westside Mall</option>
                <option>Airport Terminal B</option>
              </select>
              <Icon
                name="expand_more"
                className="absolute right-3 top-1/2 size-5 -translate-y-1/2 text-outline pointer-events-none"
              />
            </div>
          </div>
          <div className="w-full md:flex-1">
            <label className="block font-caption text-caption text-secondary mb-2">
              Sync Status
            </label>
            <div className="relative">
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "all" | PosTransactionStatus)
                }
                className="h-12 w-full pl-4 pr-4 border border-outline-variant/50 rounded-lg font-body text-body bg-surface-container-lowest text-on-surface outline-none appearance-none"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <Icon
                name="expand_more"
                className="absolute right-3 top-1/2 size-5 -translate-y-1/2 text-outline pointer-events-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Data Table Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="px-lg py-4 border-b border-outline-variant flex justify-between items-center bg-surface-bright">
          <h3 className="font-section-title text-section-title text-on-surface">
            Recent Transactions
          </h3>
          <span className="font-caption text-caption text-secondary bg-surface-container px-2 py-1 rounded">
            {rows.length} Records
          </span>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          className="rounded-none border-0"
        />

        {/* Pagination */}
        <div className="px-lg py-4 border-t border-outline-variant flex items-center justify-between bg-surface-bright">
          <span className="font-caption text-caption text-secondary">
            Showing 1 to {rows.length} of 244
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled
              className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-secondary hover:bg-surface-container disabled:opacity-50"
            >
              <Icon name="chevron_left" className="size-[18px]" />
            </button>
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center rounded border border-primary bg-primary text-on-primary"
            >
              1
            </button>
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-secondary hover:bg-surface-container"
            >
              2
            </button>
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-secondary hover:bg-surface-container"
            >
              3
            </button>
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-secondary hover:bg-surface-container"
            >
              <Icon name="chevron_right" className="size-[18px]" />
            </button>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
