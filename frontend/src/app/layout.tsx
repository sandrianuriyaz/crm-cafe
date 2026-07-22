import type { Metadata, Viewport } from "next";
import "./globals.css";
import { montserrat, nunito } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/lib/auth";
import { RealtimeProvider } from "@/lib/realtime";
import { SplashGate } from "@/components/layout/splash-gate";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";

export const metadata: Metadata = {
  title: "POLKS Group — Member",
  description: "Loyalty, promo, dan reward untuk member POLKS Group.",
  applicationName: "POLKS",
  // Safari mengabaikan manifest untuk hal-hal ini; tanpa appleWebApp, PWA yang
  // di-install di iOS tetap membuka address bar Safari dan pakai ikon buram.
  // statusBarStyle "default" (bukan black-translucent) supaya iOS tetap
  // menyisihkan area status bar. Layout belum pakai env(safe-area-inset-*),
  // jadi konten yang menembus ke bawah notch akan tertutup jam & baterai.
  appleWebApp: {
    capable: true,
    title: "POLKS",
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/polks/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/polks/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#25343F",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={cn(montserrat.variable, nunito.variable)}>
      <body className="font-body bg-background text-on-background antialiased">
        <ServiceWorkerRegister />
        <AuthProvider>
          <RealtimeProvider>
            <SplashGate>{children}</SplashGate>
          </RealtimeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
