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
- **Frontend sudah tersambung** (2026-06-15): dev-bridge dihapus; login/register
  punya input nomor → `/auth/otp/request`, `verify-account` → `/auth/otp/verify`.
  Channel SMS sementara dinonaktifkan di UI (nomor SMS Twilio belum ada). Spec:
  `docs/superpowers/specs/2026-06-15-frontend-otp-wiring-design.md`.

---

## ✅ SELESAI — Google OAuth (login/register) — 2026-06-16

> Keputusan: login & register pakai email + password **+ tombol "Lanjut dengan Google"**.
> Integrasi WhatsApp/OTP tidak dipakai di alur login (file OTP/WA frontend ditinggalkan).

- ✅ `GET /auth/google` → mulai OAuth (passport-google-oauth20), redirect ke Google.
- ✅ `GET /auth/google/callback` → `AuthService.loginByGoogle`: buat/temukan `User`
  by email (`passwordHash` null) + `Member`, terbitkan JWT, **redirect ke frontend**:
  `${FRONTEND_URL}/auth/callback?token=<jwt>` (atau `?error=google_login_failed`).
- Env: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `FRONTEND_URL`
  (opsional saat boot; wajib agar OAuth jalan). Callback yang didaftarkan di Google
  Console harus = `{API}/api/v1/auth/google/callback`.
- Frontend sudah tersambung: tombol `/login` & `/register` → `${API}/auth/google`;
  `/auth/callback` menyimpan token lalu ke `/dashboard`.

---

## 🟠 Modul Admin (halaman sudah jadi, masih placeholder)

Semua route admin di bawah perlu role `ADMIN`.

### ✅ Loyalty Config — `/admin/config` — SELESAI 2026-06-15
- `GET/PATCH /admin/loyalty-config` (singleton `LoyaltyConfig`).
- `rupiahPerPoint` dipakai di perhitungan earning webhook (fallback env `POIN_PER_RUPIAH`).

### ✅ Overview / Dashboard stats — `/admin` — SELESAI 2026-06-15
- `GET /admin/stats` → `{ totalMembers, totalTransactions, pointsIssued, pointsRedeemed, activeOutlets, pointsFlow[] }`
- `pointsFlow` = 6 bulan terakhir `{ month, issued, redeemed }`.

### ✅ Outlets — `/admin/outlets` & customer `/outlets` — SELESAI 2026-06-15
- Model `Outlet { name, city, address, hours, phone, status, storeId? }` (`storeId` map ke POS).
- `GET /outlets` (publik, ACTIVE), `GET/POST/PATCH/DELETE /admin/outlets` (ADMIN).

### ✅ Vouchers (admin) — `/admin/vouchers` — SELESAI 2026-06-15
- `GET /admin/vouchers` (+ filter `status`) → `{ id, code, memberName, reward, status, expiredAt, usedAt, createdAt }`
- `PATCH /admin/vouchers/:id` → tandai `USED` (hanya dari status ACTIVE)

### ✅ Redeem History (admin) — `/admin/redeem-history` — SELESAI 2026-06-15
- `GET /admin/redeems` → riwayat penukaran semua member (paginated)

### ✅ Webhook Inbox — `/admin/webhook` — SELESAI 2026-06-15
- `GET /admin/webhooks` → log `PosSyncLog`, filter `status`/`from`/`to`

### ✅ Idempotency — `/admin/idempotency` — SELESAI 2026-06-15
- `GET /admin/idempotency-keys` → daftar dari tabel `Transaction` (kunci dedup)

### 🟡 POS Sync — `/admin/pos-sync` — SEBAGIAN 2026-06-15
- `GET /admin/pos-sync` → ringkasan per `storeId` (groupBy transaksi). Per-outlet
  penuh menunggu model `Outlet`. Endpoint retry dilewati (webhook bersifat push).

### Broadcast — `/admin/broadcast`
- `POST /admin/broadcast` → `{ title, message, target }` kirim notif/promo ke member

### Group — `/admin/group`
- Model Group/brand + `GET/POST/PATCH/DELETE /admin/group`

### Settings — `/admin/settings`
- `GET/PATCH /admin/settings` (pengaturan umum panel)

---

## 🟡 Penyempurnaan (opsional, dipakai UI)

- ✅ **Edit profil** (SELESAI 2026-06-15): `PATCH /member/profile` `{ name?, phone? }` —
  phone disinkron ke `User.phone` (login OTP). Wiring halaman *Informasi Akun* menyusul.
  - 🟡 **Lengkapi profil (onboarding)**: halaman `/complete-profile` muncul setelah
    register OTP (user baru belum punya nama). Form mengirim `name` (tersimpan) +
    opsional `email`, `birthDate`, `gender` — **3 field terakhir belum dipersist**
    (saat ini di-strip backend). Tolong tambah field `email`/`birthDate`/`gender`
    di `Member` + `PATCH /member/profile` bila ingin disimpan.
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
