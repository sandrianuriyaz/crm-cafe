# Spec: Riwayat Pesanan (Order History)

Tanggal: 2026-07-07
Status: Disetujui
Konteks: Member perlu bisa lihat riwayat pesanan yang pernah dibuat di POS (Kasir.ai),
lengkap dengan harga, item, dan poin yang didapat. Data transaksi POS sudah masuk ke
tabel `Transaction`/`TransactionItem` lewat webhook `POST /webhooks/pos/transactions`;
endpoint baca (`GET /member/transactions`) juga sudah ada tapi belum pernah dipakai
frontend dan field-nya belum lengkap (belum ada nama outlet).

## Backend — extend `GET /member/transactions` (tanpa migrasi)

`backend/src/member/member.service.ts` — `getTransactions(userId, skip, take)`:
- Tambah `storeId`, `status` ke `select` pada `transaction.findMany` (field sudah
  ada di model `Transaction`, cuma belum di-select).
- Setelah dapat `items`, kumpulkan `storeId` unik (skip null), query
  `prisma.outlet.findMany({ where: { storeId: { in: [...] } } })` sekali
  (`Outlet.storeId` sudah `@unique`, jadi lookup langsung tanpa relasi FK baru).
- Bangun map `storeId → outlet.name`, lalu mapping tiap item transaksi jadi tambah
  field `outletName: string | null` (null kalau `storeId` tidak match outlet manapun
  di CRM — tampilkan fallback di frontend, bukan error).
- Response tetap bentuk `{ total, skip, take, items }`. Field baru di tiap item:
  `outletName`, `status`. Field lama (`posOrderNumber`, `grandTotal`, `paymentMethod`,
  `pointsAwarded`, `occurredAt`, `createdAt`, `items[]` per pesanan) tidak berubah.

Tidak ada consumer lain endpoint ini saat ini, jadi aman untuk extend `select`
tanpa breaking change.

## Frontend — tipe data

`frontend/src/lib/loyalty/types.ts` — tambah:
```ts
export type Transaction = {
  id: string;
  posOrderNumber: string | null;
  outletName: string | null;
  status: string | null;
  grandTotal: number;
  paymentMethod: string | null;
  pointsAwarded: number;
  occurredAt: string | null;
  createdAt: string;
  items: { name: string; qty: number; lineTotal: number; isReward: boolean }[];
};
```

## Frontend — halaman baru `frontend/src/app/order-history/page.tsx`

Ikuti pola `history/page.tsx` (struktur halaman, loading/error/401 handling) +
tampilan visual dari mockup `design-ref/.../TransactionHistory.tsx` (kartu per
transaksi, filter outlet).

- Header navy + tombol back (`router.back()`) + judul "Riwayat Pesanan".
- 2 stat chip di header: **Jumlah Pesanan** = field `total` dari response API
  (angka pasti, bukan cuma yang sudah termuat) dan **Total Belanja** = jumlah
  `grandTotal` dari transaksi yang *sudah termuat* saja (bertambah seiring scroll,
  sama seperti pola "Total Diperoleh" di `history/page.tsx`; ini bukan bug — hitung
  total belanja eksak lintas semua halaman butuh endpoint agregat baru yang di luar
  scope spec ini).
- Wave divider SVG (sama seperti halaman lain).
- Filter chip outlet (horizontal scroll, `[&::-webkit-scrollbar]:hidden`): "Semua" +
  nama outlet unik dari transaksi yang sudah dimuat (bukan semua outlet di sistem).
- List card per pesanan (collapsed by default):
  - Baris atas: ikon toko, `outletName` (fallback "Outlet tidak diketahui" kalau
    null), tanggal+jam (`occurredAt` fallback `createdAt`), `+pointsAwarded` poin.
  - Baris bawah (bg lebih terang, border-top): `posOrderNumber` (sembunyikan baris
    ini kalau null), badge `paymentMethod`, `grandTotal` (format rupiah), badge
    `status` kalau ada.
  - Klik card → expand, tampilkan daftar `items[]`: nama, qty, harga per baris
    (`lineTotal`). Item dengan `isReward: true` → harga ditampilkan "Gratis", bukan
    angka `lineTotal` mentah.
- Infinite scroll: `IntersectionObserver` pada sentinel div di akhir list. Saat
  terlihat & belum `loadingMore` & `items.length < total` → fetch
  `/member/transactions?skip=<items.length>&take=20`, append ke state. Berhenti
  otomatis begitu `items.length >= total`.
- Loading awal: skeleton card (pola sama seperti `history/page.tsx`).
- Loading tambahan (infinite scroll): spinner kecil di bawah list.
- Empty state: "Belum ada riwayat pesanan." (kalau `entries.length === 0` total)
  vs "Tidak ada pesanan di outlet ini." (kalau kosong karena filter outlet aktif).
- Error state: pesan + tombol "Coba lagi" (retry `load()`), pola sama seperti
  `history/page.tsx`.
- 401 → `router.replace("/login")`, pola sama seperti halaman lain.

## Entry points — Dashboard & Profile

`frontend/src/app/dashboard/page.tsx`:
- Baris "2 tombol besar": tombol `Kartu Member` (icon `QrCode`, link `/member-card`)
  **diganti** jadi `Rewards` (icon `Gift`, link `/rewards`). `Voucher Saya` tetap.
  (Kartu Member tidak hilang — sudah ada tab tersendiri di bottom navbar.)
- Grid "4 quick actions": slot `Rewards` (icon `Gift`, link `/rewards`) **diganti**
  jadi `Riwayat` (icon `History` dari `lucide-react`, link `/order-history`).
  Urutan baru: `Promo`, `Riwayat`, `Outlet`, `Bantuan`.

`frontend/src/app/profile/page.tsx`:
- Tambah item menu baru "Riwayat Pesanan" (icon `Receipt`) di section yang sama
  dengan "Pusat Bantuan", link ke `/order-history`.

## Testing / Verifikasi

Pakai skill `verify` setelah implementasi selesai (bukan cuma typecheck):
- Jalankan backend + frontend dev server sekaligus (butuh data transaksi asli
  dari database, bukan mock).
- Buka `/order-history` dari Dashboard dan dari Profile, cocokkan data yang tampil
  (nama outlet, total, item) dengan hasil `GET /member/transactions` langsung.
- Uji filter outlet, expand item minimal 1 pesanan.
- Uji infinite scroll kalau data cukup banyak untuk overflow; kalau data test
  terbatas, laporkan keterbatasannya secara eksplisit alih-alih dipaksakan.
- Uji empty state dengan filter outlet yang tidak match apapun.
- Screenshot tombol besar & quick actions dashboard yang sudah diubah, pastikan
  urutan/label/ikon sesuai spec ini.
