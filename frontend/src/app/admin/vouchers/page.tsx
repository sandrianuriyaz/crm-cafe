"use client";

import { useCallback, useEffect, useState } from "react";
import { Ticket, Copy } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminTable, AdminBadge, MetricCard, SectionHeader } from "@/components/admin/admin-ui";
import { api } from "@/lib/api";

type VoucherStatus = "ACTIVE" | "USED" | "EXPIRED";

type AdminVoucher = {
  id: string;
  code: string;
  memberName: string | null;
  reward: string | null;
  status: VoucherStatus;
  expiredAt: string | null;
  usedAt: string | null;
  createdAt: string;
};

type Paginated<T> = { total: number; skip: number; take: number; items: T[] };

const STATUS: Record<VoucherStatus, "success" | "neutral" | "error"> = {
  ACTIVE: "success",
  USED: "neutral",
  EXPIRED: "error",
};
const LABEL: Record<VoucherStatus, string> = {
  ACTIVE: "Aktif",
  USED: "Dipakai",
  EXPIRED: "Kedaluwarsa",
};
const FILTERS = ["Semua", "ACTIVE", "USED", "EXPIRED"] as const;

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminVouchersPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Semua");
  const [vouchers, setVouchers] = useState<AdminVoucher[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api<Paginated<AdminVoucher>>("/admin/vouchers")
      .then((res) => setVouchers(res.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function markUsed(id: string) {
    try {
      await api("/admin/vouchers/" + id, { method: "PATCH" });
      load();
    } catch {
      // abaikan; daftar tetap seperti semula
    }
  }

  const filtered = vouchers.filter((v) => filter === "Semua" || v.status === filter);
  const countBy = (s: VoucherStatus) => vouchers.filter((v) => v.status === s).length;

  return (
    <AdminShell title="Vouchers">
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <MetricCard label="Total Issued" value={vouchers.length} Icon={Ticket} accent />
          <MetricCard label="Aktif" value={countBy("ACTIVE")} />
          <MetricCard label="Dipakai" value={countBy("USED")} />
          <MetricCard label="Kedaluwarsa" value={countBy("EXPIRED")} />
        </div>

        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={
                "h-8 rounded-full px-3 text-xs font-semibold transition-colors " +
                (filter === f ? "bg-polks-brand text-white" : "border-[1.5px] border-polks-border bg-white text-polks-muted")
              }
            >
              {f === "Semua" ? "Semua" : LABEL[f as VoucherStatus]}
            </button>
          ))}
        </div>

        <SectionHeader title={`${filtered.length} Voucher`} />
        {loading ? (
          <p className="text-center text-[11px] text-polks-muted">Memuat…</p>
        ) : (
          <AdminTable
            columns={["Kode", "Member", "Reward", "Status", "Terbit", "Berakhir", ""]}
            empty="Belum ada voucher."
            rows={filtered.map((v) => [
              <span key="c" className="inline-flex items-center gap-1.5">
                <span className="font-mono text-[11px] font-semibold text-polks-brand">{v.code}</span>
                <button type="button" onClick={() => navigator.clipboard?.writeText(v.code)} aria-label="Salin">
                  <Copy size={11} className="text-polks-muted" />
                </button>
              </span>,
              <span key="m" className="font-semibold text-polks-text">{v.memberName ?? "—"}</span>,
              <span key="r" className="font-semibold text-polks-point">{v.reward ?? "—"}</span>,
              <AdminBadge key="s" label={LABEL[v.status]} type={STATUS[v.status]} />,
              <span key="t" className="text-[11px] text-polks-muted">{fmtDate(v.createdAt)}</span>,
              <span key="e" className="text-[11px] text-polks-muted">{fmtDate(v.expiredAt)}</span>,
              v.status === "ACTIVE" ? (
                <button
                  key="a"
                  type="button"
                  onClick={() => markUsed(v.id)}
                  className="h-7 rounded-full border-[1.5px] border-polks-border bg-white px-2.5 text-[11px] font-semibold text-polks-muted transition-colors hover:border-polks-brand hover:text-polks-brand"
                >
                  Tandai Dipakai
                </button>
              ) : (
                <span key="a" />
              ),
            ])}
          />
        )}
      </div>
    </AdminShell>
  );
}
