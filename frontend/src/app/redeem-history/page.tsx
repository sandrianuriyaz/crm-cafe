"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Gift, Copy, Check, QrCode } from "lucide-react";
import { CustomerShell } from "@/components/layout/customer-shell";
import { VoucherQrModal } from "@/components/customer/voucher-qr-modal";
import { api, ApiError } from "@/lib/api";
import { connectRealtime } from "@/lib/realtime";
import { type Voucher } from "@/lib/loyalty/types";

const STATUS_META: Record<Voucher["status"], { label: string; dot: string; bg: string; text: string }> = {
  ACTIVE: { label: "Aktif", dot: "#38A169", bg: "#DCFCE7", text: "#166534" },
  USED: { label: "Digunakan", dot: "#8A959D", bg: "#F1F5F9", text: "#64748B" },
  EXPIRED: { label: "Kedaluwarsa", dot: "#E04F4F", bg: "#FEE2E2", text: "#B91C1C" },
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function VoucherCard({ v, onShowQr }: { v: Voucher; onShowQr?: () => void }) {
  // Fallback bila status di luar dugaan (mis. enum backend bertambah) supaya
  // `meta.bg` dkk tidak pernah membaca undefined → mencegah crash/blank.
  const meta = STATUS_META[v.status] ?? STATUS_META.USED;
  const rewardName = v.reward?.name ?? "Reward";
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 3000);
    return () => clearTimeout(t);
  }, [copied]);

  async function handleCopy() {
    try {
      await navigator.clipboard?.writeText(v.code);
      setCopied(true);
    } catch {
      // abaikan; clipboard tidak tersedia
    }
  }

  const isActive = v.status === "ACTIVE";

  return (
    <div
      className="overflow-hidden rounded-2xl border border-polks-border bg-polks-card"
      style={{ opacity: isActive ? 1 : 0.65 }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className={
            "flex size-10 shrink-0 items-center justify-center rounded-xl " +
            (isActive ? "bg-polks-point-soft" : "bg-polks-surface")
          }
        >
          <Gift size={18} color={isActive ? "#F6B84B" : "#8A959D"} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-polks-text">{rewardName}</p>
          <p className="mt-0.5 text-[11px] text-[#8A959D]">
            Ditukar {formatDate(v.createdAt)} · s/d {formatDate(v.expiredAt)}
          </p>
        </div>
        <span
          className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1"
          style={{ backgroundColor: meta.bg }}
        >
          <span className="size-[5px] rounded-full" style={{ backgroundColor: meta.dot }} />
          <span className="text-[9px] font-semibold" style={{ color: meta.text }}>
            {meta.label}
          </span>
        </span>
      </div>

      {/* Code bar — copy button hanya untuk voucher ACTIVE */}
      <div className="flex items-center justify-between border-t border-dashed border-polks-border bg-polks-bg px-4 py-2.5">
        <span className="font-mono text-xs font-bold tracking-[0.12em] text-polks-text">{v.code}</span>
        {isActive ? (
          <button
            type="button"
            onClick={handleCopy}
            className={
              "flex items-center gap-1 text-[11px] font-semibold transition-colors " +
              (copied ? "text-polks-success" : "text-polks-brand")
            }
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Tersalin" : "Salin"}
          </button>
        ) : null}
      </div>

      {/* CTA — hanya untuk ACTIVE */}
      {isActive && onShowQr ? (
        <button
          type="button"
          onClick={onShowQr}
          className="flex w-full items-center justify-center gap-2 bg-polks-brand py-3 text-[13px] font-bold text-white"
        >
          <QrCode size={15} />
          Gunakan di Kasir
        </button>
      ) : null}
    </div>
  );
}

export default function RedeemHistoryPage() {
  const router = useRouter();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrVoucher, setQrVoucher] = useState<Voucher | null>(null);

  useEffect(() => {
    let alive = true;
    api<Voucher[]>("/vouchers")
      // Jaga-jaga bila respons bukan array (mis. perubahan kontrak backend) —
      // jangan biarkan setState non-array bikin .filter() melempar → blank.
      .then((d) => alive && setVouchers(Array.isArray(d) ? d : []))
      .catch((err) => {
        if (!alive) return;
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login");
          return;
        }
        setError(err instanceof Error ? err.message : "Gagal memuat riwayat");
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [router]);

  // Realtime: begitu kasir POS scan & redeem voucher, backend push
  // "voucher:updated" → langsung perbarui kartu jadi "Digunakan" tanpa refresh.
  useEffect(() => {
    const socket = connectRealtime();
    if (!socket) return;

    // Payload bisa saja parsial / kehilangan field saat transport. Merge dengan
    // aman: hanya timpa field yang ada, dan jangan pernah hapus `reward` yang
    // sudah kita punya (VoucherCard mengakses reward.name → kalau hilang, blank).
    socket.on("voucher:updated", (updated: Partial<Voucher> & { id?: string }) => {
      if (!updated?.id) return;
      setVouchers((prev) =>
        prev.map((v) =>
          v.id === updated.id
            ? { ...v, ...updated, reward: updated.reward ?? v.reward }
            : v,
        ),
      );
      // Bila QR voucher yang sedang dibuka ternyata baru saja dipakai,
      // tutup modal-nya — sudah tidak relevan ditunjukkan ke kasir.
      setQrVoucher((cur) =>
        cur && cur.id === updated.id && updated.status && updated.status !== "ACTIVE"
          ? null
          : cur,
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const activeList = useMemo(() => vouchers.filter((v) => v.status === "ACTIVE"), [vouchers]);
  const pastList = useMemo(() => vouchers.filter((v) => v.status !== "ACTIVE"), [vouchers]);
  const usedCount = vouchers.filter((v) => v.status === "USED").length;

  return (
    <CustomerShell showHeader={false} showBottomNav={false} topbarRight={null}>
      {/* Header */}
      <div className="bg-polks-brand px-5 pb-5 pt-4">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          aria-label="Kembali"
          className="mb-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors active:bg-white/20"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-[22px] font-bold tracking-[-0.02em] text-white">Voucher Saya</h1>
        <p className="mt-1 text-[13px] text-white/50">
          Voucher dari reward yang sudah kamu tukar — tunjukkan ke kasir.
        </p>
        <div className="mt-4 flex gap-3">
          {[
            { label: "Total Ditukar", val: vouchers.length },
            { label: "Masih Aktif", val: activeList.length },
            { label: "Digunakan", val: usedCount },
          ].map(({ label, val }) => (
            <div
              key={label}
              className="flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.08] px-3 py-2.5 text-center"
            >
              <p className="text-[15px] font-bold text-white">{val}</p>
              <p className="mt-0.5 text-[9px] text-white/40">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Wave */}
      <div className="bg-polks-brand leading-none">
        <svg viewBox="0 0 390 28" preserveAspectRatio="none" className="block h-7 w-full">
          <path d="M0,0 Q195,28 390,0 L390,28 L0,28 Z" fill="#F6F8FA" />
        </svg>
      </div>

      <div className="flex flex-col gap-5 bg-polks-bg px-5 pb-10">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl border border-polks-border bg-polks-card" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-polks-border bg-polks-card p-6 text-center">
            <p className="text-sm text-polks-muted">{error}</p>
          </div>
        ) : vouchers.length === 0 ? (
          <div className="rounded-2xl border border-polks-border bg-polks-card p-5 text-center">
            <p className="text-sm text-polks-muted">Belum ada penukaran. Tukar poinmu di katalog reward!</p>
          </div>
        ) : (
          <>
            {activeList.length > 0 ? (
              <div>
                <p className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-[#8A959D]">Aktif</p>
                <div className="flex flex-col gap-3">
                  {activeList.map((v) => (
                    <VoucherCard key={v.id} v={v} onShowQr={() => setQrVoucher(v)} />
                  ))}
                </div>
              </div>
            ) : null}
            {pastList.length > 0 ? (
              <div>
                <p className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-[#8A959D]">Riwayat</p>
                <div className="flex flex-col gap-3">
                  {pastList.map((v) => (
                    <VoucherCard key={v.id} v={v} />
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      {qrVoucher ? (
        <VoucherQrModal voucher={qrVoucher} onClose={() => setQrVoucher(null)} />
      ) : null}
    </CustomerShell>
  );
}
