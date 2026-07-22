"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Share, Plus, X } from "lucide-react";
import { useAuth } from "@/lib/auth";

// Chrome/Edge menembakkan event ini alih-alih menampilkan prompt install
// sendiri, asal kita panggil preventDefault(). Belum ada di lib.dom bawaan
// TypeScript, jadi bentuknya dideklarasikan di sini.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "polks-install-dismissed";
// Ditolak sekali bukan berarti tidak mau selamanya — tanya lagi setelah 2 minggu.
const DISMISS_DAYS = 14;
// Beri jeda supaya banner tidak menimpa splash screen (SplashGate ~2.1 detik).
const SHOW_DELAY_MS = 3000;

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari iOS tidak mendukung display-mode; pakai flag miliknya sendiri.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIosSafari(): boolean {
  const ua = window.navigator.userAgent;
  const ios =
    /iphone|ipad|ipod/i.test(ua) ||
    // iPadOS 13+ menyamar sebagai desktop Safari.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  // Chrome/Firefox/Edge di iOS tetap memakai WebKit tapi tidak bisa
  // "Add to Home Screen" — hanya Safari yang punya menunya.
  const safari = /safari/i.test(ua) && !/crios|fxios|edgios|opios/i.test(ua);
  return ios && safari;
}

function recentlyDismissed(): boolean {
  const raw = window.localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const at = Number(raw);
  if (!Number.isFinite(at)) return false;
  return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

export function InstallPrompt() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<"android" | "ios" | null>(null);
  const [iosSheet, setIosSheet] = useState(false);

  // Panel admin dipakai staf di perangkat toko — mereka tidak perlu install.
  const eligible = Boolean(user) && !pathname.startsWith("/admin");

  useEffect(() => {
    if (!eligible) return;
    if (isStandalone() || recentlyDismissed()) return;

    const onBeforeInstall = (event: Event) => {
      // Tahan prompt bawaan browser supaya bisa dimunculkan lewat tombol kita,
      // pada saat yang lebih masuk akal buat pengguna.
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setMode("android");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // Safari tidak punya beforeinstallprompt sama sekali, jadi banner iOS
    // dimunculkan berdasarkan deteksi browser.
    const timer = isIosSafari()
      ? window.setTimeout(() => setMode("ios"), SHOW_DELAY_MS)
      : undefined;

    const onInstalled = () => setMode(null);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      if (timer) window.clearTimeout(timer);
    };
  }, [eligible]);

  const dismiss = useCallback(() => {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setMode(null);
    setIosSheet(false);
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    // Prompt yang sudah dipakai tidak bisa dipakai ulang, apa pun hasilnya.
    setDeferred(null);
    setMode(null);
    if (outcome === "dismissed") {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }
  }, [deferred]);

  if (!eligible || mode === null) return null;

  return (
    <>
      {/* Duduk tepat di atas CustomerBottomNav (h-16 / 64px), dengan z lebih
          rendah supaya navigasi tetap bisa ditekan. */}
      <div className="fixed inset-x-0 bottom-[72px] z-40 px-4">
        <div className="mx-auto flex w-full max-w-[398px] items-center gap-3 rounded-2xl border border-polks-border bg-polks-card px-3 py-2.5 shadow-[0_8px_24px_rgba(23,33,42,0.16)]">
          <Image
            src="/polks/icon-192.png"
            alt=""
            width={36}
            height={36}
            className="size-9 shrink-0 rounded-[10px] object-contain"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold leading-tight text-polks-text">
              Pasang aplikasi POLKS
            </p>
            <p className="mt-0.5 text-[11px] leading-tight text-polks-muted">
              Buka kartu member langsung dari layar utama.
            </p>
          </div>
          <button
            type="button"
            onClick={mode === "ios" ? () => setIosSheet(true) : install}
            className="shrink-0 rounded-full bg-polks-brand px-3.5 py-2 text-[12px] font-bold text-white"
          >
            {mode === "ios" ? "Caranya" : "Pasang"}
          </button>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Tutup"
            className="shrink-0 p-1 text-polks-muted"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {iosSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(23,33,42,0.6)] backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIosSheet(false);
          }}
        >
          <div className="flex w-full max-w-[430px] flex-col rounded-t-3xl bg-polks-card px-5 pb-9 pt-5">
            <div className="mb-5 flex justify-center">
              <div className="h-1 w-9 rounded-full bg-polks-border" />
            </div>

            <div className="mb-5 flex items-start justify-between">
              <Image
                src="/polks/icon.png"
                alt="POLKS"
                width={28}
                height={28}
                className="size-7 object-contain"
              />
              <button
                type="button"
                onClick={() => setIosSheet(false)}
                aria-label="Tutup"
                className="p-1 text-polks-muted"
              >
                <X size={20} />
              </button>
            </div>

            <h2 className="mb-2 text-[22px] font-bold leading-tight tracking-[-0.01em] text-polks-text">
              Pasang di iPhone
            </h2>
            <p className="mb-5 text-[13px] leading-relaxed text-polks-muted">
              Safari tidak bisa memasang sendiri, jadi butuh dua ketukan lewat
              menu Bagikan.
            </p>

            <div className="mb-6 flex flex-col gap-2">
              <div className="flex items-center gap-3 rounded-xl bg-polks-bg px-3 py-3">
                <Share size={16} className="shrink-0 text-polks-brand" strokeWidth={2} />
                <span className="text-xs font-medium text-polks-text">
                  Ketuk ikon <b>Bagikan</b> di bawah layar Safari
                </span>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-polks-bg px-3 py-3">
                <Plus size={16} className="shrink-0 text-polks-brand" strokeWidth={2} />
                <span className="text-xs font-medium text-polks-text">
                  Pilih <b>Tambahkan ke Layar Utama</b>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={dismiss}
              className="h-[50px] rounded-[14px] bg-polks-brand text-sm font-bold text-white"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
