"use client";

import { useCallback, useEffect, useState } from "react";
import { Radio, Send, Users } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { MetricCard, AdminTable, AdminBadge, SectionHeader } from "@/components/admin/admin-ui";
import { api, ApiError } from "@/lib/api";
import { type Paginated } from "@/lib/loyalty/types";

type Broadcast = {
  id: string;
  title: string;
  message: string;
  target: string;
  recipientCount: number;
  createdAt: string;
};

const TARGETS: { value: string; label: string }[] = [
  { value: "all", label: "Semua Member" },
  { value: "silver", label: "Silver" },
  { value: "gold", label: "Gold" },
  { value: "platinum", label: "Platinum" },
  { value: "inactive", label: "Tidak Aktif (30 hari)" },
];
const TARGET_LABEL = Object.fromEntries(TARGETS.map((t) => [t.value, t.label]));

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminBroadcastPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState(TARGETS[0].value);
  const [sending, setSending] = useState(false);
  const [sentInfo, setSentInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Paginated<Broadcast> | null>(null);

  const loadHistory = useCallback(() => {
    api<Paginated<Broadcast>>("/admin/broadcasts").then(setHistory).catch(() => {});
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function onSend() {
    if (sending) return;
    if (title.trim().length < 2) {
      setError("Judul minimal 2 karakter.");
      return;
    }
    if (message.trim().length < 1) {
      setError("Pesan tidak boleh kosong.");
      return;
    }
    setSending(true);
    setError(null);
    setSentInfo(null);
    try {
      const res = await api<{ recipientCount: number }>("/admin/broadcast", {
        method: "POST",
        body: { title: title.trim(), message: message.trim(), target },
      });
      setSentInfo(`Terkirim ke ${res.recipientCount.toLocaleString("id-ID")} member.`);
      setTitle("");
      setMessage("");
      loadHistory();
      setTimeout(() => setSentInfo(null), 4000);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Gagal mengirim broadcast.",
      );
    } finally {
      setSending(false);
    }
  }

  const items = history?.items ?? [];
  const totalRecipients = items.reduce((s, b) => s + b.recipientCount, 0);
  const field =
    "h-10 w-full rounded-[10px] border-[1.5px] border-polks-border bg-polks-bg px-3 text-[13px] text-polks-text outline-none focus:border-polks-brand focus:bg-white";

  return (
    <AdminShell title="Broadcast">
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <MetricCard label="Total Broadcast" value={history?.total ?? "—"} Icon={Radio} accent />
          <MetricCard label="Total Penerima" value={totalRecipients.toLocaleString("id-ID")} Icon={Users} />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Compose */}
          <div>
            <SectionHeader title="Broadcast Baru" />
            <div className="flex flex-col gap-3.5 rounded-2xl border border-polks-border bg-white p-5">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-polks-text">Judul</label>
                <input className={field} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Promo Akhir Pekan" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-polks-text">Target</label>
                <select className={field} value={target} onChange={(e) => setTarget(e.target.value)}>
                  {TARGETS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-polks-text">Pesan</label>
                <textarea
                  className="min-h-[96px] w-full rounded-[10px] border-[1.5px] border-polks-border bg-polks-bg p-3 text-[13px] text-polks-text outline-none focus:border-polks-brand focus:bg-white"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={500}
                  placeholder="Tulis pesan broadcast…"
                />
                <p className="mt-1 text-[10px] text-polks-muted">{message.length} / 500 karakter</p>
              </div>

              {error ? <p className="text-[12px] font-medium text-polks-error">{error}</p> : null}
              {sentInfo ? <p className="text-[12px] font-medium text-polks-success">{sentInfo}</p> : null}

              <button
                type="button"
                onClick={onSend}
                disabled={sending}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-polks-brand text-sm font-bold text-white disabled:opacity-60"
              >
                <Send size={15} />
                {sending ? "Mengirim…" : "Kirim Broadcast"}
              </button>
            </div>
          </div>

          {/* History */}
          <div>
            <SectionHeader title="Riwayat" />
            <AdminTable
              columns={["Judul", "Target", "Penerima", "Waktu"]}
              empty={history ? "Belum ada broadcast." : "Memuat…"}
              rows={items.map((b) => [
                <div key="t">
                  <p className="font-semibold text-polks-text">{b.title}</p>
                  <p className="line-clamp-1 text-[10px] text-polks-muted">{b.message}</p>
                </div>,
                <AdminBadge key="g" label={TARGET_LABEL[b.target] ?? b.target} type="info" />,
                b.recipientCount.toLocaleString("id-ID"),
                <span key="w" className="text-[11px] text-polks-muted">{fmtDate(b.createdAt)}</span>,
              ])}
            />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
