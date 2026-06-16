"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { readWaSession, clearWaSession } from "@/lib/wa-session";
import type { AuthUser } from "@/lib/auth";

type Phase = "loading" | "waiting" | "success" | "error";

function errMsg(status: string): string {
  if (status === "expired") return "Link login kedaluwarsa. Silakan ulangi.";
  if (status === "consumed") return "Link sudah dipakai. Kalau belum masuk, ulangi.";
  return "Link tidak valid. Silakan ulangi.";
}

export default function WaLoginPage() {
  const router = useRouter();
  const { loginWithWaToken } = useAuth();
  const [phase, setPhase] = useState<Phase>("loading");
  const [waUrl, setWaUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setInterval> | null = null;
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };

    const finish = (user: AuthUser | undefined) => {
      clearWaSession();
      if (!active) return;
      setPhase("success");
      router.replace(user?.name?.trim() ? "/dashboard" : "/complete-profile");
    };
    const fail = (msg: string) => {
      if (!active) return;
      stop();
      setPhase("error");
      setMessage(msg);
    };

    // Balas true bila proses selesai (sukses/gagal final), false bila masih pending.
    const tryExchange = async (token: string): Promise<boolean> => {
      const res = await loginWithWaToken(token);
      if (res.status === "ok") {
        stop();
        finish(res.user);
        return true;
      }
      if (res.status !== "pending") {
        fail(errMsg(res.status));
        return true;
      }
      return false;
    };

    const startPolling = (token: string) => {
      if (active) setPhase("waiting");
      const started = Date.now();
      timer = setInterval(async () => {
        if (Date.now() - started > 15 * 60 * 1000) {
          fail("Waktu tunggu habis. Silakan ulangi.");
          return;
        }
        try {
          await tryExchange(token);
        } catch {
          /* jaringan goyah — biarkan polling berikutnya mencoba lagi */
        }
      }, 3000);
    };

    const linkToken = new URLSearchParams(window.location.search).get("r");
    if (linkToken) {
      // Jalur klik link dari WhatsApp.
      setPhase("loading");
      tryExchange(linkToken)
        .then((done) => {
          if (!done && active) startPolling(linkToken);
        })
        .catch(() => fail("Terjadi kesalahan. Silakan ulangi."));
    } else {
      // Jalur tombol WhatsApp: token dari sessionStorage → polling.
      const session = readWaSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      setWaUrl(session.waUrl);
      startPolling(session.token);
    }

    return () => {
      active = false;
      stop();
    };
  }, [router, loginWithWaToken]);

  return (
    <main className="flex min-h-screen justify-center bg-white font-body text-polks-text md:bg-transparent">
      <div className="polks-phone flex min-h-screen w-full flex-col items-center bg-white px-6 pt-16">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-polks-brand">
          <Image
            src="/polks/icon.png"
            alt="POLKS"
            width={32}
            height={32}
            className="size-8 object-contain brightness-0 invert"
          />
        </div>

        {(phase === "loading" || phase === "waiting") && (
          <div className="mt-8 flex flex-col items-center text-center">
            <h1 className="text-[22px] font-bold tracking-[-0.02em] text-polks-text">
              Menunggu konfirmasi WhatsApp
            </h1>
            <p className="mt-2 max-w-[280px] text-[13px] leading-relaxed text-polks-muted">
              Buka WhatsApp lalu <strong>kirim pesan</strong> yang sudah disiapkan.
              Setelah itu kamu akan masuk otomatis di halaman ini.
            </p>

            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] text-[15px] font-bold text-white shadow-[0_4px_16px_rgba(37,211,102,0.35)]"
              >
                <MessageCircle size={20} />
                Buka WhatsApp
              </a>
            )}

            <div className="mt-6 flex items-center gap-2 text-[13px] text-polks-muted">
              <Loader2 size={16} className="animate-spin" />
              Menunggu…
            </div>
          </div>
        )}

        {phase === "success" && (
          <div className="mt-8 flex flex-col items-center text-center">
            <CheckCircle2 size={40} className="text-polks-success" />
            <h1 className="mt-4 text-[22px] font-bold text-polks-text">Berhasil!</h1>
            <p className="mt-2 text-[13px] text-polks-muted">Mengalihkan…</p>
          </div>
        )}

        {phase === "error" && (
          <div className="mt-8 flex w-full flex-col items-center text-center">
            <AlertCircle size={40} className="text-red-500" />
            <h1 className="mt-4 text-[22px] font-bold text-polks-text">
              Gagal masuk
            </h1>
            <p className="mt-2 max-w-[280px] text-[13px] leading-relaxed text-polks-muted">
              {message}
            </p>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="mt-6 flex h-[50px] w-full items-center justify-center rounded-[14px] bg-polks-brand text-sm font-bold text-white"
            >
              Coba lagi
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
