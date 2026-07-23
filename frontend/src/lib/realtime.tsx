"use client";

// Koneksi WebSocket (Socket.IO) global ke backend untuk update realtime tanpa
// refresh: status voucher saat di-scan kasir, saldo poin & tier saat transaksi
// / penyesuaian admin, dan notifikasi/inbox baru.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import { Star, PartyPopper, Bell } from "lucide-react";
import { api, getToken } from "./api";
import { useAuth } from "./auth";
import { TIER_META, type Tier } from "./loyalty/tier";
import { cn } from "./utils";
import { CelebrationOverlay } from "@/components/customer/celebration-overlay";

// Socket.IO listen di root server, bukan di bawah prefix REST (/api/v1).
function socketBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";
  try {
    return new URL(raw).origin;
  } catch {
    return "http://localhost:3000";
  }
}

// Buka koneksi tersautentikasi (token JWT dikirim di handshake auth).
// Kembalikan null bila belum login. Pemanggil wajib socket.disconnect() saat
// unmount.
export function connectRealtime(): Socket | null {
  const token = getToken();
  if (!token) return null;

  return io(socketBaseUrl(), {
    auth: { token },
    transports: ["websocket"],
  });
}

// ── Payload event (samakan dengan RealtimeGateway backend) ──────────────────
type PointsChanged = {
  pointBalance: number;
  pointsDelta: number;
  source: "transaction" | "adjustment";
};
type TierUp = { from: Tier; to: Tier };
type NotificationNew = { title: string; message: string; createdAt: string };
// Status voucher berubah — dipush saat kasir POS men-scan & memakainya.
type VoucherUpdated = {
  id?: string;
  status?: string;
  reward?: { name?: string | null } | null;
};

// ── Toast ringan untuk feedback realtime ────────────────────────────────────
type Tone = "point" | "tier" | "notif";
type Toast = { id: number; title: string; body: string; tone: Tone };

// ── Perayaan full-screen ────────────────────────────────────────────────────
// Momen yang layak "dirayakan" (poin masuk, voucher terpakai) memakai overlay
// satu layar penuh, bukan toast. Satu transaksi di kasir bisa memicu keduanya,
// jadi bentuknya satu wadah yang menampung dua-duanya sekaligus — bukan antrean
// dua overlay berurutan.
type Celebration = {
  id: number;
  points: number;
  voucherNames: string[];
};

// Lama menahan event pertama sambil menunggu pasangannya. Cukup panjang untuk
// menampung jeda pemrosesan webhook (terukur ~4,8 dtk), masih terasa langsung
// bagi member yang baru selesai membayar di kasir.
const CELEBRATION_COLLECT_MS = 6000;

type RealtimeContextValue = {
  // Jumlah notifikasi belum dibaca — untuk badge bell.
  unreadCount: number;
  // Naik tiap ada notifikasi baru; halaman inbox memakainya untuk refetch.
  notificationNonce: number;
  // Naik tiap status voucher berubah; halaman yang menampilkan daftar voucher
  // memakainya untuk refetch (dashboard, riwayat penukaran).
  voucherNonce: number;
  // Dipanggil saat inbox dibuka (semua ditandai dibaca) → reset badge.
  markAllNotificationsRead: () => void;
};

const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user, refreshProfile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationNonce, setNotificationNonce] = useState(0);
  const [voucherNonce, setVoucherNonce] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const toastSeq = useRef(0);
  const celebrationSeq = useRef(0);

  const pushToast = useCallback((t: Omit<Toast, "id">) => {
    const id = ++toastSeq.current;
    setToasts((prev) => [...prev, { ...t, id }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 4500);
  }, []);

  // Gabung, jangan antre: satu transaksi di kasir menerbitkan voucher:updated
  // dan points:changed. Kalau masing-masing dapat overlay sendiri, layar
  // tertutup dua kali berturut-turut — ketukan pertama seolah tak berefek
  // karena langsung muncul overlay kedua.
  //
  // Keduanya TIDAK datang bersamaan: redeem voucher hanya satu update, sedangkan
  // webhook transaksi menjalankan banyak query sebelum memancarkan poin. Terukur
  // ~4,8 detik berjarak di lingkungan uji — lebih lama dari umur overlay itu
  // sendiri. Jadi jangan mengandalkan "kebetulan tampil bersamaan": tahan
  // sebentar untuk mengumpulkan pasangannya dulu, baru tampilkan sekali.
  const pendingRef = useRef<{ points: number; voucherNames: string[] } | null>(null);
  const flushTimerRef = useRef<number | null>(null);
  const shownRef = useRef(false);

  const flushCelebration = useCallback(() => {
    if (flushTimerRef.current !== null) {
      window.clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    const buf = pendingRef.current;
    pendingRef.current = null;
    if (!buf) return;

    setCelebration((cur) =>
      cur
        ? {
            ...cur,
            points: cur.points + buf.points,
            voucherNames: [...cur.voucherNames, ...buf.voucherNames],
          }
        : { id: ++celebrationSeq.current, points: buf.points, voucherNames: buf.voucherNames },
    );
  }, []);

  const collectCelebration = useCallback(
    (part: { points?: number; voucherName?: string }) => {
      const buf = pendingRef.current ?? { points: 0, voucherNames: [] };
      if (part.points) buf.points += part.points;
      if (part.voucherName) buf.voucherNames.push(part.voucherName);
      pendingRef.current = buf;

      // Tampilkan segera bila tidak ada gunanya menunggu lagi: dua-duanya sudah
      // terkumpul, atau perayaan memang sudah tampil di layar.
      if ((buf.points > 0 && buf.voucherNames.length > 0) || shownRef.current) {
        flushCelebration();
        return;
      }
      if (flushTimerRef.current === null) {
        flushTimerRef.current = window.setTimeout(flushCelebration, CELEBRATION_COLLECT_MS);
      }
    },
    [flushCelebration],
  );

  // Jangan tinggalkan timer menggantung saat provider dilepas.
  useEffect(() => {
    shownRef.current = celebration !== null;
  }, [celebration]);
  useEffect(
    () => () => {
      if (flushTimerRef.current !== null) window.clearTimeout(flushTimerRef.current);
    },
    [],
  );

  const dismissCelebration = useCallback(() => setCelebration(null), []);

  const markAllNotificationsRead = useCallback(() => setUnreadCount(0), []);

  // Seed unread + buka socket saat user terautentikasi. Reconnect saat user
  // berganti (login/logout).
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    let alive = true;
    api<{ count: number }>("/member/notifications/unread-count")
      .then((r) => alive && setUnreadCount(r.count))
      .catch(() => {});

    const socket = connectRealtime();
    if (!socket) return;

    // Socket.IO tidak pernah mengirim ulang event yang terbit saat klien
    // sedang putus. Tiap kali sambungan (kembali) terbentuk, tarik profil
    // sekali — perubahan saldo/tier yang terlewat selama offline langsung
    // terkoreksi tanpa menunggu event berikutnya.
    socket.on("connect", () => {
      void refreshProfile();
    });

    socket.on("points:changed", (p: PointsChanged) => {
      // Tarik ulang profil → saldo & tier sinkron di semua halaman.
      void refreshProfile();
      if (p.pointsDelta <= 0) return;

      if (p.source === "transaction") {
        // Poin dari transaksi POS → overlay full-screen (gaya coin Gopay),
        // bukan toast kecil, karena ini momen yang mau "dirayakan".
        collectCelebration({ points: p.pointsDelta });
      } else {
        // Penyesuaian admin → tetap toast biasa, tidak perlu overlay besar.
        pushToast({
          tone: "point",
          title: `+${p.pointsDelta.toLocaleString("id-ID")} poin`,
          body: "Saldo poinmu diperbarui.",
        });
      }
    });

    socket.on("tier:up", (t: TierUp) => {
      void refreshProfile();
      pushToast({
        tone: "tier",
        title: `Selamat, naik ke ${TIER_META[t.to]?.label ?? t.to}!`,
        body: "Tier-mu naik — nikmati benefit barunya.",
      });
    });

    // Kasir men-scan voucher di kasir. Ditangani di provider (bukan per
    // halaman) supaya konfirmasinya sampai di mana pun member sedang berada —
    // sebelumnya hanya /redeem-history yang mendengarkan, jadi voucher yang
    // sudah dipakai tetap tampil aktif di dashboard sampai halaman di-refresh.
    socket.on("voucher:updated", (v: VoucherUpdated) => {
      setVoucherNonce((n) => n + 1);
      // Status selain ACTIVE = voucher terpakai/hangus. Hanya momen "terpakai"
      // yang layak dirayakan; perubahan lain cukup memicu refetch senyap.
      if (v?.status !== "USED") return;
      collectCelebration({ voucherName: v.reward?.name ?? "Reward" });
    });

    socket.on("notification:new", (n: NotificationNew) => {
      setUnreadCount((c) => c + 1);
      setNotificationNonce((v) => v + 1);
      pushToast({ tone: "notif", title: n.title, body: n.message });
    });

    return () => {
      alive = false;
      socket.disconnect();
    };
    // user?.id sebagai kunci sesi; refreshProfile & pushToast stabil.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Sinkron ulang saat app kembali terlihat. Di kasir, member menunjukkan QR
  // lalu menaruh/mengunci HP — browser mobile membekukan WebSocket, jadi
  // kenaikan poin yang terbit saat kasir menyelesaikan transaksi jatuh ke room
  // yang sedang kosong dan hilang permanen. Tanpa penarikan ulang ini, saldo di
  // home tetap angka lama sampai halaman di-refresh manual.
  useEffect(() => {
    if (!user) return;

    const sync = () => {
      if (document.visibilityState === "visible") void refreshProfile();
    };
    document.addEventListener("visibilitychange", sync);
    // Sebagian browser desktop tidak mengubah visibilityState saat pindah
    // jendela; "focus" menutup celah itu.
    window.addEventListener("focus", sync);

    return () => {
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("focus", sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <RealtimeContext.Provider
      value={{ unreadCount, notificationNonce, voucherNonce, markAllNotificationsRead }}
    >
      {children}
      <ToastStack toasts={toasts} />
      {/* key={id} = identitas perayaan, bukan isinya: peleburan event susulan
          tidak me-remount overlay (animasinya tidak mengulang dari nol), tapi
          timer tutup-otomatisnya tetap di-reset lewat dependency isi. */}
      {celebration && (
        <CelebrationOverlay
          key={celebration.id}
          points={celebration.points}
          voucherNames={celebration.voucherNames}
          onClose={dismissCelebration}
        />
      )}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error("useRealtime harus di dalam <RealtimeProvider>");
  return ctx;
}

// ── UI toast ────────────────────────────────────────────────────────────────
// Tone "point" dibuat lebih menonjol (icon lebih besar + aksen gold) —
// mirip notifikasi penambahan poin di Gopay — tone lain tetap netral.
const TONE_STYLE = {
  point: {
    icon: <Star size={20} color="#B9862E" fill="#F6B84B" />,
    card: "border-[rgba(246,184,75,0.35)] bg-polks-point-soft/40",
    iconBg: "size-11 bg-polks-point-soft",
  },
  tier: {
    icon: <PartyPopper size={18} color="#9B7BE8" />,
    card: "border-polks-border bg-polks-card",
    iconBg: "size-9 bg-polks-surface",
  },
  notif: {
    icon: <Bell size={18} color="#25343F" />,
    card: "border-polks-border bg-polks-card",
    iconBg: "size-9 bg-polks-surface",
  },
} as const;

function ToastStack({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => {
        const style = TONE_STYLE[t.tone];
        return (
          <div
            key={t.id}
            className={cn(
              "toast-in pointer-events-auto flex w-full max-w-[360px] items-start gap-3 rounded-2xl border p-3.5 shadow-lg",
              style.card,
            )}
          >
            <div className={cn("mt-0.5 flex shrink-0 items-center justify-center rounded-xl", style.iconBg)}>
              {style.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "truncate font-bold text-polks-text",
                  t.tone === "point" ? "text-[14px]" : "text-[13px]",
                )}
              >
                {t.title}
              </p>
              <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-polks-muted">
                {t.body}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
