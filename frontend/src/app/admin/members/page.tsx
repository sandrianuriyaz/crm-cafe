"use client";

import { useMemo, useState } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import {
  adminMembers,
  type AdminMember,
  type MemberTier,
  type MemberStatus,
} from "@/lib/loyalty/mock-data";

const TIER_STYLE: Record<MemberTier, { className: string; icon?: string }> = {
  Gold: { className: "bg-soft-gold text-deep-navy", icon: "stars" },
  Silver: { className: "bg-secondary-fixed text-on-secondary-fixed", icon: "workspace_premium" },
  Base: { className: "bg-surface-container-high text-on-surface-variant" },
};

const TIER_OPTIONS: Array<{ value: "all" | MemberTier; label: string }> = [
  { value: "all", label: "All Tiers" },
  { value: "Gold", label: "Gold" },
  { value: "Silver", label: "Silver" },
  { value: "Base", label: "Base" },
];

const STATUS_OPTIONS: Array<{ value: "all" | MemberStatus; label: string }> = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const AVATAR_TONE: Record<MemberTier, string> = {
  Gold: "bg-primary-container/20 text-primary",
  Silver: "bg-secondary-container text-on-secondary-container",
  Base: "bg-surface-container-high text-on-surface-variant",
};

const columns: Column<AdminMember>[] = [
  {
    key: "name",
    header: "Member Details",
    render: (m) => (
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full font-body-semibold text-body-semibold",
            AVATAR_TONE[m.tier],
          )}
        >
          {m.initials}
        </div>
        <div>
          <div className="font-body-semibold text-body-semibold text-on-surface">{m.name}</div>
          <div className="font-caption text-caption text-on-surface-variant">{m.email}</div>
        </div>
      </div>
    ),
  },
  {
    key: "memberCode",
    header: "Member ID",
    render: (m) => <span className="font-body text-body text-on-surface-variant">{m.memberCode}</span>,
  },
  {
    key: "points",
    header: "Points Balance",
    className: "text-right",
    render: (m) => (
      <span className="font-body-semibold text-body-semibold text-on-surface">
        {m.points.toLocaleString("id-ID")}
        <span className="ml-1 font-caption text-on-surface-variant">pts</span>
      </span>
    ),
  },
  {
    key: "tier",
    header: "Tier",
    render: (m) => {
      const tier = TIER_STYLE[m.tier];
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-1 font-label-xs text-label-xs",
            tier.className,
          )}
        >
          {tier.icon ? <Icon name={tier.icon} className="size-3.5" fill /> : null}
          {m.tier}
        </span>
      );
    },
  },
  {
    key: "lastVisit",
    header: "Last Visit",
    render: (m) => <span className="font-body text-body text-on-surface-variant">{m.lastVisit}</span>,
  },
  {
    key: "status",
    header: "Status",
    render: (m) => (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 font-caption text-caption",
          m.status === "inactive" && "text-on-surface-variant",
        )}
      >
        <span
          className={cn("size-2 rounded-full", m.status === "active" ? "bg-primary" : "bg-outline")}
        />
        {m.status === "active" ? "Active" : "Inactive"}
      </span>
    ),
  },
  {
    key: "actions",
    header: "Actions",
    className: "text-right",
    render: () => (
      <div className="flex items-center justify-end gap-1">
        {(["edit", "history", "add_circle", "more_vert"] as const).map((name) => (
          <button
            key={name}
            type="button"
            className="rounded-md p-1.5 text-primary transition-colors hover:bg-secondary-container"
          >
            <Icon name={name} className="size-[18px]" />
          </button>
        ))}
      </div>
    ),
  },
];

export default function AdminMembersPage() {
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState<"all" | MemberTier>("all");
  const [status, setStatus] = useState<"all" | MemberStatus>("all");

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return adminMembers.filter((m) => {
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.memberCode.toLowerCase().includes(q);
      const matchesTier = tier === "all" || m.tier === tier;
      const matchesStatus = status === "all" || m.status === status;
      return matchesSearch && matchesTier && matchesStatus;
    });
  }, [search, tier, status]);

  return (
    <AdminShell title="Member Management">
      <div className="mb-lg flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
        <p className="font-body text-body text-on-surface-variant">
          Manage loyalty members, view history, and adjust points balances.
        </p>
        <button
          type="button"
          className="inline-flex items-center gap-xs rounded-lg bg-primary px-4 py-2 font-body-semibold text-body-semibold text-on-primary transition-colors hover:bg-primary/90"
        >
          <Icon name="person_add" className="size-5" />
          Add Member
        </button>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col gap-md rounded-t-xl border border-b-0 border-outline-variant bg-surface p-md sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-on-surface-variant"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members by name, ID, or email..."
            className="ds-input h-10 w-full rounded-lg border border-outline-variant bg-surface pl-10 pr-4 font-body text-body text-on-surface placeholder:text-on-surface-variant/60"
          />
        </div>
        <div className="flex items-center gap-sm">
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as "all" | MemberTier)}
            className="h-10 rounded-lg border border-outline-variant bg-surface px-3 font-body text-body text-on-surface"
          >
            {TIER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "all" | MemberStatus)}
            className="h-10 rounded-lg border border-outline-variant bg-surface px-3 font-body text-body text-on-surface"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DataTable columns={columns} rows={rows} className="rounded-t-none border-t-0" />

      {/* Pagination (presentational) */}
      <div className="mt-md flex items-center justify-between">
        <span className="font-caption text-caption text-on-surface-variant">
          Showing {rows.length} of {adminMembers.length} members
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled
            className="rounded p-1 text-on-surface-variant hover:bg-surface-container-high disabled:opacity-50"
          >
            <Icon name="chevron_left" className="size-5" />
          </button>
          <button
            type="button"
            className="rounded p-1 text-on-surface-variant hover:bg-surface-container-high"
          >
            <Icon name="chevron_right" className="size-5" />
          </button>
        </div>
      </div>
    </AdminShell>
  );
}
