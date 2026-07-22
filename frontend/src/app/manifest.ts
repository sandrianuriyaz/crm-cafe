import type { MetadataRoute } from "next";

// Manifest PWA. Next.js otomatis menyajikannya di /manifest.webmanifest dan
// menyisipkan <link rel="manifest"> ke setiap halaman — tidak perlu tag manual.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "POLKS Group — Member",
    short_name: "POLKS",
    description: "Loyalty, promo, dan reward untuk member POLKS Group.",
    // Dibuka sebagai aplikasi penuh (tanpa address bar) setelah di-install.
    display: "standalone",
    // Seluruh UI member didesain sebagai layar ponsel (lihat .polks-phone).
    orientation: "portrait",
    start_url: "/",
    scope: "/",
    id: "/",
    lang: "id",
    // Sama dengan viewport.themeColor di layout.tsx — mewarnai status bar.
    theme_color: "#25343F",
    background_color: "#25343F",
    categories: ["food", "lifestyle", "shopping"],
    icons: [
      { src: "/polks/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/polks/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Android memotong ikon jadi bentuk bulat/squircle. Versi maskable punya
      // logo lebih kecil supaya tetap utuh di dalam safe zone.
      {
        src: "/polks/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
