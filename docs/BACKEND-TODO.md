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
- **Auth OTP**: `POST /auth/otp/request`, `POST /auth/otp/verify` (Twilio WA/SMS) — ✅ selesai 2026-06-15, lihat di bawah.

---

## ✅ SELESAI — Auth OTP (WhatsApp / SMS via Twilio)

> Implementasi 2026-06-15. Spec: `docs/superpowers/specs/2026-06-15-auth-otp-design.md`.

- `POST /auth/otp/request` — body `{ "phone": "08xxxx", "channel": "whatsapp" | "sms" }`.
  Generate kode 6 digit (TTL 5 menit, di-hash bcrypt), kirim via Twilio.
  Cooldown resend 30 dtk + maks 5 req/jam/nomor. Response `{ "success": true }`.
- `POST /auth/otp/verify` — body `{ "phone": "08xxxx", "code": "123456" }`.
  Validasi kode (maks 5 percobaan/kode); nomor baru → buat `User`+`Member` otomatis
  (klaim member POS by phone bila ada). Response
  `{ "access_token": "...", "user": { id, role, name, memberCode, pointBalance } }`.

Catatan:
- Skema `User.email` & `User.passwordHash` kini **nullable** (user OTP tak punya
  keduanya). Login email/password menolak user tanpa `passwordHash`.
- Butuh env `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`,
  `TWILIO_SMS_FROM` (lihat `.env.example`). Tanpa ini, `request` menolak saat kirim.
- **Sisa pekerjaan frontend** (di luar backend): hapus dev-bridge di
  `verify-account/page.tsx` & arahkan tombol "Verifikasi" ke `/auth/otp/verify`,
  serta kirim `phone`+`channel` ke `/auth/otp/request` dari halaman login/register.

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
