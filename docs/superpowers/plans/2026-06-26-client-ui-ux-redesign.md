# Client UI/UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign guest landing page dan member dashboard agar lebih profesional dan userflow lebih jelas.

**Architecture:** Dua file page yang diubah secara independen. Tidak ada perubahan pada komponen shared, design token, atau API calls — hanya struktur JSX dan layout.

**Tech Stack:** Next.js 14, React, TypeScript, Tailwind CSS, Lucide React

## Global Constraints

- Hanya ubah dua file: `frontend/src/app/page.tsx` dan `frontend/src/app/dashboard/page.tsx`
- Semua API calls, route href, dan design token (`polks-brand`, `polks-bg`, dll) tidak berubah
- Tidak boleh menambah dependency baru
- Semua import yang tidak dipakai harus dihapus

---

### Task 1: Guest Landing Page

**Files:**
- Modify: `frontend/src/app/page.tsx`

**Interfaces:**
- Consumes: `api`, `LoginRequiredModal`, `Promo`, `Reward` — sudah ada, tidak berubah
- Produces: halaman guest baru yang bisa diverifikasi manual di `/`

Perubahan yang dilakukan:
- Topbar: hanya logo (hapus tombol "QR Member")
- Tambah hero section putih dengan headline besar + 2 CTA
- Hapus wave SVG
- Hapus section "Selamat datang, Teman POLKS!" + Login button strip
- Hapus CTA section "Mulai kumpulkan poin" di bawah (duplikat)
- Promo & reward: ubah ke horizontal scroll cards
- Bottom nav: dari 5 item ke 3 item (Home, Outlet, Daftar)

- [ ] **Step 1: Ganti seluruh isi `frontend/src/app/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Gift, Store, CheckCircle2, ChevronRight,
  Smartphone, Star, Home, LogIn,
} from "lucide-react";
import { LoginRequiredModal } from "@/components/customer/login-required-modal";
import { api } from "@/lib/api";
import { type Promo, type Reward } from "@/lib/loyalty/types";

type Outlet = { id: string; name: string; city: string | null };

const steps = [
  { Icon: Smartphone, text: "Tunjukkan QR member ke kasir" },
  { Icon: Star, text: "Poin masuk otomatis tiap transaksi" },
  { Icon: Gift, text: "Tukar poin jadi reward pilihan" },
];

function formatPeriod(startAt: string | null, endAt: string | null): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  if (startAt && endAt) return `${fmt(startAt)} – ${fmt(endAt)}`;
  if (endAt) return `s/d ${fmt(endAt)}`;
  if (startAt) return `mulai ${fmt(startAt)}`;
  return "Berlaku terus";
}

const navItems = [
  { label: "Home", Icon: Home, href: "/" as const },
  { label: "Outlet", Icon: Store, href: "/outlets" as const },
  { label: "Daftar", Icon: LogIn, href: "/register" as const },
];

export default function GuestHomePage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [modalReason, setModalReason] = useState<string | null>(null);
  const gate = (reason: string) => () => setModalReason(reason);

  useEffect(() => {
    api<Promo[]>("/promos").then((d) => setPromos(d.slice(0, 5))).catch(() => setPromos([]));
    api<Reward[]>("/rewards").then((d) => setRewards(d.slice(0, 4))).catch(() => setRewards([]));
    api<Outlet[]>("/outlets").then((d) => setOutlets(d.slice(0, 4))).catch(() => setOutlets([]));
  }, []);

  return (
    <div className="polks-phone relative w-full overflow-x-hidden bg-polks-bg font-body text-polks-text">
      {/* Topbar */}
      <div className="sticky top-0 z-40 flex h-14 items-center bg-polks-brand px-5">
        <Image
          src="/polks/logo.png"
          alt="POLKS"
          width={96}
          height={40}
          className="h-8 w-auto object-contain"
          priority
        />
      </div>

      {/* Hero */}
      <div className="bg-white px-6 pb-10 pt-8">
        <h1 className="text-[34px] font-black leading-[1.1] tracking-[-0.03em] text-polks-text">
          Poin dari<br />setiap cangkir.
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-polks-muted">
          Daftar gratis & kumpulkan poin dari setiap kunjungan di outlet POLKS.
        </p>
        <Link
          href="/register"
          className="mt-6 flex h-14 w-full items-center justify-center rounded-2xl bg-polks-brand text-[15px] font-bold text-white"
        >
          Daftar Gratis
        </Link>
        <p className="mt-3 text-center text-[13px] text-polks-muted">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-semibold text-polks-brand">
            Masuk
          </Link>
        </p>
      </div>

      <div className="border-b border-polks-border" />

      {/* Content */}
      <div className="flex flex-col gap-6 bg-polks-bg pb-28 pt-5">
        {/* Promo */}
        {promos.length > 0 ? (
          <div>
            <div className="mb-3 flex items-center justify-between px-5">
              <h2 className="text-[15px] font-bold text-polks-text">Promo</h2>
              <Link href="/login" className="flex items-center gap-0.5 text-xs font-semibold text-polks-brand">
                Semua <ChevronRight size={13} />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto px-5 pb-1 [&::-webkit-scrollbar]:hidden">
              {promos.map((p) => (
                <Link
                  key={p.id}
                  href="/login"
                  className="w-[220px] flex-shrink-0 overflow-hidden rounded-2xl border border-polks-border bg-white"
                >
                  {p.imageUrl ? (
                    <div className="relative aspect-[4/3] w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.imageUrl} alt={p.title} className="size-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3 pb-2 pt-6">
                        <p className="truncate text-[12px] font-bold text-white">{p.title}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4">
                      <p className="mb-1 line-clamp-2 text-[13px] font-semibold text-polks-text">{p.title}</p>
                      <p className="text-[11px] text-polks-muted">{formatPeriod(p.startAt, p.endAt)}</p>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {/* Cara Kerjanya */}
        <div className="mx-5 rounded-2xl bg-white px-5 py-5">
          <h2 className="mb-4 text-[15px] font-bold text-polks-text">Cara Kerjanya</h2>
          <div className="flex flex-col gap-4">
            {steps.map(({ Icon, text }, i) => (
              <div key={text} className="flex items-center gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-polks-brand text-[11px] font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-[13px] text-polks-text">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reward */}
        {rewards.length > 0 ? (
          <div>
            <div className="mb-3 flex items-center justify-between px-5">
              <h2 className="text-[15px] font-bold text-polks-text">Reward</h2>
              <button
                type="button"
                onClick={gate("Login untuk melihat semua reward.")}
                className="flex items-center gap-0.5 text-xs font-semibold text-polks-brand"
              >
                Semua <ChevronRight size={13} />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto px-5 pb-1 [&::-webkit-scrollbar]:hidden">
              {rewards.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={gate("Login untuk menukar poin dengan reward.")}
                  className="flex w-[140px] shrink-0 flex-col gap-2.5 rounded-2xl border border-polks-border bg-white p-4 text-left"
                >
                  <div className="flex size-9 items-center justify-center rounded-xl bg-polks-point-soft">
                    <Gift size={16} color="#C99A2E" />
                  </div>
                  <p className="line-clamp-2 text-[12px] font-semibold text-polks-text">{r.name}</p>
                  <span className="text-[11px] font-semibold text-polks-muted">
                    {r.pointCost.toLocaleString("id-ID")} pts
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Outlet */}
        {outlets.length > 0 ? (
          <div className="mx-5 rounded-2xl bg-white px-5 py-5">
            <h2 className="mb-3.5 text-[15px] font-bold text-polks-text">Outlet Kami</h2>
            {outlets.map((o, i) => (
              <div
                key={o.id}
                className={
                  "flex items-center gap-3 py-2.5 " +
                  (i < outlets.length - 1 ? "border-b border-polks-surface" : "")
                }
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-polks-brand">
                  <Store size={15} color="#ffffff" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-polks-text">{o.name}</p>
                  {o.city ? <p className="mt-px text-[11px] text-polks-muted">{o.city}</p> : null}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Value props */}
        <div className="mx-5 rounded-2xl bg-white px-5 py-4">
          {[
            "Daftar gratis — tanpa kartu fisik",
            "Berlaku di semua outlet POLKS",
            "Poin otomatis update setelah transaksi",
          ].map((text, i) => (
            <div
              key={text}
              className={
                "flex items-center gap-2.5 py-2.5 " +
                (i < 2 ? "border-b border-polks-surface" : "")
              }
            >
              <CheckCircle2 size={15} color="#25343F" strokeWidth={2} />
              <span className="text-[13px] text-polks-text">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav (3 item) */}
      <nav className="fixed bottom-5 left-1/2 z-50 flex h-[60px] w-[280px] max-w-[calc(100%-32px)] -translate-x-1/2 items-center justify-around rounded-full bg-polks-brand px-2 shadow-[0_8px_24px_rgba(37,52,63,0.3)]">
        {navItems.map(({ label, Icon, href }, i) => {
          const active = i === 0;
          return (
            <Link
              key={label}
              href={href}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <span
                className={
                  "flex size-9 items-center justify-center rounded-full " +
                  (active ? "bg-white/15" : "")
                }
              >
                <Icon
                  size={20}
                  color={active ? "#ffffff" : "rgba(255,255,255,0.5)"}
                  strokeWidth={active ? 2.4 : 1.8}
                />
              </span>
              <span
                className={
                  active
                    ? "text-[9px] font-bold text-white"
                    : "text-[9px] font-medium text-white/40"
                }
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      <LoginRequiredModal
        open={modalReason !== null}
        onClose={() => setModalReason(null)}
        reason={modalReason ?? undefined}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verifikasi TypeScript tidak error**

```bash
cd frontend && npx tsc --noEmit
```

Expected: tidak ada error baru.

- [ ] **Step 3: Verifikasi manual di browser**

```bash
cd frontend && npm run dev
```

Buka `http://localhost:3000/` dan cek:
- [ ] Topbar hanya logo (tidak ada tombol QR Member)
- [ ] Hero putih dengan headline besar "Poin dari setiap cangkir."
- [ ] Tombol "Daftar Gratis" prominently di bawah headline
- [ ] Link "Masuk" sebagai text link
- [ ] Tidak ada wave SVG di mana pun
- [ ] Bottom nav hanya 3 item: Home, Outlet, Daftar
- [ ] Promo dan reward tampil horizontal scroll (jika ada data)
- [ ] Klik "Outlet" di nav → navigasi ke `/outlets`
- [ ] Klik "Daftar" di nav → navigasi ke `/register`

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/page.tsx
git commit -m "feat(guest): redesign landing page — hero CTA di atas, nav 3 item, hapus wave"
```

---

### Task 2: Member Dashboard

**Files:**
- Modify: `frontend/src/app/dashboard/page.tsx`

**Interfaces:**
- Consumes: `CustomerShell`, `api`, `useAuth`, `TIER_META`, `Promo`, `Reward` — sudah ada, tidak berubah
- Produces: halaman dashboard baru yang bisa diverifikasi manual di `/dashboard`

Perubahan yang dilakukan:
- Topbar: compact 56px brand bg (logo + bell)
- Hapus brand-colored hero section yang besar
- Tambah greeting + tier badge di white section
- Tambah poin display besar (56px) di white section
- Tambah Member Card CTA button full-width
- Hapus wave SVG
- Hapus quick links (Riwayat, Outlet)
- Reward dan promo section tetap ada

- [ ] **Step 1: Ganti seluruh isi `frontend/src/app/dashboard/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bell, ChevronRight, Gift, QrCode, Star } from "lucide-react";
import { CustomerShell } from "@/components/layout/customer-shell";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { TIER_META } from "@/lib/loyalty/tier";
import { type Promo, type Reward } from "@/lib/loyalty/types";

function formatPeriod(startAt: string | null, endAt: string | null): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  if (startAt && endAt) return `${fmt(startAt)} – ${fmt(endAt)}`;
  if (endAt) return `s/d ${fmt(endAt)}`;
  if (startAt) return `mulai ${fmt(startAt)}`;
  return "Berlaku terus";
}

export default function MemberDashboardPage() {
  const { user } = useAuth();
  const [recs, setRecs] = useState<Reward[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [unread, setUnread] = useState(0);

  const name = user?.name || "Member";
  const points = user?.pointBalance ?? 0;
  const tierMeta = TIER_META[user?.tier ?? "bronze"];

  useEffect(() => {
    api<Reward[]>("/rewards")
      .then((d) => setRecs(d.slice(0, 2)))
      .catch(() => setRecs([]));
    api<Promo[]>("/promos")
      .then((d) => setPromos(d.slice(0, 2)))
      .catch(() => setPromos([]));
    api<{ count: number }>("/member/notifications/unread-count")
      .then((r) => setUnread(r.count))
      .catch(() => setUnread(0));
  }, []);

  return (
    <CustomerShell showHeader={false} topbarRight={null}>
      {/* Topbar */}
      <div className="flex h-14 items-center justify-between bg-polks-brand px-5">
        <Image
          src="/polks/logo.png"
          alt="POLKS"
          width={96}
          height={40}
          className="h-8 w-auto object-contain"
          priority
        />
        <Link href="/inbox" aria-label="Notifikasi" className="relative">
          <Bell size={20} color="rgba(255,255,255,0.65)" />
          {unread > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 size-[8px] rounded-full border-[1.5px] border-polks-brand bg-white" />
          ) : null}
        </Link>
      </div>

      {/* White section: greeting + poin + member card CTA */}
      <div className="bg-white">
        {/* Greeting */}
        <div className="flex items-center justify-between px-5 pt-5">
          <p className="text-[15px] font-semibold text-polks-text">Halo, {name}</p>
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em]"
            style={{ backgroundColor: tierMeta.badgeBg, color: tierMeta.badgeText }}
          >
            {tierMeta.label}
          </span>
        </div>

        {/* Poin display */}
        <div className="px-5 pb-6 pt-4">
          <Star size={16} color="#F6B84B" fill="#F6B84B" />
          <p className="mt-1 text-[56px] font-black leading-none tracking-[-0.04em] text-polks-text">
            {points.toLocaleString("id-ID")}
          </p>
          <p className="mt-1 text-[12px] text-polks-muted">pts · Saldo poin kamu</p>
        </div>

        {/* Member Card CTA */}
        <div className="px-5 pb-6">
          <Link href="/member-card">
            <div className="flex items-center justify-between rounded-2xl bg-polks-brand px-5 py-4">
              <div className="flex items-center gap-3">
                <QrCode size={20} className="text-white" />
                <div>
                  <p className="text-[13px] font-bold text-white">Kartu Member</p>
                  <p className="text-[11px] text-white/50">Tunjukkan QR ke kasir</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-white/50" />
            </div>
          </Link>
        </div>
      </div>

      {/* Clean separator */}
      <div className="border-b border-polks-border" />

      {/* Content */}
      <div className="flex flex-col gap-7 bg-polks-bg px-5 pb-28 pt-5">
        {/* Reward untuk kamu */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-polks-text">Reward untuk Kamu</h3>
            <Link href="/rewards" className="flex items-center gap-0.5 text-xs font-semibold text-polks-brand">
              Semua <ChevronRight size={13} />
            </Link>
          </div>
          <div className="flex gap-3">
            {(recs.length > 0 ? recs : [null, null]).map((r, i) => {
              const soldOut = r ? r.stock <= 0 : false;
              return (
                <Link
                  key={r?.id ?? i}
                  href="/rewards"
                  className="flex-1 rounded-2xl border border-polks-border bg-white p-4 text-left"
                >
                  <div
                    className={
                      "mb-3 flex size-9 items-center justify-center rounded-xl " +
                      (soldOut ? "bg-polks-surface" : "bg-polks-point-soft")
                    }
                  >
                    <Gift size={16} color={soldOut ? "#8A959D" : "#C99A2E"} />
                  </div>
                  {r ? (
                    <>
                      <p className="mb-1 line-clamp-1 text-xs font-semibold text-polks-text">{r.name}</p>
                      {soldOut ? (
                        <span className="text-xs font-semibold text-polks-error">Stok habis</span>
                      ) : (
                        <span className="text-xs font-semibold text-polks-muted">
                          {r.pointCost.toLocaleString("id-ID")} pts
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="mb-2 h-3 w-2/3 rounded bg-polks-surface" />
                      <div className="h-3 w-1/3 rounded bg-polks-surface" />
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Promo */}
        {promos.length > 0 ? (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-polks-text">Promo</h3>
              <Link href="/promos" className="flex items-center gap-0.5 text-xs font-semibold text-polks-brand">
                Semua <ChevronRight size={13} />
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              {promos.map((p) => (
                <Link
                  key={p.id}
                  href={`/promos/${p.id}`}
                  className="overflow-hidden rounded-2xl border border-polks-border bg-white"
                >
                  {p.imageUrl ? (
                    <div className="relative aspect-[16/9] w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.imageUrl} alt={p.title} className="size-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-4 pb-3 pt-8">
                        <p className="truncate text-[14px] font-bold text-white">{p.title}</p>
                        <p className="text-[11px] text-white/70">{formatPeriod(p.startAt, p.endAt)}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="min-w-0 pr-3">
                        <p className="mb-0.5 truncate text-[13px] font-semibold text-polks-text">{p.title}</p>
                        <p className="text-[11px] text-[#8A959D]">{formatPeriod(p.startAt, p.endAt)}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-polks-brand px-2.5 py-1 text-[10px] font-bold text-white">
                        Aktif
                      </span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </CustomerShell>
  );
}
```

- [ ] **Step 2: Verifikasi TypeScript tidak error**

```bash
cd frontend && npx tsc --noEmit
```

Expected: tidak ada error baru.

- [ ] **Step 3: Verifikasi manual di browser (login dulu)**

Buka `http://localhost:3000/dashboard` (login sebagai member) dan cek:
- [ ] Topbar compact 56px: logo kiri + bell kanan, brand bg
- [ ] Greeting "Halo, [Nama]" + tier badge di white section
- [ ] Angka poin besar (56px) di bawah bintang gold
- [ ] Label kecil "pts · Saldo poin kamu" di bawah angka
- [ ] Tombol "Kartu Member" full-width brand-colored di bawah poin
- [ ] Klik "Kartu Member" → navigasi ke `/member-card`
- [ ] Tidak ada wave SVG
- [ ] Tidak ada quick links (Riwayat / Outlet)
- [ ] Reward dan promo section muncul seperti biasa
- [ ] Bottom nav tetap berfungsi

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/dashboard/page.tsx
git commit -m "feat(dashboard): redesign — poin besar, member card CTA prominent, hapus wave"
```
