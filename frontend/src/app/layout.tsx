import type { Metadata, Viewport } from "next";
import "./globals.css";
import { montserrat } from "@/lib/fonts";
import { AuthProvider } from "@/lib/auth";
import { SplashGate } from "@/components/layout/splash-gate";

export const metadata: Metadata = {
  title: "POLKS Group — Member",
  description: "Loyalty, promo, dan reward untuk member POLKS Group.",
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
    <html lang="id" className={montserrat.variable}>
      <body className="font-body bg-background text-on-background antialiased">
        <AuthProvider>
          <SplashGate>{children}</SplashGate>
        </AuthProvider>
      </body>
    </html>
  );
}
