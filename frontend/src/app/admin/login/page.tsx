"use client";

import { useRouter } from "next/navigation";
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
    <main className="flex h-screen w-screen flex-col overflow-hidden bg-surface font-body text-on-surface md:flex-row">
      {/* Left Panel (Deep Navy) */}
      <div className="hidden w-1/2 flex-col justify-between bg-[#0F172A] p-margin-desktop text-on-primary md:flex">
        <div>
          <h1 className="mb-2 font-page-title text-page-title text-on-primary">
            POLKS GROUP CRM Admin
          </h1>
          <p className="font-body text-body text-primary-fixed-dim">
            Manage members, rewards, POS sync.
          </p>
        </div>

        <div className="space-y-lg">
          <div className="rounded-xl border border-on-secondary-fixed bg-on-primary-fixed p-lg">
            <div className="mb-md flex items-center space-x-md">
              <Icon name="group" className="size-8 text-tertiary-fixed-dim" />
              <div>
                <p className="font-caption text-caption text-primary-fixed-dim">
                  Total Members
                </p>
                <p className="font-section-title text-section-title text-on-primary">
                  1,248
                </p>
              </div>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-on-secondary-fixed">
              <div className="h-full w-[65%] bg-tertiary-fixed-dim" />
            </div>
          </div>

          <div className="flex space-x-lg">
            <div className="flex flex-1 flex-col justify-center rounded-xl border border-on-secondary-fixed bg-on-primary-fixed p-lg">
              <Icon name="store" className="mb-base size-6 text-tertiary-fixed-dim" />
              <p className="font-caption text-caption text-primary-fixed-dim">
                Active Outlets
              </p>
              <p className="font-section-title text-section-title text-on-primary">
                3
              </p>
            </div>
            <div className="flex flex-1 flex-col justify-center rounded-xl border border-on-secondary-fixed bg-on-primary-fixed p-lg">
              <Icon name="stars" className="mb-base size-6 text-[#F5B82E]" />
              <p className="font-caption text-caption text-primary-fixed-dim">
                Points Issued
              </p>
              <p className="font-section-title text-section-title text-on-primary">
                245,800
              </p>
            </div>
          </div>
        </div>

        <div className="font-caption text-caption text-primary-fixed-dim">
          © 2024 POLKS GROUP. All rights reserved.
        </div>
      </div>

      {/* Right Panel (Login) */}
      <div className="relative flex w-full items-center justify-center bg-surface p-margin-mobile md:w-1/2 md:p-margin-desktop">
        <div className="w-full max-w-md rounded-xl border border-outline-variant bg-surface-container-lowest p-lg md:p-xl">
          <div className="mb-xl text-center">
            <h2 className="mb-sm font-page-title text-page-title text-on-surface">
              Sign In
            </h2>
            <p className="font-body text-body text-on-surface-variant">
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
                  className="text-outline transition-colors hover:text-on-surface"
                >
                  <Icon name={showPassword ? "visibility" : "visibility_off"} className="size-5" />
                </button>
              }
            />

            <div className="mb-lg mt-sm flex items-center justify-between">
              <label className="flex cursor-pointer items-center space-x-2">
                <input
                  type="checkbox"
                  className="size-4 rounded border-outline-variant bg-surface-container-lowest text-primary-container focus:ring-primary-container"
                />
                <span className="font-caption text-caption text-on-surface-variant">
                  Remember me
                </span>
              </label>
              <a
                href="#"
                className="font-caption text-caption text-primary-container hover:underline"
              >
                Forgot password?
              </a>
            </div>

            {error ? (
              <p className="font-caption text-caption text-error">{error}</p>
            ) : null}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Memproses..." : "Login"}
              <Icon name="arrow_forward" />
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
