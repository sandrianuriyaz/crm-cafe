# Dashboard Redesign — Tomoro Pattern

**Tanggal:** 2026-07-02
**Konteks:** Redesign sebelumnya (spec 2026-06-26) terlalu plain — client kurang suka. Banner ditambah kembali untuk daya tarik visual. Redesign ini mempertahankan banner tapi memperbaiki hierarki dan alur sesuai pola Tomoro Coffee.

---

## Prinsip

1. **Banner tetap ada** — visual hook yang client suka, tidak dihapus
2. **Logo + bell di-overlay di atas banner** — tidak ada topbar terpisah yang "memotong" visual
3. **Info member langsung setelah banner** — hierarchy: lihat promo → tahu siapa kamu → ambil aksi
4. **2 big action buttons** — aksi paling penting, besar dan jelas
5. **4 quick action icons** — aksi sekunder dalam satu row

---

## 1. Member Dashboard (`/dashboard`)

### Struktur

```
[PromoBanner] — full width, mt-0 (tidak ada topbar di atas)
  overlay top-left:  POLKS icon + "POLKS" teks putih
  overlay top-right: Bell icon (+ dot jika ada unread)

[White section]
  Row: "Halo, [Name]" + tier badge  |  🎫 [n]  ⭐ [pts] pts

[2 Big Action Buttons] px-4 grid-cols-2 gap-2.5
  [Kartu Member]  — bg-polks-brand, QrCode icon
  [Voucher Saya]  — bg-polks-surface, Ticket icon

[4 Quick Actions] grid-cols-4 border-top + border-bottom
  [Promo] [Rewards] [Outlet] [Bantuan]

[─── separator: bg-polks-bg ───]

[Content sections] px-4 pt-4 flex-col gap-4
  - Tier progress card (jika nextTier ada)
  - Voucher Aktif (jika ada)
  - Reward untuk Kamu
  - Promo & Berita
```

### Detail Komponen

**Banner overlay:**
- Logo: `icon.png` h-6 + teks "POLKS" font-black text-white drop-shadow
- Bell: rounded-full bg-black/20 backdrop-blur-sm, dot notif warna putih
- Positioning: `absolute inset-x-4 top-[64px] z-20` (top-[64px] = mt-3(12) + CUP_ABOVE(52))

**Member info row** (`px-4 pt-4 pb-3 bg-white flex items-center justify-between`):
- Kiri: nama bold + tier badge (pill dengan warna tierMeta)
- Kanan: Ticket icon + voucher count + Star icon gold + animatedPts + "pts" label

**Big buttons** (`px-4 pb-3 bg-white grid grid-cols-2 gap-2.5`):
- Kartu Member: `bg-polks-brand rounded-2xl py-4`, QrCode icon putih, label putih
- Voucher Saya: `bg-polks-surface rounded-2xl py-4`, Ticket icon navy, label navy

**Quick actions** (`bg-white grid grid-cols-4 divide-x border-y border-polks-border`):
- Promo → `/promos` → Tag icon
- Rewards → `/rewards` → Gift icon
- Outlet → `/outlets` → MapPin icon
- Bantuan → `/help` → Headphones icon
- Style per item: `flex flex-col items-center gap-1.5 py-3`

**Tier progress card** (`rounded-xl border border-polks-border bg-white p-3`):
- Tampil jika `nextTier !== null`
- Row: "Menuju [TierName]" | "[monthly] / [min]"
- Progress bar: `h-1.5 rounded-full bg-polks-brand`
- Label bawah: "[remaining] lagi untuk naik tier"

### Yang Dihapus
- Topbar putih dengan QR button (diganti overlay di banner)
- Split member card widget (left/right)
- Old quick actions grid di bawah member card

### Yang Dipertahankan
- PromoBanner (cup animation tetap ada)
- `useCountUp` untuk animasi angka poin
- Semua API calls (`/vouchers`, `/promos`, `/outlets`, `/member/notifications/unread-count`)
- CustomerShell dengan `showHeader={false}`
- Bottom nav via CustomerShell

---

## 2. Guest Landing (`/`)

### Struktur

```
[PromoBanner] — full width, mt-0 (tidak ada topbar di atas)
  overlay top-left: POLKS icon + "POLKS" teks putih

[Join CTA card] — white bg, px-5 py-5
  "Kumpulkan poin dari setiap cangkir."
  [  Daftar Gratis  ]  (full-width, bg-polks-brand)
  Sudah punya akun? [Masuk]

[Cara Kerjanya] — rounded card, white bg
  1. Tunjukkan QR member ke kasir
  2. Poin masuk otomatis tiap transaksi
  3. Tukar poin jadi reward pilihan

[Promo section] — horizontal scroll cards
[Reward section] — horizontal scroll (terkunci login)
[Outlet section] — list card
[Value props] — checklist card

[Bottom nav pill] — 3 item: Home | Outlet | Daftar
```

### Yang Dihapus
- QR button dari header guest
- Topbar terpisah (diganti overlay di banner)
- Quick actions grid (Promo/Outlet/Bantuan)

---

## Files yang Diubah

| File | Perubahan |
|---|---|
| `src/app/dashboard/page.tsx` | Restruktur penuh per pola Tomoro |
| `src/app/page.tsx` | Hapus topbar, banner di atas, join CTA langsung di bawah |

## Yang Tidak Berubah

- `PromoBanner` component (tidak dimodifikasi)
- Design tokens, CSS global
- Semua route dan API calls
- CustomerShell, bottom nav
