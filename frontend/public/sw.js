/* eslint-disable no-restricted-globals */
// Service worker POLKS Member.
//
// Aturan utama: HANYA request same-origin GET yang disentuh. Data member
// (saldo poin, riwayat transaksi, kartu member) datang dari backend NestJS di
// origin lain (NEXT_PUBLIC_API_URL), jadi secara desain tidak pernah masuk
// Cache API — penting, karena Cache API persisten di disk dan responsnya
// membawa data pribadi. Guard /api di bawah menjaga hal ini tetap benar
// seandainya suatu saat backend dipasang di origin yang sama.
//
// Naikkan CACHE_VERSION setiap kali daftar PRECACHE atau strategi berubah,
// supaya cache lama dibuang saat aktivasi.
const CACHE_VERSION = "v2";
const SHELL_CACHE = `polks-shell-${CACHE_VERSION}`;
const ASSET_CACHE = `polks-asset-${CACHE_VERSION}`;
const PAGE_CACHE = `polks-page-${CACHE_VERSION}`;

const OFFLINE_URL = "/offline";

// Minimum agar layar offline tetap tampil utuh tanpa jaringan.
const PRECACHE = [
  OFFLINE_URL,
  "/polks/icon.png",
  "/polks/logo.png",
  "/polks/icon-192.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      // addAll gagal total kalau satu URL meleset; add satu per satu supaya
      // satu aset hilang tidak membatalkan seluruh instalasi.
      .then((cache) => Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => null)))),
  );
});

self.addEventListener("activate", (event) => {
  const keep = [SHELL_CACHE, ASSET_CACHE, PAGE_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(names.filter((n) => !keep.includes(n)).map((n) => caches.delete(n))),
      )
      .then(() => self.clients.claim()),
  );
});

// Aset build Next.js (/_next/static/**) namanya sudah mengandung hash isi, jadi
// aman di-cache selamanya: isi berubah => URL berubah.
function isImmutableAsset(url) {
  return url.pathname.startsWith("/_next/static/");
}

// Gambar & font milik kita: boleh basi sebentar, yang penting cepat.
function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/polks/") ||
    /\.(png|jpe?g|svg|gif|webp|avif|ico|woff2?)$/i.test(url.pathname)
  );
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

// Tampilkan cache dulu, perbarui di latar belakang.
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || network.then((r) => r || Response.error());
}

// Halaman: selalu coba jaringan dulu supaya konten tidak basi; cache hanya
// jaring pengaman saat offline.
async function networkFirstPage(request) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    const offline = await caches.match(OFFLINE_URL);
    if (offline) return offline;
    return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Cross-origin (termasuk seluruh panggilan ke backend) dibiarkan apa adanya.
  if (url.origin !== self.location.origin) return;

  // Jangan pernah cache endpoint data, walau kelak satu origin.
  if (url.pathname.startsWith("/api")) return;

  // Panel admin dipakai staf di jaringan toko dan datanya operasional —
  // biarkan selalu langsung ke jaringan, tanpa salinan offline.
  if (url.pathname.startsWith("/admin")) return;

  if (isImmutableAsset(url)) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(staleWhileRevalidate(request, ASSET_CACHE));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
  }
});

// ── Web Push ────────────────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  // Payload dikirim PushService sebagai JSON. Kalau gagal diurai, tetap
  // tampilkan sesuatu — notifikasi kosong lebih buruk daripada teks generik,
  // dan di Chrome push yang tidak menampilkan notifikasi apa pun bisa membuat
  // izin push dicabut otomatis.
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  const title = payload.title || "POLKS";
  const options = {
    body: payload.message || "",
    icon: "/polks/icon-192.png",
    badge: "/polks/badge-96.png",
    image: payload.imageUrl || undefined,
    // Notifikasi dari kategori sama saling menimpa alih-alih menumpuk.
    tag: payload.tag || "polks-notification",
    data: { url: payload.url || "/inbox" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/inbox", self.location.origin);

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // Kalau app sudah terbuka, arahkan tab itu — jangan buka jendela kedua.
        for (const client of clients) {
          if (new URL(client.url).origin !== target.origin) continue;
          return client.focus().then((focused) =>
            focused.navigate ? focused.navigate(target.href) : focused,
          );
        }
        return self.clients.openWindow(target.href);
      }),
  );
});
