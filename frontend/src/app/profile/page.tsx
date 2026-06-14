"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CustomerShell } from "@/components/layout/customer-shell";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

// Bentuk response GET /member/profile (backend/src/member).
type MemberProfile = {
  id: string;
  memberCode: string;
  name: string;
  email: string;
  phone: string | null;
  pointBalance: number;
  tier: string | null;
  createdAt: string;
};

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatJoined(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    api<MemberProfile>("/member/profile")
      .then((p) => {
        if (alive) setProfile(p);
      })
      .catch((err) => {
        if (!alive) return;
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login");
          return;
        }
        setError(err instanceof Error ? err.message : "Gagal memuat profil");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [router]);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  // Fallback ke data auth context selama fetch detail berjalan.
  const name = profile?.name ?? user?.name ?? "—";
  const email = profile?.email ?? user?.email ?? "";
  const memberCode = profile?.memberCode ?? user?.memberCode ?? "—";
  const points = profile?.pointBalance ?? user?.pointBalance ?? 0;

  const infoRows = [
    { icon: "badge", label: "Member ID", value: memberCode },
    { icon: "call", label: "Telepon", value: profile?.phone || "—" },
    {
      icon: "workspace_premium",
      label: "Tier",
      value: profile?.tier || "Member",
    },
    {
      icon: "calendar_month",
      label: "Bergabung",
      value: profile ? formatJoined(profile.createdAt) : "—",
    },
  ];

  return (
    <CustomerShell>
      <div className="flex flex-col gap-5 px-5 pb-28 pt-5">
        <div>
          <h1 className="text-[22px] font-black text-polks-text">
            Profil
          </h1>
          <p className="mt-1 text-sm text-polks-muted">
            Detail membership POLKS
          </p>
        </div>

        {error ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-polks-border bg-white p-5 text-center">
            <Icon name="error" className="size-10 text-error" />
            <p className="text-sm text-polks-muted">{error}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 rounded-2xl border border-polks-border bg-white p-5">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-polks-brand text-base font-bold text-white">
                {loading ? "" : initialsOf(name)}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-polks-text">
                  {name}
                </h2>
                <p className="truncate text-sm text-polks-muted">
                  {email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-polks-brand p-4 text-white shadow-[0_12px_32px_rgba(37,52,63,0.22)]">
              <div className="flex size-11 items-center justify-center rounded-full bg-polks-point-soft">
                <Icon name="stars" fill className="size-5 text-polks-point" />
              </div>
              <div>
                <div className="text-xs text-white/55">
                  Saldo Poin
                </div>
                <div className="text-base font-bold text-white">
                  {points.toLocaleString("id-ID")} pts
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-polks-border bg-white">
              {infoRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center gap-3 border-b border-polks-border px-4 py-3 last:border-b-0"
                >
                  <Icon
                    name={row.icon}
                    className="size-5 shrink-0 text-polks-muted"
                  />
                  <span className="flex-1 text-sm text-polks-muted">
                    {row.label}
                  </span>
                  <span className="text-right text-sm font-semibold text-polks-text">
                    {loading ? "…" : row.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/member-card">
                  <Icon name="account_balance_wallet" className="size-5" />
                  Member Card
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/history">
                  <Icon name="history" className="size-5" />
                  History
                </Link>
              </Button>
            </div>

            <Button variant="destructive" onClick={handleLogout} className="rounded-xl">
              <Icon name="logout" className="size-5" />
              Keluar
            </Button>
          </>
        )}
      </div>
    </CustomerShell>
  );
}
