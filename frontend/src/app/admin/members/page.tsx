"use client";

import { useState } from "react";
import { Plus, Minus, X } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { SectionHeader } from "@/components/admin/admin-ui";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { useAdminList } from "@/components/admin/use-admin-list";
import { api } from "@/lib/api";

type AdminMember = {
  id: string;
  memberCode: string;
  name: string;
  phone: string | null;
  pointBalance: number;
  createdAt: string;
  user: { email: string } | null;
};

export default function AdminMembersPage() {
  const list = useAdminList<AdminMember>("/admin/members", { searchable: true });
  const [adjusting, setAdjusting] = useState<AdminMember | null>(null);

  return (
    <AdminShell title="Members">
      <div className="flex flex-col gap-4">
        <SectionHeader title={`Member (${list.total})`} />
        <AdminDataTable
          list={list}
          searchable
          searchPlaceholder="Cari nama / email / kode..."
          columns={["Member", "Member ID", "Telepon", "Poin", "Aksi"]}
          empty="Tidak ada member."
          renderRow={(m) => [
            <div key="m">
              <p className="font-semibold text-polks-text">{m.name}</p>
              <p className="text-[11px] text-polks-muted">{m.user?.email ?? "—"}</p>
            </div>,
            <span key="c" className="font-mono text-[11px]">{m.memberCode}</span>,
            m.phone ?? "—",
            <span key="p" className="font-semibold">{m.pointBalance.toLocaleString("id-ID")} pts</span>,
            <button
              key="a"
              type="button"
              onClick={() => setAdjusting(m)}
              className="rounded-lg border border-polks-border px-2.5 py-1 text-[11px] font-semibold text-polks-brand hover:bg-polks-surface"
            >
              Adjust Poin
            </button>,
          ]}
        />
      </div>

      {adjusting ? (
        <AdjustPointsModal
          member={adjusting}
          onClose={() => setAdjusting(null)}
          onDone={() => {
            setAdjusting(null);
            list.reload();
          }}
        />
      ) : null}
    </AdminShell>
  );
}

function AdjustPointsModal({
  member,
  onClose,
  onDone,
}: {
  member: AdminMember;
  onClose: () => void;
  onDone: () => void;
}) {
  const [points, setPoints] = useState(0);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (points === 0 || reason.trim().length < 3) {
      setError("Poin tidak boleh 0 dan alasan minimal 3 karakter.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api(`/admin/members/${member.id}/adjust-points`, {
        method: "POST",
        body: { points, reason },
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyesuaikan poin");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Tutup" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[400px] rounded-2xl bg-white p-5">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-polks-text">Adjust Poin</h2>
            <p className="text-xs text-polks-muted">
              {member.name} · saldo {member.pointBalance.toLocaleString("id-ID")} pts
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup" className="text-polks-muted">
            <X size={18} />
          </button>
        </div>

        <label className="mb-1.5 block text-xs font-semibold text-polks-text">Jumlah Poin (+/−)</label>
        <div className="mb-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPoints((p) => p - 50)}
            className="flex size-10 items-center justify-center rounded-xl border border-polks-border text-polks-brand"
          >
            <Minus size={16} />
          </button>
          <input
            type="number"
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            className="h-10 flex-1 rounded-xl border-[1.5px] border-polks-border bg-white text-center text-sm font-bold text-polks-text outline-none focus:border-polks-brand"
          />
          <button
            type="button"
            onClick={() => setPoints((p) => p + 50)}
            className="flex size-10 items-center justify-center rounded-xl border border-polks-border text-polks-brand"
          >
            <Plus size={16} />
          </button>
        </div>

        <label className="mb-1.5 block text-xs font-semibold text-polks-text">Alasan</label>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="mis. Kompensasi komplain"
          className="mb-3 h-10 w-full rounded-xl border-[1.5px] border-polks-border bg-white px-3 text-sm text-polks-text outline-none focus:border-polks-brand"
        />

        {error ? <p className="mb-3 text-[13px] text-polks-error">{error}</p> : null}

        <p className="mb-4 text-xs text-polks-muted">
          Saldo setelah: <span className="font-semibold text-polks-text">{(member.pointBalance + points).toLocaleString("id-ID")} pts</span>
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-xl border-[1.5px] border-polks-border bg-white text-sm font-semibold text-polks-brand"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={submit}
            className="h-11 flex-1 rounded-xl bg-polks-brand text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
