"use client";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

// Urutan tampil & rentang waktu untuk riwayat poin.
export type HistorySort = "newest" | "oldest";
export type HistoryRange = "all" | "7d" | "30d" | "90d";

export const SORT_OPTIONS: { value: HistorySort; label: string; icon: string }[] = [
  { value: "newest", label: "Terbaru dulu", icon: "arrow_downward" },
  { value: "oldest", label: "Terlama dulu", icon: "arrow_upward" },
];

export const RANGE_OPTIONS: { value: HistoryRange; label: string }[] = [
  { value: "all", label: "Semua waktu" },
  { value: "7d", label: "7 hari terakhir" },
  { value: "30d", label: "30 hari terakhir" },
  { value: "90d", label: "90 hari terakhir" },
];

export const DEFAULT_SORT: HistorySort = "newest";
export const DEFAULT_RANGE: HistoryRange = "all";

// Ambang waktu (ms) untuk tiap rentang; null = tanpa batas.
export function rangeSince(range: HistoryRange, now: number): number | null {
  const day = 24 * 60 * 60 * 1000;
  switch (range) {
    case "7d":
      return now - 7 * day;
    case "30d":
      return now - 30 * day;
    case "90d":
      return now - 90 * day;
    default:
      return null;
  }
}

// Bottom-sheet filter urutan + rentang waktu (selaras gaya RedeemSheet).
export function HistoryFilterSheet({
  sort,
  range,
  onChangeSort,
  onChangeRange,
  onReset,
  onClose,
}: {
  sort: HistorySort;
  range: HistoryRange;
  onChangeSort: (v: HistorySort) => void;
  onChangeRange: (v: HistoryRange) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const isDefault = sort === DEFAULT_SORT && range === DEFAULT_RANGE;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <button
        type="button"
        aria-label="Tutup"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative z-10 flex w-full max-w-[420px] flex-col gap-5 rounded-t-[24px] bg-polks-bg p-5 md:rounded-[24px]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-polks-text">Filter Riwayat</h2>
          <button
            type="button"
            disabled={isDefault}
            onClick={onReset}
            className="text-xs font-semibold text-polks-brand disabled:opacity-40"
          >
            Reset
          </button>
        </div>

        {/* Urutkan */}
        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-semibold text-polks-text">Urutkan</p>
          <div className="grid grid-cols-2 gap-2">
            {SORT_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => onChangeSort(o.value)}
                className={cn(
                  "flex h-11 items-center justify-center gap-2 rounded-2xl border text-sm font-semibold transition-colors",
                  sort === o.value
                    ? "border-polks-brand bg-polks-brand text-white"
                    : "border-polks-border bg-white text-polks-muted",
                )}
              >
                <Icon name={o.icon} className="size-4" />
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Rentang waktu */}
        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-semibold text-polks-text">Rentang waktu</p>
          <div className="grid grid-cols-2 gap-2">
            {RANGE_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => onChangeRange(o.value)}
                className={cn(
                  "flex h-11 items-center justify-center rounded-2xl border text-sm font-semibold transition-colors",
                  range === o.value
                    ? "border-polks-brand bg-polks-brand text-white"
                    : "border-polks-border bg-white text-polks-muted",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-[50px] w-full items-center justify-center rounded-[14px] bg-polks-brand text-sm font-bold text-white"
        >
          Terapkan
        </button>
      </div>
    </div>
  );
}
