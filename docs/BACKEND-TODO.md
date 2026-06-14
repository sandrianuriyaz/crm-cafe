# Backend TODO — POLKS CRM (untuk Alif)

Daftar endpoint/fitur backend yang masih dibutuhkan frontend. Disusun dari hasil
integrasi UI → API. Dikelompokkan per prioritas. Base URL: `/api/v1`.

> Frontend memanggil API lewat Bearer token (`Authorization: Bearer <jwt>`),
> response sukses tidak dibungkus (kirim data langsung), error dibungkus
> `{ success:false, error:{ message } }`.

---

## ✅ Sudah ada (tidak perlu dibuat lagi)

- **Auth**: `POST /auth/login` (email+password), `POST /auth/register`, `GET /auth/me`
- **Member**: `GET /member/profile`, `/member/points`, `/member/qr`, `/member/transactions`, `/member/point-histories`
- **Rewards**: `GET /rewards`, `GET /rewards/:id`, `POST /rewards/:id/redeem`, `GET /vouchers`, `GET /redeems`
  - Admin: `GET/POST/PATCH/DELETE /admin/rewards`
- **Promos**: `GET /promos`, `GET /promos/:id`
  - Admin: `GET/POST/PATCH/DELETE /admin/promos`
- **Admin**: `GET /admin/members`, `GET /admin/members/:id`, `POST /admin/members/:id/adjust-points`, `GET /admin/transactions`
- **Webhook POS**: `POST /webhooks/pos/transactions`

---

## 🔴 WAJIB — Auth OTP (WhatsApp / SMS)

Halaman `/login`, `/register`, `/verify-account` sudah pakai alur OTP, tapi belum
ada backend-nya. **Sementara** frontend menambal dengan login email/password akun
seed (lihat `verify-account/page.tsx`, blok "Dev bridge").

- `POST /auth/otp/request`
  - body: `{ "phone": "08xxxx", "channel": "whatsapp" | "sms" }`
  - aksi: generate kode 6 digit (TTL ~5 menit), kirim via WA/SMS
  - response: `{ "success": true }` (jangan bocorkan kode)
- `POST /auth/otp/verify`
  - body: `{ "phone": "08xxxx", "code": "123456" }`
  - aksi: validasi kode; kalau nomor baru → buat User+Member otomatis
  - response: `{ "access_token": "...", "user": { id, role, name, memberCode, pointBalance } }`

Setelah ini ada, hapus dev-bridge di frontend dan arahkan tombol "Verifikasi" ke `/auth/otp/verify`.

---

## 🟠 Modul Admin (halaman sudah jadi, masih placeholder)

Semua route admin di bawah perlu role `ADMIN`.

### Loyalty Config — `/admin/config`
- `GET /admin/loyalty-config` → `{ rupiahPerPoint, pointsPerUnit, pointExpiry, tierThresholds[], webhookUrl, requireIdempotencyKeys }`
- `PATCH /admin/loyalty-config`

### Overview / Dashboard stats — `/admin`
- `GET /admin/stats` → `{ totalMembers, totalTransactions, pointsIssued, pointsRedeemed, activeOutlets, pointsFlow[] }`
- Sekarang frontend menghitung kasar dari `count` members & transaksi.

### Outlets — `/admin/outlets` & customer `/outlets`
- Model **Outlet** `{ id, name, city, address, hours, phone, status }`
- `GET /outlets` (publik/member), `GET/POST/PATCH/DELETE /admin/outlets`
- Sekarang outlet masih hardcoded di frontend.

### Vouchers (admin) — `/admin/vouchers`
- `GET /admin/vouchers` → semua voucher lintas member `{ code, memberName, reward, status, expiredAt, usedAt }`
- `PATCH /admin/vouchers/:id` → tandai `USED`

### Redeem History (admin) — `/admin/redeem-history`
- `GET /admin/redeems` → riwayat penukaran semua member (paginated)

### Webhook Inbox — `/admin/webhook`
- `GET /admin/webhooks` → log event POS masuk (model `pos_sync_logs` sudah ada), filter status/tanggal

### Idempotency — `/admin/idempotency`
- `GET /admin/idempotency-keys` → daftar key + status (untuk audit anti-duplikat)

### POS Sync — `/admin/pos-sync`
- `GET /admin/pos-sync` → status sinkronisasi per outlet
- (opsional) `POST /admin/pos-sync/retry`

### Broadcast — `/admin/broadcast`
- `POST /admin/broadcast` → `{ title, message, target }` kirim notif/promo ke member

### Group — `/admin/group`
- Model Group/brand + `GET/POST/PATCH/DELETE /admin/group`

### Settings — `/admin/settings`
- `GET/PATCH /admin/settings` (pengaturan umum panel)

---

## 🟡 Penyempurnaan (opsional, dipakai UI)

- **Edit profil**: `PATCH /member/profile` `{ name?, phone? }` — halaman *Informasi Akun* (`/profile/account`) sekarang read-only.
- **Kategori reward**: tambah `category`/`type` + `outlet` + `validUntil` di model `Reward` — chip kategori & "All Outlets" di `/rewards` & `/rewards/[id]` masih statis.
- **Promo lengkap**: tambah `outlet`, `tag`, status `limited`/`upcoming` di `Promo` — sekarang cuma `ACTIVE`/`INACTIVE`.
- **Notifikasi**: simpan preferensi member + pengiriman push/WA — `/notifications` masih UI-only.
- **Tier resmi**: penetapan tier di backend (assign `Member.tier`) — sekarang dihitung di frontend dari saldo poin (`getTier`: silver <1000, gold <5000, platinum ≥5000).
- **Upload gambar reward**: endpoint upload (form admin reward sekarang pakai input URL).

---

## Catatan integrasi frontend

- Token disimpan di `localStorage` key `crm_token`.
- Pagination memakai bentuk `{ total, skip, take, items[] }`.
- `GET /member/qr` mengembalikan `{ image_data_url }` (data URL QR).
- Akun seed dev: customer `sandria@polks.test` / `password123`, admin `admin@polks.test` / `admin12345`.
