"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Mail,
  LogOut,
  X,
  Copy,
  Check,
  Download,
  KeyRound,
} from "lucide-react";
import { CustomerShell } from "@/components/layout/customer-shell";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type SetupData = { qrCode: string; secret: string; otpauthUrl: string };
// null = sedang muat; lalu boolean status aktif/tidak.
type TwoFaStatus = boolean | null;
// Panel verifikasi kode: aktifkan (setelah scan), nonaktifkan, atau buat ulang
// kode pemulihan.
type CodeMode = "enable" | "disable" | "regenerate" | null;

export default function SecurityPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [enabled, setEnabled] = useState<TwoFaStatus>(null);
  const [setup, setSetup] = useState<SetupData | null>(null);
  const [codeMode, setCodeMode] = useState<CodeMode>(null);
  const [code, setCode] = useState("");
  // Mode kode pemulihan untuk disable/regenerate (kalau authenticator hilang).
  const [recoveryMode, setRecoveryMode] = useState(false);
  // Daftar kode pemulihan yang baru dibuat — ditampilkan SEKALI.
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);
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
    setRecoveryMode(false);
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
    const path =
      codeMode === "enable"
        ? "/auth/2fa/enable"
        : codeMode === "disable"
          ? "/auth/2fa/disable"
          : "/auth/2fa/recovery-codes";
    try {
      const res = await api<{ enabled?: boolean; recoveryCodes?: string[] }>(path, {
        method: "POST",
        body: { code: code.replace(/\s/g, "") },
      });
      if (codeMode === "disable") {
        setEnabled(false);
        resetPanels();
      } else {
        // enable atau regenerate → tampilkan kode pemulihan baru
        if (codeMode === "enable") setEnabled(true);
        resetPanels();
        if (res.recoveryCodes) setRecoveryCodes(res.recoveryCodes);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kode salah");
    } finally {
      setBusy(false);
    }
  }

  // Validitas input kode sebelum tombol aktif.
  const codeValid =
    recoveryMode && codeMode !== "enable"
      ? code.replace(/[^a-zA-Z0-9]/g, "").length >= 8
      : code.length === 6;

  async function copyCodes(codes: string[]) {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Diamkan: kalau clipboard ditolak, user masih bisa salin manual/unduh.
    }
  }

  function downloadCodes(codes: string[]) {
    const text =
      "Kode Pemulihan 2FA POLKS\n\n" +
      "Simpan di tempat aman. Tiap kode hanya bisa dipakai sekali.\n\n" +
      codes.join("\n") +
      "\n";
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "polks-recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
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
        <div className="overflow-hidden rounded-2xl border border-polks-border bg-polks-card">
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
        <div className="overflow-hidden rounded-2xl border border-polks-border bg-polks-card">
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

          {/* Aksi: aktifkan / buat ulang kode / nonaktifkan */}
          {enabled !== null && !setup && codeMode === null && !recoveryCodes ? (
            <div className="flex flex-col gap-3 border-t border-polks-surface px-4 py-3">
              {enabled ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setCodeMode("regenerate");
                      setError(null);
                    }}
                    className="text-left text-[13px] font-bold text-polks-brand"
                  >
                    Buat ulang kode pemulihan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCodeMode("disable");
                      setError(null);
                    }}
                    className="text-left text-[13px] font-bold text-polks-error"
                  >
                    Nonaktifkan 2FA
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={startSetup}
                  className="text-left text-[13px] font-bold text-polks-brand disabled:opacity-60"
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
                  className="size-44 rounded-xl border border-polks-border bg-polks-card p-2"
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

          {/* Panel input kode (enable / disable / regenerate) */}
          {codeMode ? (
            <form onSubmit={submitCode} className="border-t border-polks-surface px-4 py-4">
              {codeMode !== "enable" ? (
                <div className="mb-3 flex items-start justify-between gap-2">
                  <p className="text-[12px] leading-relaxed text-polks-muted">
                    {recoveryMode
                      ? "Masukkan salah satu kode pemulihan untuk melanjutkan."
                      : codeMode === "disable"
                        ? "Masukkan kode dari authenticator untuk menonaktifkan 2FA."
                        : "Masukkan kode dari authenticator untuk membuat ulang kode pemulihan."}
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

              {recoveryMode && codeMode !== "enable" ? (
                <input
                  autoComplete="one-time-code"
                  maxLength={11}
                  value={code}
                  onChange={(e) =>
                    setCode(
                      e.target.value.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase().slice(0, 11),
                    )
                  }
                  placeholder="xxxxx-xxxxx"
                  className="h-14 w-full rounded-2xl border-[1.5px] border-polks-border bg-polks-card text-center font-mono text-[18px] font-bold tracking-[0.15em] text-polks-text outline-none transition-colors focus:border-polks-brand"
                />
              ) : (
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="••••••"
                  className="h-14 w-full rounded-2xl border-[1.5px] border-polks-border bg-polks-card text-center text-[22px] font-bold tracking-[0.4em] text-polks-text outline-none transition-colors focus:border-polks-brand"
                />
              )}

              {error ? <p className="mt-2 text-[12px] text-polks-error">{error}</p> : null}

              <button
                type="submit"
                disabled={busy || !codeValid}
                className={
                  "mt-3 flex h-12 w-full items-center justify-center rounded-2xl text-[14px] font-bold text-white disabled:opacity-60 " +
                  (codeMode === "disable" ? "bg-polks-error" : "bg-polks-brand")
                }
              >
                {busy
                  ? "Memproses…"
                  : codeMode === "disable"
                    ? "Nonaktifkan"
                    : codeMode === "regenerate"
                      ? "Buat ulang kode"
                      : "Verifikasi & Aktifkan"}
              </button>

              {codeMode !== "enable" ? (
                <button
                  type="button"
                  onClick={() => {
                    setRecoveryMode((v) => !v);
                    setCode("");
                    setError(null);
                  }}
                  className="mt-3 w-full text-center text-[12px] font-semibold text-polks-brand"
                >
                  {recoveryMode ? "Pakai kode authenticator" : "Pakai kode pemulihan"}
                </button>
              ) : null}
            </form>
          ) : null}

          {/* Error di luar form (mis. gagal setup) */}
          {error && !codeMode ? (
            <p className="border-t border-polks-surface px-4 py-3 text-[12px] text-polks-error">
              {error}
            </p>
          ) : null}
        </div>

        {/* Panel kode pemulihan (tampil sekali setelah enable/regenerate) */}
        {recoveryCodes ? (
          <div className="overflow-hidden rounded-2xl border border-[rgba(246,184,75,0.4)] bg-[rgba(246,184,75,0.08)]">
            <div className="flex items-start gap-3 px-4 py-3.5">
              <KeyRound size={18} className="mt-0.5 shrink-0 text-polks-brand" />
              <div>
                <p className="text-[13px] font-bold text-polks-text">Kode Pemulihan</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-polks-muted">
                  Simpan kode ini di tempat aman. Dipakai untuk masuk kalau authenticator
                  hilang. <span className="font-bold">Hanya ditampilkan sekali</span>, tiap kode
                  sekali pakai.
                </p>
              </div>
            </div>

            <div className="mx-4 grid grid-cols-2 gap-2 rounded-xl bg-polks-card px-3 py-3">
              {recoveryCodes.map((c) => (
                <span
                  key={c}
                  className="select-all text-center font-mono text-[13px] font-bold tracking-wide text-polks-text"
                >
                  {c}
                </span>
              ))}
            </div>

            <div className="flex gap-2 px-4 py-3">
              <button
                type="button"
                onClick={() => copyCodes(recoveryCodes)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-polks-border bg-polks-card py-2.5 text-[12px] font-bold text-polks-text"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-polks-success" /> Tersalin
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Salin
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => downloadCodes(recoveryCodes)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-polks-border bg-polks-card py-2.5 text-[12px] font-bold text-polks-text"
              >
                <Download size={14} /> Unduh
              </button>
            </div>

            <div className="px-4 pb-4">
              <button
                type="button"
                onClick={() => setRecoveryCodes(null)}
                className="flex h-11 w-full items-center justify-center rounded-2xl bg-polks-brand text-[13px] font-bold text-white"
              >
                Saya sudah simpan
              </button>
            </div>
          </div>
        ) : null}

        {/* Logout */}
        <button
          type="button"
          onClick={() => {
            logout();
            router.replace("/login");
          }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-[1.5px] border-polks-error bg-polks-card py-4"
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
