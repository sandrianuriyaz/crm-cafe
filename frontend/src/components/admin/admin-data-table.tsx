"use client";

import { type ReactNode } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { AdminTable } from "./admin-ui";
import { type AdminList } from "./use-admin-list";

const PAGE_SIZES = [10, 25, 50, 100];

// Window angka halaman (maks 5) di sekitar halaman aktif.
function pageWindow(page: number, totalPages: number): number[] {
  const size = Math.min(5, totalPages);
  let start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + size - 1);
  start = Math.max(1, end - size + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/** Baris atas: pilih jumlah data + kotak pencarian. */
export function AdminListToolbar<T>({
  list,
  searchable = false,
  searchPlaceholder = "Cari…",
}: {
  list: AdminList<T>;
  searchable?: boolean;
  searchPlaceholder?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <label className="flex items-center gap-2 text-xs text-polks-muted">
        Tampilkan
        <select
          value={list.pageSize}
          onChange={(e) => list.setPageSize(Number(e.target.value))}
          className="h-9 rounded-[10px] border-[1.5px] border-polks-border bg-white px-2 text-xs font-semibold text-polks-text outline-none focus:border-polks-brand"
        >
          {PAGE_SIZES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        data
      </label>

      {searchable ? (
        <div className="relative flex items-center">
          <Search size={13} className="absolute left-2.5 text-[#8A959D]" />
          <input
            value={list.search}
            onChange={(e) => list.setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 w-[240px] rounded-[10px] border-[1.5px] border-polks-border bg-white pl-7 pr-3 text-xs text-polks-text outline-none focus:border-polks-brand"
          />
        </div>
      ) : null}
    </div>
  );
}

/** Baris bawah: info "Menampilkan X–Y dari Z" + tombol halaman. */
export function AdminPagination<T>({ list }: { list: AdminList<T> }) {
  const { total, page, pageSize, setPage } = list;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-polks-muted">
        {total === 0 ? "Tidak ada data" : `Menampilkan ${from}–${to} dari ${total}`}
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
          aria-label="Sebelumnya"
          className="flex size-9 items-center justify-center rounded-[10px] border-[1.5px] border-polks-border bg-white text-polks-text disabled:opacity-40"
        >
          <ChevronLeft size={15} />
        </button>

        {pageWindow(page, totalPages).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setPage(n)}
            className={
              "h-9 min-w-9 rounded-[10px] border-[1.5px] px-2 text-xs font-semibold " +
              (n === page
                ? "border-polks-brand bg-polks-brand text-white"
                : "border-polks-border bg-white text-polks-text")
            }
          >
            {n}
          </button>
        ))}

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
          aria-label="Berikutnya"
          className="flex size-9 items-center justify-center rounded-[10px] border-[1.5px] border-polks-border bg-white text-polks-text disabled:opacity-40"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

/** Tabel admin lengkap: toolbar + tabel + pagination. */
export function AdminDataTable<T>({
  list,
  columns,
  renderRow,
  searchable = false,
  searchPlaceholder = "Cari…",
  empty = "Tidak ada data.",
}: {
  list: AdminList<T>;
  columns: string[];
  renderRow: (item: T, index: number) => ReactNode[];
  searchable?: boolean;
  searchPlaceholder?: string;
  empty?: string;
}) {
  if (list.error) {
    return (
      <div className="rounded-2xl border border-polks-border bg-white p-6 text-center text-sm text-polks-muted">
        {list.error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <AdminListToolbar list={list} searchable={searchable} searchPlaceholder={searchPlaceholder} />
      <AdminTable
        columns={columns}
        empty={list.loading ? "Memuat…" : empty}
        rows={list.items.map(renderRow)}
      />
      <AdminPagination list={list} />
    </div>
  );
}
