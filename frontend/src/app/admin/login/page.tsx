"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden bg-polks-bg font-body text-polks-text md:flex-row">
      <div className="hidden w-1/2 flex-col justify-between bg-polks-brand p-margin-desktop text-white md:flex">
        <div>
          <Image src="/polks/logo.png" alt="POLKS" width={132} height={60} className="mb-6 h-12 w-auto" priority />
          <h1 className="mb-2 font-page-title text-page-title text-white">
            POLKS GROUP CRM Admin
          </h1>
          <p className="font-body text-body text-white/55">
            Manage members, rewards, POS sync.
          </p>
        </div>

        <div className="space-y-lg">
          <div className="rounded-2xl border border-white/10 bg-white/8 p-lg">
            <div className="mb-md flex items-center space-x-md">
              <Icon name="group" className="size-8 text-polks-point" />
              <div>
                <p className="font-caption text-caption text-white/55">
                  Total Members
                </p>
                <p className="font-section-title text-section-title text-white">
                  1,248
                </p>
              </div>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[65%] bg-polks-point" />
            </div>
          </div>

          <div className="flex space-x-lg">
            <div className="flex flex-1 flex-col justify-center rounded-2xl border border-white/10 bg-white/8 p-lg">
              <Icon name="store" className="mb-base size-6 text-polks-smile" />
              <p className="font-caption text-caption text-white/55">
                Active Outlets
              </p>
              <p className="font-section-title text-section-title text-white">
                3
              </p>
            </div>
            <div className="flex flex-1 flex-col justify-center rounded-2xl border border-white/10 bg-white/8 p-lg">
              <Icon name="stars" className="mb-base size-6 text-polks-point" />
              <p className="font-caption text-caption text-white/55">
                Points Issued
              </p>
              <p className="font-section-title text-section-title text-white">
                245,800
              </p>
            </div>
          </div>
        </div>

        <div className="font-caption text-caption text-white/45">
          © 2024 POLKS GROUP. All rights reserved.
        </div>
      </div>

      <div className="relative flex w-full items-center justify-center bg-polks-bg p-margin-mobile md:w-1/2 md:p-margin-desktop">
        <div className="w-full max-w-md rounded-[24px] border border-polks-border bg-white p-lg md:p-xl">
          <Image src="/polks/logo.png" alt="POLKS" width={108} height={50} className="mx-auto mb-6 h-10 w-auto rounded bg-polks-brand px-2 py-1 md:hidden" priority />
          <div className="mb-xl text-center">
            <h2 className="mb-sm font-page-title text-page-title text-polks-text">
              Sign In
            </h2>
            <p className="font-body text-body text-polks-muted">
              Access your admin dashboard
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-md">
            <Input
              id="email"
              label="Email"
              type="email"
              iconName="mail"
              placeholder="admin@polksgroup.com"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              id="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              iconName="lock"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              trailing={
                <button
                  type="button"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  onClick={() => setShowPassword((value) => !value)}
                  className="text-polks-muted transition-colors hover:text-polks-text"
                >
                  <Icon name={showPassword ? "visibility" : "visibility_off"} className="size-5" />
                </button>
              }
            />

            <div className="mb-lg mt-sm flex items-center justify-between">
              <label className="flex cursor-pointer items-center space-x-2">
                <input
                  type="checkbox"
                  className="size-4 rounded border-polks-border bg-white text-polks-brand focus:ring-polks-smile"
                />
                <span className="font-caption text-caption text-polks-muted">
                  Remember me
                </span>
              </label>
              <a
                href="#"
                className="font-caption text-caption text-polks-smile hover:underline"
              >
                Forgot password?
              </a>
            </div>

            {error ? (
              <p className="font-caption text-caption text-error">{error}</p>
            ) : null}

            <Button type="submit" disabled={loading} className="w-full bg-polks-smile text-white hover:bg-polks-smile/90">
              {loading ? "Memproses..." : "Login"}
              <Icon name="arrow_forward" />
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
