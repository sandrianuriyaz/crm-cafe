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
    <CustomerShell maxWidth="max-w-md">
      <div className="flex flex-col gap-lg">
        {/* Heading */}
        <div>
          <h1 className="font-page-title text-page-title text-on-surface">
            Profile
          </h1>
          <p className="font-body text-body text-on-surface-variant mt-xs">
            Your membership details
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border border-outline-variant bg-surface p-lg flex flex-col items-center text-center gap-md">
            <Icon name="error" className="size-10 text-error" />
            <p className="font-body text-body text-on-surface-variant">{error}</p>
          </div>
        ) : (
          <>
            {/* Identity card */}
            <div className="bg-surface rounded-xl border border-outline-variant p-lg flex items-center gap-md">
              <div className="size-16 shrink-0 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-card-title text-card-title font-bold">
                {loading ? "" : initialsOf(name)}
              </div>
              <div className="min-w-0">
                <h2 className="font-card-title text-card-title text-on-surface truncate">
                  {name}
                </h2>
                <p className="font-body text-body text-on-surface-variant truncate">
                  {email}
                </p>
              </div>
            </div>

            {/* Points balance */}
            <div className="bg-primary text-on-primary rounded-xl p-md shadow-sm border border-outline-variant/20 flex items-center gap-md">
              <div className="bg-primary-fixed text-on-primary-fixed p-sm rounded-full flex items-center justify-center">
                <Icon name="stars" className="size-5" />
              </div>
              <div>
                <div className="font-caption text-caption text-primary-fixed-dim">
                  Available Balance
                </div>
                <div className="font-card-title text-card-title font-bold">
                  {points.toLocaleString("id-ID")} pts
                </div>
              </div>
            </div>

            {/* Info list */}
            <div className="bg-surface rounded-xl border border-outline-variant divide-y divide-outline-variant/60 overflow-hidden">
              {infoRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center gap-md px-md py-sm"
                >
                  <Icon
                    name={row.icon}
                    className="size-5 text-on-surface-variant shrink-0"
                  />
                  <span className="font-body text-body text-on-surface-variant flex-1">
                    {row.label}
                  </span>
                  <span className="font-body-semibold text-body-semibold text-on-surface text-right">
                    {loading ? "…" : row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Quick links */}
            <div className="flex gap-md">
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

            {/* Logout */}
            <Button variant="destructive" onClick={handleLogout}>
              <Icon name="logout" className="size-5" />
              Keluar
            </Button>
          </>
        )}
      </div>
    </CustomerShell>
  );
}
