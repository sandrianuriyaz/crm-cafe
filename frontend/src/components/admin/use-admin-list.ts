"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { type Paginated } from "@/lib/loyalty/types";

export type AdminList<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  loading: boolean;
  error: string | null;
  setPage: (p: number) => void;
  setPageSize: (n: number) => void;
  setSearch: (s: string) => void;
  reload: () => void;
};

/**
 * State + fetch untuk tabel admin dengan server-side pagination & search.
 * Endpoint diharapkan menerima `take`, `skip`, (opsional) `search`
 * dan mengembalikan `{ items, total }`.
 */
export function useAdminList<T>(
  endpoint: string,
  opts: {
    searchable?: boolean;
    initialPageSize?: number;
    params?: Record<string, string | undefined>;
  } = {},
): AdminList<T> {
  const { searchable = false, initialPageSize = 10, params } = opts;
  // Param tambahan (mis. filter status) — string stabil untuk dependency.
  const paramsKey = JSON.stringify(params ?? {});

  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [search, setSearchState] = useState("");
  const [debounced, setDebounced] = useState("");
  const [data, setData] = useState<Paginated<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce pencarian, dan balik ke halaman 1 tiap query berubah.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset ke halaman 1 saat filter (params) berubah.
  useEffect(() => {
    setPage(1);
  }, [paramsKey]);

  const setPageSize = useCallback((n: number) => {
    setPageSizeState(n);
    setPage(1);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        take: String(pageSize),
        skip: String((page - 1) * pageSize),
      });
      if (searchable && debounced) qs.set("search", debounced);
      const extra = JSON.parse(paramsKey) as Record<string, string | undefined>;
      for (const [k, v] of Object.entries(extra)) {
        if (v !== undefined && v !== "") qs.set(k, v);
      }
      const res = await api<Paginated<T>>(`${endpoint}?${qs.toString()}`);
      setData(res);
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 401)) {
        setError(err instanceof Error ? err.message : "Gagal memuat data");
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint, page, pageSize, debounced, searchable, paramsKey]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
    page,
    pageSize,
    search,
    loading,
    error,
    setPage,
    setPageSize,
    setSearch: setSearchState,
    reload: load,
  };
}
