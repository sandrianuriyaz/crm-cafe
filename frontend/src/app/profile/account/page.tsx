"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, User, Mail, Phone, IdCard, Calendar, ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { CustomerShell } from "@/components/layout/customer-shell";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { TIER_META } from "@/lib/loyalty/tier";

type MemberProfile = {
  memberCode: string;
  name: string;
  email: string;
  phone: string | null;
  pointBalance: number;
  createdAt: string;
  emailVerified: boolean;
  pendingEmail: string | null;
  hasPassword: boolean;
};

function formatJoined(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function DocketRow({
  label, icon: Icon, children,
}: { label: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-1.5 py-1.5">
      <Icon size={11} className="mb-0.5 shrink-0 text-polks-muted" />
      <span className="whitespace-nowrap text-[10.5px] text-polks-muted">{label}</span>
      <span className="mb-0.5 h-px flex-1 border-b border-dotted border-[#D7DCDF]" />
      {children}
    </div>
  );
}

export default function AccountInfoPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [p, setP]               = useState<MemberProfile | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [sendingVerif, setSendingVerif] = useState(false);
  const [verifSent, setVerifSent]       = useState(false);

  const [editing, setEditing]     = useState(false);
  const [name, setName]           = useState("");
  const [phone, setPhone]         = useState("");
  const [email, setEmail]         = useState("");
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pendingBusy, setPendingBusy] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    let alive = true;
    api<MemberProfile>("/member/profile")
      .then((d) => {
        if (!alive) return;
        setP(d);
        setName(d.name);
        setPhone(d.phone ?? "");
        setEmail(d.email);
      })
      .catch((err) => {
        if (!alive) return;
        if (err instanceof ApiError && err.status === 401) { router.replace("/login"); return; }
        setError("Gagal memuat data akun. Coba lagi.");
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  };

  useEffect(load, [router]); // eslint-disable-line react-hooks/exhaustive-deps

  const tierMeta = TIER_META[user?.tier ?? "bronze"];

  function startEdit() {
    if (!p) return;
    setName(p.name);
    setPhone(p.phone ?? "");
    setEmail(p.email);
    setSaveError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setSaveError(null);
  }

  async function onSave() {
    if (!p) return;
    setSaving(true);
    setSaveError(null);
    try {
      const nameChanged  = name.trim() !== p.name;
      const phoneChanged = phone.trim() !== (p.phone ?? "");
      const emailChanged = p.hasPassword && email.trim().toLowerCase() !== p.email.toLowerCase();

      if (nameChanged || phoneChanged) {
        await api("/member/profile", {
          method: "PATCH",
          body: {
            ...(nameChanged ? { name: name.trim() } : {}),
            ...(phoneChanged ? { phone: phone.trim() } : {}),
          },
        });
      }
      if (emailChanged) {
        await api("/auth/email-change/request", {
          method: "POST",
          body: { email: email.trim() },
        });
      }
      setEditing(false);
      load();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  }

  async function resendPending() {
    if (!p?.pendingEmail) return;
    setPendingBusy(true);
    try {
      await api("/auth/email-change/request", {
        method: "POST",
        body: { email: p.pendingEmail },
      });
    } catch {
      // best-effort — banner tetap tampil, user bisa coba lagi
    } finally {
      setPendingBusy(false);
    }
  }

  async function cancelPending() {
    setPendingBusy(true);
    try {
      await api("/auth/email-change/cancel", { method: "POST" });
      load();
    } catch {
      // best-effort
    } finally {
      setPendingBusy(false);
    }
  }

  return (
    <CustomerShell showHeader={false} showBottomNav={false} topbarRight={null}>
      <div className="bg-polks-brand px-5 pb-7 pt-4">
        <button
          type="button"
          onClick={() => router.push("/profile")}
          aria-label="Kembali"
          className="mb-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors active:bg-white/20"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-[22px] font-bold tracking-[-0.02em] text-white">Informasi Akun</h1>
        <p className="mt-1 text-[13px] text-white/50">Detail data membership kamu.</p>
      </div>

      <div className="bg-polks-brand leading-none">
        <svg viewBox="0 0 390 28" preserveAspectRatio="none" className="block h-7 w-full">
          <path d="M0,0 Q195,28 390,0 L390,28 L0,28 Z" fill="#F6F8FA" />
        </svg>
      </div>

      <div className="bg-polks-bg px-5 pb-10">
        {loading ? (
          <div className="relative mt-1 overflow-hidden rounded-2xl border border-polks-border bg-polks-card p-4">
            <div className="skeleton mx-auto mb-4 h-4 w-32 rounded" />
            <div className="skeleton mb-2 h-3 w-full rounded" />
            <div className="skeleton mb-2 h-3 w-full rounded" />
            <div className="skeleton mb-4 h-3 w-full rounded" />
            <div className="skeleton mb-2 h-3 w-full rounded" />
            <div className="skeleton h-3 w-full rounded" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-polks-border bg-polks-card p-6 text-center">
            <p className="text-sm text-polks-muted">{error}</p>
            <button
              type="button"
              onClick={load}
              className="rounded-xl bg-polks-brand px-5 py-2.5 text-xs font-bold text-white"
            >
              Coba Lagi
            </button>
          </div>
        ) : p ? (
          <>
            <div className="relative mt-1 rounded-2xl border border-polks-border bg-polks-card px-4 pb-4 pt-5 shadow-[0_1px_0_#E6EAED,0_8px_20px_rgba(23,33,42,0.06)]">
              {/* Perforasi */}
              <div className="absolute inset-x-2.5 -top-1 flex justify-between">
                {Array.from({ length: 12 }).map((_, i) => (
                  <span key={i} className="size-2 rounded-full bg-polks-bg" />
                ))}
              </div>

              {/* Cap tier */}
              <div
                className="absolute right-3.5 top-3.5 flex size-[46px] -rotate-[9deg] flex-col items-center justify-center rounded-full border"
                style={{ borderColor: tierMeta.badgeText, backgroundColor: tierMeta.badgeBg }}
              >
                <span className="mb-0.5 size-1 rounded-full bg-polks-point" />
                <b className="text-[7.5px] font-bold tracking-wide" style={{ color: tierMeta.badgeText }}>
                  {tierMeta.label.toUpperCase()}
                </b>
              </div>

              <p className="text-center text-[17px] font-bold text-polks-text">{p.name}</p>
              <div className="my-3 border-t border-dotted border-polks-border" />

              <div className="mb-1 flex items-center justify-between">
                <span className="text-[8.5px] font-bold tracking-widest text-polks-muted">DATA PRIBADI</span>
                {editing ? (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="text-[9.5px] font-bold text-polks-muted underline underline-offset-2"
                  >
                    Batal
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startEdit}
                    className="text-[9.5px] font-bold text-polks-text underline decoration-polks-point decoration-2 underline-offset-2"
                  >
                    Edit
                  </button>
                )}
              </div>

              <DocketRow label="Nama" icon={User}>
                {editing ? (
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-28 border-b border-polks-point bg-transparent text-right font-mono text-[11px] font-semibold text-polks-text outline-none"
                  />
                ) : (
                  <span className="font-mono text-[11px] font-semibold tabular-nums text-polks-text-soft">
                    {p.name}
                  </span>
                )}
              </DocketRow>

              <DocketRow label="Email" icon={Mail}>
                {editing ? (
                  p.hasPassword ? (
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-36 border-b border-polks-point bg-transparent text-right font-mono text-[11px] font-semibold text-polks-text outline-none"
                    />
                  ) : (
                    <span className="text-right text-[9px] italic text-polks-muted">
                      Akun Google, tidak bisa diubah
                    </span>
                  )
                ) : (
                  <span className="font-mono text-[11px] font-semibold tabular-nums text-polks-text-soft">
                    {p.email}
                  </span>
                )}
              </DocketRow>

              <DocketRow label="No. HP" icon={Phone}>
                {editing ? (
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-28 border-b border-polks-point bg-transparent text-right font-mono text-[11px] font-semibold text-polks-text outline-none"
                  />
                ) : (
                  <span className="font-mono text-[11px] font-semibold tabular-nums text-polks-text-soft">
                    {p.phone || "—"}
                  </span>
                )}
              </DocketRow>

              {saveError ? (
                <p className="mt-1 text-right text-[10.5px] text-polks-error">{saveError}</p>
              ) : null}

              <div className="relative my-4 -mx-4 border-t border-dashed border-polks-border">
                <span className="absolute -left-1.5 -top-1.5 size-3 rounded-full bg-polks-bg" />
                <span className="absolute -right-1.5 -top-1.5 size-3 rounded-full bg-polks-bg" />
              </div>

              <span className="text-[8.5px] font-bold tracking-widest text-polks-muted">DATA TERSIMPAN</span>

              <div className={editing ? "opacity-50" : undefined}>
                <DocketRow label="Member ID" icon={IdCard}>
                  <span className="font-mono text-[11px] font-semibold tabular-nums text-polks-text-soft">
                    {p.memberCode}
                  </span>
                </DocketRow>
                <DocketRow label="Bergabung" icon={Calendar}>
                  <span className="font-mono text-[11px] font-semibold tabular-nums text-polks-text-soft">
                    {formatJoined(p.createdAt)}
                  </span>
                </DocketRow>
              </div>

              {editing ? (
                <button
                  type="button"
                  onClick={onSave}
                  disabled={saving}
                  className="mt-4 w-full rounded-xl bg-polks-brand py-3 text-[12px] font-bold text-white disabled:opacity-60"
                >
                  {saving ? "Menyimpan…" : "Simpan Perubahan"}
                </button>
              ) : null}
            </div>

            {!editing && p.pendingEmail ? (
              <div className="mt-3 rounded-2xl border border-dashed border-polks-border bg-polks-card p-4">
                <p className="text-[12px] leading-relaxed text-polks-text-soft">
                  Perubahan email ke <b>{p.pendingEmail}</b> menunggu konfirmasi — cek inbox.
                </p>
                <div className="mt-2 flex gap-4">
                  <button
                    type="button"
                    disabled={pendingBusy}
                    onClick={resendPending}
                    className="text-[11px] font-bold text-polks-text underline decoration-polks-point decoration-2 underline-offset-2 disabled:opacity-60"
                  >
                    Kirim ulang
                  </button>
                  <button
                    type="button"
                    disabled={pendingBusy}
                    onClick={cancelPending}
                    className="text-[11px] font-bold text-polks-muted underline underline-offset-2 disabled:opacity-60"
                  >
                    Batalkan
                  </button>
                </div>
              </div>
            ) : null}

            {!editing && !p.pendingEmail && !p.emailVerified ? (
              <div className="mt-3 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-amber-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-amber-800">Email belum diverifikasi</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-amber-700">
                    Verifikasi email untuk mengamankan akun kamu.
                  </p>
                  <button
                    type="button"
                    disabled={sendingVerif || verifSent}
                    onClick={async () => {
                      setSendingVerif(true);
                      try {
                        await api("/auth/verify-email/send", { method: "POST" });
                        setVerifSent(true);
                      } catch {
                        // best-effort
                      } finally {
                        setSendingVerif(false);
                      }
                    }}
                    className="mt-2 text-[12px] font-bold text-amber-800 underline underline-offset-2 disabled:opacity-60"
                  >
                    {verifSent ? "Email terkirim — cek inbox kamu" : sendingVerif ? "Mengirim…" : "Kirim email verifikasi"}
                  </button>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </CustomerShell>
  );
}
