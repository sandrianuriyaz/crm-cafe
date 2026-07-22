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
import { PointsEarnedOverlay } from "@/components/customer/points-earned-overlay";

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

// ── Toast ringan untuk feedback realtime ────────────────────────────────────
type Tone = "point" | "tier" | "notif";
type Toast = { id: number; title: string; body: string; tone: Tone };

type RealtimeContextValue = {
  // Jumlah notifikasi belum dibaca — untuk badge bell.
  unreadCount: number;
  // Naik tiap ada notifikasi baru; halaman inbox memakainya untuk refetch.
  notificationNonce: number;
  // Dipanggil saat inbox dibuka (semua ditandai dibaca) → reset badge.
  markAllNotificationsRead: () => void;
};

const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user, refreshProfile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationNonce, setNotificationNonce] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);
  const toastSeq = useRef(0);

  const pushToast = useCallback((t: Omit<Toast, "id">) => {
    const id = ++toastSeq.current;
    setToasts((prev) => [...prev, { ...t, id }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 4500);
  }, []);

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
        setPointsEarned(p.pointsDelta);
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
      value={{ unreadCount, notificationNonce, markAllNotificationsRead }}
    >
      {children}
      <ToastStack toasts={toasts} />
      {pointsEarned !== null && (
        <PointsEarnedOverlay amount={pointsEarned} onClose={() => setPointsEarned(null)} />
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
