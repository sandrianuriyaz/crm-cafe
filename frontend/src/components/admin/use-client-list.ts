"use client";

import { useEffect, useMemo, useState } from "react";
import { type AdminList } from "./use-admin-list";

/**
 * Versi client-side dari {@link AdminList} untuk data yang sudah di-fetch penuh
 * (array). Search & pagination dilakukan di browser, dengan bentuk return yang
 * sama supaya bisa dipakai langsung oleh AdminDataTable / AdminPagination.
 */
export function useClientList<T>(
  all: T[],
  opts: {
    searchText?: (item: T) => string;
    initialPageSize?: number;
    loading?: boolean;
    error?: string | null;
  } = {},
): AdminList<T> {
  const { searchText, initialPageSize = 10, loading = false, error = null } = opts;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [search, setSearchState] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || !searchText) return all;
    return all.filter((item) => searchText(item).toLowerCase().includes(q));
  }, [all, search, searchText]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Jaga halaman tetap valid saat hasil mengecil (filter / hapus data).
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const setPageSize = (n: number) => {
    setPageSizeState(n);
    setPage(1);
  };
  const setSearch = (s: string) => {
    setSearchState(s);
    setPage(1);
  };

  const items = filtered.slice((page - 1) * pageSize, page * pageSize);

  return {
    items,
    total,
    page,
    pageSize,
    search,
    loading,
    error,
    setPage,
    setPageSize,
    setSearch,
    reload: () => {},
  };
}
