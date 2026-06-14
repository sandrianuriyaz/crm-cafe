"use client";

import { useState } from "react";
import { Radio, Send, CheckCircle2 } from "lucide-react";
import { AdminShell } from "@/components/layout/admin-shell";
import { MetricCard, AdminTable, AdminBadge, SectionHeader } from "@/components/admin/admin-ui";

const broadcasts = [
  { id: "BC-001", title: "Weekend Coffee Deal", target: "All Members", sent: 1248, opened: 876, status: "delivered", time: "10 Jun 09:00" },
  { id: "BC-002", title: "New Reward: Free Latte", target: "Gold+", sent: 312, opened: 241, status: "delivered", time: "8 Jun 10:00" },
  { id: "BC-003", title: "Promo Reminder", target: "All Members", sent: 0, opened: 0, status: "scheduled", time: "20 Jun 09:00" },
];

const TARGETS = ["All Members", "Silver Members", "Gold Members", "Platinum Members", "Inactive (30d+)"];

export default function AdminBroadcastPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState(TARGETS[0]);
  const [sent, setSent] = useState(false);

  const field = "h-10 w-full rounded-[10px] border-[1.5px] border-polks-border bg-polks-bg px-3 text-[13px] text-polks-text outline-none focus:border-polks-brand focus:bg-white";

  return (
    <AdminShell title="Broadcast">
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <MetricCard label="Total Broadcasts" value={broadcasts.length} Icon={Radio} accent />
          <MetricCard label="Total Terkirim" value={broadcasts.reduce((s, b) => s + b.sent, 0).toLocaleString("id-ID")} Icon={Send} />
          <MetricCard label="Avg Open Rate" value="73%" Icon={CheckCircle2} />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Compose */}
          <div>
            <SectionHeader title="Broadcast Baru" />
            <div className="flex flex-col gap-3.5 rounded-2xl border border-polks-border bg-white p-5">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-polks-text">Judul</label>
                <input className={field} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Weekend Coffee Deal" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-polks-text">Target</label>
                <select className={field} value={target} onChange={(e) => setTarget(e.target.value)}>
                  {TARGETS.map((t) => (
                    <option key={t}>{t}</option>
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
              <button
                type="button"
                onClick={() => {
                  setSent(true);
                  setTimeout(() => setSent(false), 2000);
                }}
                className={"flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold text-white " + (sent ? "bg-polks-success" : "bg-polks-brand")}
              >
                <Send size={15} />
                {sent ? "Terkirim!" : "Kirim Broadcast"}
              </button>
            </div>
          </div>

          {/* History */}
          <div>
            <SectionHeader title="Riwayat" />
            <AdminTable
              columns={["Judul", "Target", "Terkirim", "Dibuka", "Status"]}
              rows={broadcasts.map((b) => [
                <div key="t">
                  <p className="font-semibold text-polks-text">{b.title}</p>
                  <p className="text-[10px] text-polks-muted">{b.time}</p>
                </div>,
                b.target,
                b.sent.toLocaleString("id-ID"),
                b.opened.toLocaleString("id-ID"),
                <AdminBadge key="s" label={b.status === "delivered" ? "Terkirim" : "Terjadwal"} type={b.status === "delivered" ? "success" : "info"} />,
              ])}
            />
          </div>
        </div>
        <p className="text-center text-[11px] text-polks-muted">Data contoh — menunggu endpoint <code>/admin/broadcast</code>.</p>
      </div>
    </AdminShell>
  );
}
