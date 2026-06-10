"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { TopAppBar } from "@/components/member/top-app-bar";
import { WalletCard } from "@/components/member/wallet-card";
import { QuickActions } from "@/components/member/quick-actions";
import { BottomNav } from "@/components/member/bottom-nav";
import { OfferThumbnail } from "@/components/member/offer-thumbnail";
import { useAuth } from "@/lib/auth";
import { api, getToken } from "@/lib/api";

type Profile = {
  memberCode: string;
  name: string;
  pointBalance: number;
  tier: { name: string } | null;
};

type TxItem = { name: string; qty: number; lineTotal: number };
type Transaction = {
  id: string;
  posOrderNumber: string | null;
  grandTotal: number;
  pointsAwarded: number;
  paymentMethod: string | null;
  createdAt: string;
  items: TxItem[];
};

// Promo & reward belum ada di backend — masih placeholder sampai modul dibuat.
const deals = [
  {
    id: "deal-1",
    title: "Diskon Kopi Susu 20%",
    validUntil: "Valid until 31 July 2026",
    status: "Active",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Belum login → ke halaman login.
    if (!getToken()) {
      router.replace("/login");
      return;
    }

    Promise.all([
      api<Profile>("/member/profile"),
      api<{ image_data_url: string }>("/member/qr"),
      api<{ items: Transaction[] }>("/member/transactions?take=5"),
    ])
      .then(([p, qr, tx]) => {
        setProfile(p);
        setQrImage(qr.image_data_url);
        setTransactions(tx.items);
      })
      .catch((err) => {
        // Token kedaluwarsa/invalid → logout & ke login.
        if (err?.status === 401) {
          logout();
          router.replace("/login");
          return;
        }
        setError(err instanceof Error ? err.message : "Gagal memuat data");
      })
      .finally(() => setLoading(false));
  }, [router, logout]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Memuat…</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-6">
        <p className="text-sm text-red-600">{error ?? "Data tidak tersedia"}</p>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background pb-40">
      <TopAppBar />

      <main className="flex flex-col gap-6 px-5 pt-6">
        <section>
          <h1 className="mb-1 font-heading text-[26px] font-bold leading-8 tracking-tight text-foreground">
            Hi, {profile.name || "Member"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Ready for your coffee break?
          </p>
        </section>

        <WalletCard
          tier={profile.tier?.name ?? "Member"}
          points={profile.pointBalance}
          memberId={profile.memberCode}
          qrImage={qrImage}
        />

        <QuickActions />

        {/* Histori transaksi terakhir (data asli) */}
        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Transaksi Terakhir
          </h2>
          {transactions.length === 0 ? (
            <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              Belum ada transaksi.
            </p>
          ) : (
            transactions.map((tx) => (
              <article
                key={tx.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-[0px_4px_12px_rgba(43,23,18,0.05)]"
              >
                <div className="flex flex-col gap-1">
                  <h3 className="font-heading text-base font-semibold text-foreground">
                    {tx.posOrderNumber ?? "Transaksi"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {tx.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Rp {tx.grandTotal.toLocaleString("id-ID")} ·{" "}
                    {tx.paymentMethod ?? "-"}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-accent/10 px-2 py-1 text-xs font-bold text-accent">
                  <Star className="size-3.5" aria-hidden="true" />+
                  {tx.pointsAwarded}
                </span>
              </article>
            ))
          )}
        </section>

        {/* Today's Deals — placeholder, modul promo belum ada di backend */}
        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Today&apos;s Deals
          </h2>
          {deals.map((deal) => (
            <article
              key={deal.id}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-[0px_4px_12px_rgba(43,23,18,0.05)]"
            >
              <OfferThumbnail />
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-heading text-base font-semibold text-foreground">
                    {deal.title}
                  </h3>
                  <span className="rounded-full bg-accent/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-accent">
                    {deal.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{deal.validUntil}</p>
              </div>
            </article>
          ))}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
