"use client";

import { useEffect } from "react";

// Mendaftarkan /sw.js. Hanya di production: di `next dev` aset tidak ber-hash
// dan sering berubah, service worker justru menyajikan versi basi.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    // Tunggu load supaya pendaftaran tidak berebut bandwidth dengan render awal.
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Service worker gagal didaftarkan:", err);
      });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
