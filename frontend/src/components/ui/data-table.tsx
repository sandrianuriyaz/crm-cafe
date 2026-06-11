import * as React from "react";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  /** Custom cell renderer; defaults to String(row[key]) */
  render?: (row: T) => React.ReactNode;
  /** Extra classes applied to both the header cell and body cells */
  className?: string;
};

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  className,
}: {
  columns: Column<T>[];
  rows: T[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container border-b border-outline-variant">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "py-3 px-lg font-caption text-caption text-on-surface-variant uppercase tracking-wider",
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="font-body text-body">
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-outline-variant/50 last:border-b-0 hover:bg-surface-container-low/50 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn("py-4 px-lg text-on-surface", col.className)}>
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
