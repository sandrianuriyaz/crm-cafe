# Client UI/UX Redesign Spec

**Tanggal:** 2026-06-26
**Konteks:** Revisi mentor — UI kurang profesional, UX userflow kurang jelas (referensi: Tomoro, Kopken)

---

## Scope

Dua screen paling berdampak:
1. **Guest Landing Page** (`/`) — konversi guest ke member
2. **Member Dashboard** (`/dashboard`) — panduan member menjalani loyalty loop

---

## Prinsip Design

1. **Brand color hemat** — `polks-brand` hanya di topbar (56px). Body section putih/cream.
2. **No wave SVG** — dihapus total dari kedua halaman. Transisi antar section pakai `border-b border-polks-border` bersih.
3. **Satu CTA dominan per screen** — guest: Daftar Gratis. member: Kartu Member.
4. **Poin sebagai editorial number** — `text-[56px] font-black tracking-[-0.04em]` di atas background putih. Kontras besar vs label kecil → terasa premium.

---

## 1. Guest Landing Page (`/`)

### Masalah yang Diperbaiki
- CTA "Daftar Gratis" ada di paling bawah (seharusnya di atas)
- Bottom nav 5 item: "Promo", "Reward", "Masuk" semua redirect ke `/login` — terasa broken
- Wave SVG antara brand header dan konten terlihat murahan
- Terlalu banyak konten tanpa hierarki yang jelas

### Struktur Baru

```
[Topbar] — brand bg, 56px, hanya logo

[Hero Section] — white bg
  Headline: "Poin dari setiap cangkir."  (display, font-black)
  Subtitle: "Daftar gratis & kumpulkan poin dari setiap kunjungan di outlet POLKS."
  CTA Primary: "Daftar Gratis" (full-width, brand bg)
  CTA Secondary: "Sudah punya akun? Masuk" (text link, center)

[border-b] — clean separator, NO wave SVG

[Promo Section] — polks-bg, horizontal scroll
[Cara Kerjanya] — polks-bg, 3 steps
[Reward Preview] — polks-bg, horizontal scroll
[Outlet] — polks-bg, list

[Bottom Nav] — 3 item: Home | Outlet | Daftar
```

### Detail Perubahan

**Topbar:**
- Hapus tombol "QR Member" dari topbar guest (tidak berguna untuk guest)
- Logo saja, centered atau left-aligned

**Hero Section (baru):**
```
bg-white, px-6, pt-8 pb-10

Headline:
  text-[34px] font-black leading-[1.1] tracking-[-0.03em] text-polks-text
  "Poin dari setiap cangkir."

Subtitle (mt-3):
  text-[14px] leading-relaxed text-polks-muted
  "Daftar gratis & kumpulkan poin dari setiap kunjungan di outlet POLKS."

CTA Primary (mt-6):
  h-14 w-full rounded-2xl bg-polks-brand text-white font-bold text-[15px]
  "Daftar Gratis"
  href="/register"

CTA Secondary (mt-3, text-center):
  text-[13px] text-polks-muted
  "Sudah punya akun? "
  <Link href="/login" class="font-semibold text-polks-brand">Masuk</Link>
```

**Section Headers:**
- Setiap section pakai label kecil uppercase: `text-[11px] font-bold uppercase tracking-[0.08em] text-polks-muted`
- Diikuti judul section yang lebih besar jika diperlukan

**Bottom Nav (3 item):**
```typescript
const navItems = [
  { label: "Home", Icon: Home, href: "/" },
  { label: "Outlet", Icon: Store, href: "/outlets" },
  { label: "Daftar", Icon: LogIn, href: "/register" },
];
```
- Hapus: Promo (redirect login), Masuk (QrCode ke login), Reward (redirect login)
- Outlet dibuat halaman publik (sudah ada `/outlets`)
- CTA Masuk/Daftar sudah ada di hero, tidak perlu duplikat di nav

**Dihapus:**
- Wave SVG (semua instance)
- Blok "Selamat datang, Teman POLKS!" + tombol Login yang terpisah
- CTA section "Mulai kumpulkan poin hari ini" di bawah (duplikat dengan hero)
- Tombol "QR Member" di topbar guest

---

## 2. Member Dashboard (`/dashboard`)

### Masalah yang Diperbaiki
- Poin terkubur dalam brand-colored hero block yang besar → kurang premium
- "Kartu Member" (fitur terpenting) tersembunyi di bottom nav tab ke-3
- Wave SVG antara hero dan konten terlihat murahan
- Quick links (Riwayat, Outlet) di dashboard tidak perlu — sudah ada di member card page dan bottom nav

### Struktur Baru

```
[Topbar] — brand bg, 56px: logo kiri + bell kanan

[Greeting] — white bg, px-5, pt-5
  "Halo, [Name]"  +  [Tier badge]

[Poin Display] — white bg, px-5, pt-4 pb-6
  ★ (gold, kecil)
  2.350            ← text-[56px] font-black tracking-[-0.04em] text-polks-text
  pts · Saldo poin kamu  ← text-[12px] text-polks-muted

[Member Card CTA] — white bg, px-5 pb-6
  Full-width card, brand bg, rounded-2xl
  Kiri: ikon QrCode + teks "Kartu Member" + "Tunjukkan QR ke kasir"
  Kanan: ChevronRight

[border-b border-polks-border]

[Reward Section] — polks-bg, px-5, pt-5
  Header: "Reward untuk Kamu" + link "Semua"
  2 reward cards (grid 2 col)

[Promo Section] — polks-bg, px-5, pt-4 pb-28
  Header: "Promo Aktif" + link "Semua"
  List promo
```

### Detail Perubahan

**Topbar (baru):**
```
bg-polks-brand, h-14 (56px), px-5
Kiri: logo POLKS
Kanan: bell icon + unread dot
```

**Greeting:**
```
px-5 pt-5
flex items-center justify-between

Kiri: "Halo, [Name]"
  text-[15px] font-semibold text-polks-text

Kanan: tier badge
  rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase
  warna dari tierMeta
```

**Poin Display (signature element):**
```
px-5 pt-4 pb-6

Row 1: <Star size={16} color="#F6B84B" fill="#F6B84B" />

Row 2: angka poin
  text-[56px] font-black leading-none tracking-[-0.04em] text-polks-text
  {points.toLocaleString("id-ID")}

Row 3: label
  text-[12px] text-polks-muted mt-1
  "pts · Saldo poin kamu"
```

**Member Card CTA (baru):**
```
px-5 pb-6

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
```

**Dihapus:**
- Wave SVG (semua instance)
- Brand-colored hero section yang besar (hero sekarang bersih dan flat)
- Quick links grid (Riwayat, Outlet) — tidak diperlukan di dashboard

---

## File yang Diubah

| File | Perubahan |
|---|---|
| `src/app/page.tsx` | Restruktur hero, hapus wave, fix bottom nav |
| `src/app/dashboard/page.tsx` | Restruktur poin display, tambah member card CTA, hapus wave & quick links |

---

## Yang Tidak Berubah

- Design system tokens (`polks-brand`, `polks-bg`, dll) — tidak ada perubahan CSS global
- Semua route dan API calls
- Login, register, member card, rewards, promos, profile pages
- Customer shell dan bottom nav component (member)
