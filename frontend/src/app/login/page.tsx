"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
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
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen justify-center bg-polks-bg font-body text-polks-text">
      <div className="polks-phone min-h-screen w-full bg-polks-bg">
        <section className="bg-polks-brand px-5 pb-9 pt-5 text-white">
          <div className="mb-9 flex items-center justify-between">
            <Image src="/polks/logo.png" alt="POLKS" width={96} height={44} className="h-9 w-auto" priority />
            <Link href="/register" className="rounded-lg bg-polks-smile px-3 py-2 text-xs font-semibold text-white">
              Register
            </Link>
          </div>
          <p className="text-xs font-medium text-white/45">Masuk member</p>
          <h1 className="mt-1 text-2xl font-black leading-tight text-white">
            Lanjutkan poin dan reward kamu.
          </h1>
        </section>

        <div className="bg-polks-brand leading-none">
          <svg viewBox="0 0 390 28" preserveAspectRatio="none" className="polks-wave">
            <path d="M0,0 Q195,28 390,0 L390,28 L0,28 Z" fill="#F6F8FA" />
          </svg>
        </div>

        <div className="px-5 pb-10">
          <div className="mb-5 flex items-center">
          <Link
            href="/"
              className="group flex items-center text-sm font-semibold text-polks-muted transition-colors hover:text-polks-brand"
          >
            <Icon
              name="arrow_back"
                className="mr-2 size-5 transition-transform group-hover:-translate-x-1"
            />
              Kembali
          </Link>
        </div>

          <div className="rounded-2xl border border-polks-border bg-white p-5">
            <form onSubmit={onSubmit} className="flex flex-col gap-md">
              <Input
                id="identifier"
                label="Email atau Nomor HP"
                type="text"
                iconName="person"
                placeholder="Masukkan email atau nomor HP"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div className="mt-sm">
                <Input
                  id="password"
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  iconName="lock"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  action={
                    <Link
                      href="#"
                      className="font-caption text-caption text-polks-smile"
                    >
                      Forgot?
                    </Link>
                  }
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
              </div>

              {error ? (
                <p className="font-caption text-caption text-error">{error}</p>
              ) : null}

              <Button type="submit" disabled={loading} className="mt-md w-full bg-polks-smile text-white hover:bg-polks-smile/90">
                {loading ? "Memproses..." : "Login"}
                <Icon name="login" />
              </Button>
            </form>

            <div className="my-lg flex items-center gap-md">
              <div className="h-px flex-1 bg-polks-border" />
              <span className="font-caption text-caption text-polks-muted">atau</span>
              <div className="h-px flex-1 bg-polks-border" />
            </div>

            <div className="text-center">
              <p className="font-body text-body text-polks-muted">
                Belum punya akun?{" "}
                <Link
                  href="/register"
                  className="ml-xs font-body-semibold text-body-semibold text-polks-smile"
                >
                  Daftar sekarang
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
