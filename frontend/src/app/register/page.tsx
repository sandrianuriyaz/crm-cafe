"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pendaftaran gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col justify-center bg-background px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="mb-1 text-center font-heading text-2xl font-bold text-foreground">
          Daftar Member
        </h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Pakai nomor HP yang sama dengan saat belanja agar poinmu kebawa.
        </p>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field label="Nama" id="name">
            <input
              id="name"
              required
              value={form.name}
              onChange={update("name")}
              className="rounded-xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary"
              placeholder="Nama lengkap"
            />
          </Field>

          <Field label="Email" id="email">
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={update("email")}
              className="rounded-xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary"
              placeholder="kamu@email.com"
            />
          </Field>

          <Field label="Nomor HP (opsional)" id="phone">
            <input
              id="phone"
              value={form.phone}
              onChange={update("phone")}
              className="rounded-xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary"
              placeholder="+62…"
            />
          </Field>

          <Field label="Password" id="password">
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={update("password")}
              className="rounded-xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary"
              placeholder="Minimal 6 karakter"
            />
          </Field>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-full bg-primary px-4 py-3 font-semibold text-primary-foreground shadow-[0px_8px_20px_rgba(43,23,18,0.1)] transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Memproses…" : "Daftar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-semibold text-secondary">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
