"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

// Kunci VAPID dikirim server dalam base64url; PushManager memintanya sebagai
// Uint8Array biasa.
// Tipe kembalian sengaja dibiarkan terinferensi: `new Uint8Array(n)` menghasilkan
// Uint8Array<ArrayBufferLike> yang tidak diterima applicationServerKey, sedangkan
// membangun dari ArrayBuffer eksplisit menghasilkan Uint8Array<ArrayBuffer>.
function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(normalized);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export type PushState =
  // Browser tidak punya PushManager sama sekali, atau service worker belum
  // terdaftar (mis. `next dev`, di mana pendaftaran memang dimatikan).
  | "unsupported"
  // Izin sudah ditolak permanen — requestPermission() tidak akan bertanya lagi,
  // user harus mengubahnya lewat setelan browser.
  | "denied"
  | "off"
  | "on";

function supported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

async function registration(): Promise<ServiceWorkerRegistration | null> {
  // Sengaja getRegistration(), bukan .ready: .ready menggantung selamanya bila
  // tidak ada service worker yang pernah didaftarkan.
  if (!supported()) return null;
  return (await navigator.serviceWorker.getRegistration()) ?? null;
}

export function usePush() {
  const [state, setState] = useState<PushState>("unsupported");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!supported()) return setState("unsupported");
    const reg = await registration();
    if (!reg) return setState("unsupported");
    if (Notification.permission === "denied") return setState("denied");
    const sub = await reg.pushManager.getSubscription();
    setState(sub ? "on" : "off");
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Mengembalikan true kalau perangkat ini berhasil berlangganan.
  const enable = useCallback(async (): Promise<boolean> => {
    const reg = await registration();
    if (!reg) return false;

    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return false;
      }

      const { publicKey } = await api<{ publicKey: string | null }>(
        "/member/notifications/push/public-key",
      );
      // Server tidak dikonfigurasi VAPID — jangan pura-pura berhasil.
      if (!publicKey) return false;

      // Langganan lama bisa memakai kunci VAPID yang sudah diganti; buang dulu
      // supaya subscribe() tidak gagal dengan InvalidStateError.
      const existing = await reg.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();

      const sub = await reg.pushManager.subscribe({
        // Wajib true: browser menolak langganan yang tidak menampilkan apa pun.
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await api("/member/notifications/push/subscribe", {
        method: "POST",
        body: sub.toJSON(),
      });
      setState("on");
      return true;
    } catch {
      await refresh();
      return false;
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const disable = useCallback(async () => {
    const reg = await registration();
    if (!reg) return;

    setBusy(true);
    try {
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        // Beri tahu server lebih dulu: setelah unsubscribe() lokal, endpoint-nya
        // tidak bisa dibaca lagi dan barisnya akan tertinggal di database.
        await api("/member/notifications/push/unsubscribe", {
          method: "POST",
          body: { endpoint: sub.endpoint },
        }).catch(() => {
          // Server tak terjangkau: tetap lanjut cabut di sisi perangkat. Baris
          // yatim akan dibersihkan sendiri saat pengiriman berikutnya kena 410.
        });
        await sub.unsubscribe();
      }
      setState("off");
    } finally {
      setBusy(false);
    }
  }, []);

  return { state, busy, enable, disable, refresh };
}
