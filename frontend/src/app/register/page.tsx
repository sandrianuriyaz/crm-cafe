"use client";

import Link from "next/link";
import Image from "next/image";
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
    <main className="flex min-h-screen justify-center bg-polks-bg font-body text-polks-text">
      <div className="polks-phone min-h-screen w-full bg-polks-bg">
        <section className="bg-polks-brand px-5 pb-9 pt-5 text-white">
          <div className="mb-9 flex items-center justify-between">
            <Image src="/polks/logo.png" alt="POLKS" width={96} height={44} className="h-9 w-auto" priority />
            <Link href="/login" className="rounded-lg border border-white/30 px-3 py-2 text-xs font-semibold text-white">
              Login
            </Link>
          </div>
          <p className="text-xs font-medium text-white/45">Member baru</p>
          <h1 className="mt-1 text-2xl font-black leading-tight text-white">
            Daftar gratis dan mulai kumpulkan poin.
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
                id="name"
                label="Nama Lengkap"
                type="text"
                iconName="person"
                placeholder="Nama kamu"
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
                label="Nomor HP"
                type="tel"
                iconName="person"
                placeholder="Opsional"
                autoComplete="tel"
                value={form.phone}
                onChange={update("phone")}
              />

              <Input
                id="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                iconName="lock"
                placeholder="Buat password"
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
                    className="text-polks-muted transition-colors hover:text-polks-text"
                  >
                    <Icon name={showPassword ? "visibility" : "visibility_off"} className="size-5" />
                  </button>
                }
              />

              {error ? (
                <p className="font-caption text-caption text-error">{error}</p>
              ) : null}

              <Button type="submit" disabled={loading} className="mt-md w-full bg-polks-smile text-white hover:bg-polks-smile/90">
                {loading ? "Memproses..." : "Buat Akun"}
                <Icon name="person_add" />
              </Button>
            </form>

            <div className="my-lg flex items-center gap-md">
              <div className="h-px flex-1 bg-polks-border" />
              <span className="font-caption text-caption text-polks-muted">atau</span>
              <div className="h-px flex-1 bg-polks-border" />
            </div>

            <div className="text-center">
              <p className="font-body text-body text-polks-muted">
                Sudah punya akun?{" "}
                <Link
                  href="/login"
                  className="ml-xs font-body-semibold text-body-semibold text-polks-smile"
                >
                  Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
