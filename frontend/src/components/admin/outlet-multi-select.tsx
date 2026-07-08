"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { type Paginated } from "@/lib/loyalty/types";

type Outlet = { id: string; name: string; status: "ACTIVE" | "INACTIVE" };

export function OutletMultiSelect({
  value,
  onChange,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const [outlets, setOutlets] = useState<Outlet[]>([]);

  useEffect(() => {
    // /admin/outlets (bukan /outlets publik) supaya outlet nonaktif yang sudah
    // pernah ditandai di record lama tetap tampil, tidak diam-diam hilang dari form.
    api<Paginated<Outlet>>("/admin/outlets?take=100")
      .then((res) => setOutlets(res.items))
      .catch(() => setOutlets([]));
  }, []);

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  if (outlets.length === 0) {
    return <p className="text-[11px] text-polks-muted">Belum ada outlet.</p>;
  }

  return (
    <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto rounded-xl border-[1.5px] border-polks-border p-2.5">
      {outlets.map((o) => (
        <label key={o.id} className="flex items-center gap-2 text-sm text-polks-text">
          <input
            type="checkbox"
            checked={value.includes(o.id)}
            onChange={() => toggle(o.id)}
            className="size-4 rounded border-polks-border accent-polks-brand"
          />
          {o.name}
          {o.status === "INACTIVE" ? (
            <span className="text-[10px] text-polks-muted">(nonaktif)</span>
          ) : null}
        </label>
      ))}
    </div>
  );
}
