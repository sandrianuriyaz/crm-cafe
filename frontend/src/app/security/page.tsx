"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck, ShieldAlert, Mail, LogOut, X } from "lucide-react";
import { CustomerShell } from "@/components/layout/customer-shell";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type SetupData = { qrCode: string; secret: string; otpauthUrl: string };
// null = sedang muat; lalu boolean status aktif/tidak.
type TwoFaStatus = boolean | null;
// Panel verifikasi kode: untuk mengaktifkan setelah scan, atau menonaktifkan.
type CodeMode = "enable" | "disable" | null;

export default function SecurityPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [enabled, setEnabled] = useState<TwoFaStatus>(null);
  const [setup, setSetup] = useState<SetupData | null>(null);
  const [codeMode, setCodeMode] = useState<CodeMode>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api<{ enabled: boolean }>("/auth/2fa/status")
      .then((d) => alive && setEnabled(d.enabled))
      .catch(() => alive && setEnabled(false));
    return () => {
      alive = false;
    };
  }, []);

  function resetPanels() {
    setSetup(null);
    setCodeMode(null);
    setCode("");
    setError(null);
  }

  async function startSetup() {
    setBusy(true);
    setError(null);
    try {
      const data = await api<SetupData>("/auth/2fa/setup", { method: "POST" });
      setSetup(data);
      setCodeMode("enable");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memulai setup");
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    if (!codeMode) return;
    setBusy(true);
    setError(null);
    const path = codeMode === "enable" ? "/auth/2fa/enable" : "/auth/2fa/disable";
    try {
      const res = await api<{ enabled: boolean }>(path, {
        method: "POST",
        body: { code: code.replace(/\s/g, "") },
      });
      setEnabled(res.enabled);
      resetPanels();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kode salah");
    } finally {
      setBusy(false);
    }
  }

  return (
    <CustomerShell showHeader={false} showBottomNav={false} topbarRight={null}>
      <div className="bg-polks-brand px-5 pb-7 pt-4">
        <button
          type="button"
          onClick={() => router.push("/profile")}
          className="mb-4 flex items-center gap-1.5 text-[13px] font-medium text-white/50"
        >
          <ArrowLeft size={16} />
          Kembali
        </button>
        <h1 className="text-[22px] font-bold tracking-[-0.02em] text-white">Keamanan</h1>
        <p className="mt-1 text-[13px] text-white/50">Pengaturan keamanan akun POLKS kamu.</p>
      </div>

      <div className="bg-polks-brand leading-none">
        <svg viewBox="0 0 390 28" preserveAspectRatio="none" className="block h-7 w-full">
          <path d="M0,0 Q195,28 390,0 L390,28 L0,28 Z" fill="#F6F8FA" />
        </svg>
      </div>

      <div className="flex flex-col gap-4 bg-polks-bg px-5 pb-10">
        {/* Status */}
        <div className="flex items-start gap-3 rounded-2xl border border-[rgba(56,161,105,0.3)] bg-[rgba(56,161,105,0.1)] px-4 py-3.5">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-polks-success" />
          <div>
            <p className="text-[13px] font-bold text-polks-text">Akun terlindungi</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-polks-muted">
              Login pakai email &amp; password atau akun Google. POLKS tidak pernah meminta
              password kamu lewat chat, telepon, atau email.
            </p>
          </div>
        </div>

        {/* Metode login */}
        <div className="overflow-hidden rounded-2xl border border-polks-border bg-white">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-polks-surface">
              <Mail size={16} className="text-polks-brand" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-polks-text">Metode Login</p>
              <p className="truncate text-[11px] text-polks-muted">
                {user?.email ?? "Email & Password"}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-polks-surface px-2.5 py-1 text-[10px] font-bold text-polks-muted">
              Aktif
            </span>
          </div>
        </div>

        {/* Verifikasi 2 Langkah (2FA) */}
        <div className="overflow-hidden rounded-2xl border border-polks-border bg-white">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-polks-surface">
              {enabled ? (
                <ShieldCheck size={16} className="text-polks-success" />
              ) : (
                <ShieldAlert size={16} className="text-polks-brand" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-polks-text">Verifikasi 2 Langkah</p>
              <p className="text-[11px] text-polks-muted">
                Kode dari aplikasi authenticator saat login
              </p>
            </div>
            <span
              className={
                "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold " +
                (enabled
                  ? "bg-[rgba(56,161,105,0.12)] text-polks-success"
                  : "bg-polks-surface text-polks-muted")
              }
            >
              {enabled === null ? "…" : enabled ? "Aktif" : "Nonaktif"}
            </span>
          </div>

          {/* Aksi: aktifkan / nonaktifkan */}
          {enabled !== null && !setup && codeMode === null ? (
            <div className="border-t border-polks-surface px-4 py-3">
              {enabled ? (
                <button
                  type="button"
                  onClick={() => {
                    setCodeMode("disable");
                    setError(null);
                  }}
                  className="text-[13px] font-bold text-polks-error"
                >
                  Nonaktifkan 2FA
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={startSetup}
                  className="text-[13px] font-bold text-polks-brand disabled:opacity-60"
                >
                  {busy ? "Memuat…" : "Aktifkan 2FA"}
                </button>
              )}
            </div>
          ) : null}

          {/* Panel setup: QR + secret */}
          {setup ? (
            <div className="border-t border-polks-surface px-4 py-4">
              <div className="mb-3 flex items-start justify-between gap-2">
                <p className="text-[12px] leading-relaxed text-polks-muted">
                  Scan QR ini di aplikasi authenticator, lalu masukkan 6 digit kode untuk
                  mengaktifkan.
                </p>
                <button
                  type="button"
                  aria-label="Batal"
                  onClick={resetPanels}
                  className="shrink-0 text-polks-muted"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={setup.qrCode}
                  alt="QR kode 2FA"
                  className="size-44 rounded-xl border border-polks-border bg-white p-2"
                />
              </div>
              <div className="mt-3 rounded-xl bg-polks-surface px-3 py-2.5 text-center">
                <p className="text-[10px] text-polks-muted">Atau masukkan kode ini manual</p>
                <p className="mt-0.5 select-all break-all font-mono text-[12px] font-bold tracking-wide text-polks-text">
                  {setup.secret}
                </p>
              </div>
            </div>
          ) : null}

          {/* Panel input kode (enable setelah scan / disable) */}
          {codeMode ? (
            <form onSubmit={submitCode} className="border-t border-polks-surface px-4 py-4">
              {codeMode === "disable" && !setup ? (
                <div className="mb-3 flex items-start justify-between gap-2">
                  <p className="text-[12px] leading-relaxed text-polks-muted">
                    Masukkan kode dari authenticator untuk menonaktifkan 2FA.
                  </p>
                  <button
                    type="button"
                    aria-label="Batal"
                    onClick={resetPanels}
                    className="shrink-0 text-polks-muted"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : null}
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••••"
                className="h-14 w-full rounded-2xl border-[1.5px] border-polks-border bg-white text-center text-[22px] font-bold tracking-[0.4em] text-polks-text outline-none transition-colors focus:border-polks-brand"
              />
              {error ? <p className="mt-2 text-[12px] text-polks-error">{error}</p> : null}
              <button
                type="submit"
                disabled={busy || code.length !== 6}
                className={
                  "mt-3 flex h-12 w-full items-center justify-center rounded-2xl text-[14px] font-bold text-white disabled:opacity-60 " +
                  (codeMode === "disable" ? "bg-polks-error" : "bg-polks-brand")
                }
              >
                {busy
                  ? "Memproses…"
                  : codeMode === "disable"
                    ? "Nonaktifkan"
                    : "Verifikasi & Aktifkan"}
              </button>
            </form>
          ) : null}

          {/* Error di luar form (mis. gagal setup) */}
          {error && !codeMode ? (
            <p className="border-t border-polks-surface px-4 py-3 text-[12px] text-polks-error">
              {error}
            </p>
          ) : null}
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={() => {
            logout();
            router.replace("/login");
          }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-[1.5px] border-polks-error bg-white py-4"
        >
          <LogOut size={16} className="text-polks-error" />
          <span className="text-sm font-bold text-polks-error">Keluar dari Akun</span>
        </button>

        <p className="px-1 text-[11px] leading-relaxed text-polks-muted">
          Untuk ubah email, nomor HP, atau reset password, hubungi admin POLKS atau pusat bantuan.
        </p>
      </div>
    </CustomerShell>
  );
}
