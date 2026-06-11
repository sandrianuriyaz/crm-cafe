"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
      });
      router.push("/verify-account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pendaftaran gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background font-body text-on-background">
      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] h-[50%] w-[50%] rounded-full bg-primary-fixed opacity-30 blur-[120px]" />
        <div className="absolute bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-secondary-fixed opacity-40 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-[420px] px-md md:px-0">
        {/* Back to Guest */}
        <div className="mb-lg flex items-center">
          <Link
            href="/"
            className="group flex items-center text-on-surface-variant transition-colors hover:text-primary"
          >
            <Icon
              name="arrow_back"
              className="mr-sm size-5 transition-transform group-hover:-translate-x-1"
            />
            <span className="font-body-semibold text-body-semibold">Back to Guest</span>
          </Link>
        </div>

        {/* Main Card */}
        <div className="flex flex-col overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm">
          {/* Header */}
          <div className="relative flex flex-col items-center border-b border-outline-variant/20 px-lg pt-lg pb-md text-center">
            <div className="absolute top-0 left-0 h-1 w-full bg-primary" />
            <div className="mb-md flex size-16 items-center justify-center rounded-xl border border-outline-variant/30 bg-surface-container-low shadow-sm">
              <Icon name="coffee_maker" fill className="size-8 text-primary" />
            </div>
            <h1 className="mb-xs font-app-name text-app-name tracking-tight text-primary">
              POLKS GROUP
            </h1>
            <p className="font-caption text-caption text-on-surface-variant">
              Join the premium coffee experience.
            </p>
          </div>

          {/* Form */}
          <div className="p-lg">
            <form onSubmit={onSubmit} className="flex flex-col gap-md">
              <Input
                id="name"
                label="Full Name"
                type="text"
                iconName="person"
                placeholder="John Doe"
                autoComplete="name"
                required
                value={form.name}
                onChange={update("name")}
              />

              <Input
                id="email"
                label="Email"
                type="email"
                iconName="mail"
                placeholder="hello@example.com"
                autoComplete="email"
                required
                value={form.email}
                onChange={update("email")}
              />

              <Input
                id="phone"
                label="Phone Number"
                type="tel"
                iconName="person"
                placeholder="Optional"
                autoComplete="tel"
                value={form.phone}
                onChange={update("phone")}
              />

              <Input
                id="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                iconName="lock"
                placeholder="Create a password"
                autoComplete="new-password"
                required
                minLength={6}
                value={form.password}
                onChange={update("password")}
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

              {error ? (
                <p className="font-caption text-caption text-error">{error}</p>
              ) : null}

              <Button type="submit" disabled={loading} className="mt-md w-full">
                {loading ? "Memproses..." : "Create Account"}
                <Icon name="person_add" />
              </Button>
            </form>

            {/* Divider */}
            <div className="my-lg flex items-center gap-md">
              <div className="h-px flex-1 bg-outline-variant/30" />
              <span className="font-caption text-caption text-outline">or</span>
              <div className="h-px flex-1 bg-outline-variant/30" />
            </div>

            {/* Login */}
            <div className="text-center">
              <p className="font-body text-body text-on-surface-variant">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="ml-xs font-body-semibold text-body-semibold text-primary transition-colors hover:text-primary-container"
                >
                  Login
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-xl flex items-center justify-center gap-md font-caption text-caption text-outline">
          <a href="#" className="transition-colors hover:text-on-surface-variant">
            Privacy Policy
          </a>
          <span className="size-1 rounded-full bg-outline-variant" />
          <a href="#" className="transition-colors hover:text-on-surface-variant">
            Terms of Service
          </a>
        </div>
      </div>
    </main>
  );
}
