import type { Metadata, Viewport } from "next";
import "./globals.css";
import { inter } from "@/lib/fonts";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "POLKS Group — Member",
  description: "Loyalty, promo, dan reward untuk member POLKS Group.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2B1712",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="font-body bg-background text-on-background antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
