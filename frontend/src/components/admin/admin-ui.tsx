import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type IconType = LucideIcon;

export function MetricCard({
  label,
  value,
  sub,
  accent = false,
  Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
  Icon?: IconType;
}) {
  return (
    <div
      className={
        "flex flex-col gap-2 rounded-2xl p-4 shadow-[0_1px_4px_rgba(37,52,63,0.05)] " +
        (accent ? "bg-polks-brand" : "border border-polks-border bg-white")
      }
    >
      <div className="flex items-center justify-between">
        <span className={"text-[11px] font-medium " + (accent ? "text-white/50" : "text-[#8A959D]")}>
          {label}
        </span>
        {Icon ? (
          <div
            className={
              "flex size-[30px] items-center justify-center rounded-[9px] " +
              (accent ? "bg-white/10" : "bg-polks-surface")
            }
          >
            <Icon size={14} className={accent ? "text-polks-point" : "text-polks-brand"} />
          </div>
        ) : null}
      </div>
      <span
        className={
          "text-2xl font-bold leading-none tracking-[-0.01em] " +
          (accent ? "text-polks-point" : "text-polks-text")
        }
      >
        {value}
      </span>
      {sub ? (
        <span className={"text-[11px] " + (accent ? "text-white/40" : "text-[#8A959D]")}>{sub}</span>
      ) : null}
    </div>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-sm font-bold text-polks-text">{title}</h2>
      {action}
    </div>
  );
}

export function AdminBadge({
  label,
  type = "neutral",
}: {
  label: string;
  type?: "success" | "warning" | "error" | "neutral" | "info";
}) {
  const cfg = {
    success: "bg-[#DCFCE7] text-[#15803D]",
    warning: "bg-[#FEF9C3] text-[#A16207]",
    error: "bg-[#FEE2E2] text-[#B91C1C]",
    neutral: "bg-polks-surface text-polks-muted",
    info: "bg-[#E0F2FE] text-[#0369A1]",
  }[type];
  const dot = {
    success: "bg-[#15803D]",
    warning: "bg-[#A16207]",
    error: "bg-[#B91C1C]",
    neutral: "bg-polks-muted",
    info: "bg-[#0369A1]",
  }[type];
  return (
    <span className={"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold " + cfg}>
      <span className={"size-[5px] shrink-0 rounded-full " + dot} />
      {label}
    </span>
  );
}

export function AdminTable({
  columns,
  rows,
  empty = "Tidak ada data.",
}: {
  columns: string[];
  rows: ReactNode[][];
  empty?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-polks-border bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse">
          <thead>
            <tr className="border-b border-polks-border bg-polks-bg">
              {columns.map((col) => (
                <th
                  key={col}
                  className="whitespace-nowrap px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.07em] text-[#8A959D]"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-xs text-polks-muted">
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={i}
                  className={
                    "transition-colors hover:bg-[#FAFBFC] " +
                    (i < rows.length - 1 ? "border-b border-[#F0F4F6]" : "")
                  }
                >
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-3 align-middle text-xs text-polks-text">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminPlaceholder({ title }: { title: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-polks-border bg-white p-10 text-center">
      <h2 className="text-base font-bold text-polks-text">{title}</h2>
      <p className="max-w-sm text-sm text-polks-muted">
        Modul ini sedang disiapkan dan akan tersedia setelah endpoint backend-nya siap.
      </p>
    </div>
  );
}
