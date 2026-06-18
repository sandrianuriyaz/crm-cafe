# Review: Data dari POS (Kasir.ai) untuk CRM POLKS

Analisis seluruh tampilan CRM → **data apa yang perlu datang dari POS** vs yang
dikelola CRM sendiri. (Permintaan mentor 2026-06-18.)

**Prinsip pembagian:**
- **POS (Kasir.ai)** = sumber kebenaran **transaksi, outlet, produk, diskon di kasir**.
- **CRM (kita)** = member/akun, **poin & ledger**, reward, voucher, promo (marketing), tier.

---

## 1. Transaksi POS — PALING UTAMA (via webhook)
Tiap transaksi di kasir dikirim ke CRM. Field yang dibutuhkan per transaksi:
- `storeId`/outlet, nomor order, **grand total**, daftar item (produk, qty, harga),
  metode bayar, waktu, dan **identitas member** (hasil scan QR / nomor HP).

**Dipakai di:** Riwayat poin (`/history`), Admin Transactions / Webhook Inbox /
Idempotency / POS Sync, perhitungan poin & tier, statistik admin.
**Status:** endpoint sudah ada (`POST /webhooks/pos/transactions`). **Perlu dipastikan
Kasir.ai mengirim field-field di atas — terutama identitas member.**

## 2. Poin (turunan dari transaksi, bukan kiriman langsung)
CRM menghitung poin dari grand total (rumus `rupiahPerPoint`). POS cukup kirim nominal.
**Dipakai di:** saldo poin (dashboard, member card, profil), ledger poin (history).

## 3. Tier member
Dihitung dari **akumulasi belanja** (Rp) → butuh total transaksi dari POS.
**Dipakai di:** badge tier (dashboard/profil/member card).

## 4. Outlet / Store
Daftar outlet: nama, kota, alamat, jam buka, `storeId`.
**Dipakai di:** `/outlets`, label outlet di transaksi & promo, admin outlets.
**Status:** model `Outlet` sudah ada di CRM (input manual admin). Idealnya **`storeId`
disinkronkan dengan POS** agar transaksi ter-map ke outlet yang benar.

## 5. Diskon / Promo — ❗ MASIH STATIC, butuh keputusan
"Diskon Kopi Susu 20%", "Buy 1 Get 1 Latte" dll **masih hardcoded** di UI (banner &
"Promo Hari Ini" dashboard, "Promo Aktif" home).
**Pertanyaan kunci:** siapa pemilik promo?
- Jika **diskon dijalankan di POS** (Kasir.ai punya engine promo) → daftar promo aktif
  sebaiknya **diambil/sinkron dari POS** supaya yang tampil = yang benar berlaku di kasir.
- Jika **CRM yang kelola promo** (sudah ada `admin/promos` + `GET /promos`) → tidak perlu
  POS, tinggal sambungkan UI yang masih static ke `/promos`.

## 6. Penukaran voucher/reward di kasir
Saat member pakai voucher / reward (mis. "Free Americano") di kasir, POS perlu:
- **validasi kode voucher** ke CRM, lalu
- **lapor voucher terpakai** → CRM tandai `USED`.
**Status:** belum ada. CRM saat ini tidak tahu kapan voucher dipakai di kasir.

## 7. Produk / Menu (opsional)
Untuk reward berbasis produk & promo per-produk, CRM butuh **katalog produk** dari POS.
**Status:** belum dipakai; reward sekarang generik.

---

## Ringkasan: yang masih STATIC di UI (perlu disambungkan)
| Tampilan | Sekarang | Sumber idealnya |
|---|---|---|
| Banner promo & "Promo Hari Ini" (dashboard) | hardcoded | CRM `/promos` **atau** POS |
| "Promo Aktif" (home guest) | hardcoded | sama ↑ |
| Reward catalog | sudah API (CRM) | CRM ✅ |
| Poin, tier, member QR | sudah API (CRM) | CRM (poin/tier berbasis data POS) ✅ |
| Outlet | sudah API (CRM) | CRM, idealnya sinkron `storeId` POS |
| Riwayat transaksi/poin | sudah API | dari transaksi POS ✅ |
| "Cara Kerjanya" (home) | statis | konten edukasi — wajar statis |

## Pertanyaan untuk mentor (biar arah jelas)
1. **Promo/diskon** dikelola di CRM (admin) atau di POS Kasir.ai? (menentukan promo
   ditarik dari mana)
2. Apakah payload transaksi Kasir.ai **menyertakan identitas member** (QR/HP)? Boleh
   minta contoh payload / dokumentasi API-nya.
3. Outlet & produk: **sinkron dari Kasir.ai** atau input manual di CRM?
4. Voucher reward: apakah **divalidasi & ditandai-pakai di kasir** lewat CRM?

> Untuk memverifikasi bentuk data, perlu akses **dokumentasi/API Kasir.ai** atau contoh
> payload (mentor menyebut `app.kasir.ai`).
