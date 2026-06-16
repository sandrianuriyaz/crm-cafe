# Spec: Login Magic-Link via WhatsApp

Tanggal: 2026-06-16
Status: Disetujui
Konteks: Mengganti login OTP-code WhatsApp dengan alur "magic link" ala TOMORO —
user kirim pesan WA berisi token, backend balas link, app auto-login.

## Keputusan (terkunci)
1. **Auto-login tab asal** (polling) + link tetap bisa diklik (login device mana pun).
2. **Ganti total** alur OTP-code di UI WhatsApp → link. Endpoint OTP lama dibiarkan
   di backend (tak dipakai UI).
3. Tidak ada input nomor HP di `/login` (nomor didapat dari pengirim pesan WA).

## Alur
1. `/login` klik WhatsApp → `POST /auth/wa-link/request` → backend buat
   `WaLoginRequest` (token acak panjang, TTL 15 mnt) → balas `{ token, waUrl }`.
   `waUrl = https://wa.me/<WHATSAPP_BUSINESS_NUMBER>?text=<pesan + token>`.
2. Frontend `window.open(waUrl)`, simpan token ke sessionStorage, ke `/wa-login`.
3. User kirim pesan → Twilio `POST /webhooks/whatsapp/inbound` → backend cocokkan
   token dari `Body`, ambil `From` (nomor), tandai `claimedAt` + simpan phone,
   **balas TwiML** berisi `https://<FRONTEND_URL>/wa-login?r=<token>`.
4. Login (token sama, single-use):
   - tab asal polling `POST /auth/wa-link/exchange { token }` → saat `claimed` dapat
     `access_token`+user → auto masuk.
   - atau klik link → `/wa-login?r=token` → exchange → login.

## Backend — modul `src/wa-login/`
### Prisma (1 migrasi)
```prisma
model WaLoginRequest {
  id         String    @id @default(cuid())
  token      String    @unique
  phone      String?
  claimedAt  DateTime?
  consumedAt DateTime?
  expiresAt  DateTime
  createdAt  DateTime  @default(now())
  @@index([phone])
  @@map("wa_login_requests")
}
```
### Endpoint
- `POST /auth/wa-link/request` → `{ token, waUrl }` (token = 24 hex acak).
- `POST /auth/wa-link/exchange { token }` → status:
  - `pending` (belum claimed), `expired`, `consumed`,
  - `ok` → tandai `consumedAt`, balas `{ status:'ok', access_token, user }`
    via `AuthService.loginByPhone(phone)`.
- `POST /webhooks/whatsapp/inbound` (form-urlencoded `From`,`Body`):
  - ambil token (regex) dari Body, cari request pending tak-expired, set
    `claimedAt`+`phone`. Balas **TwiML** `text/xml` berisi link login.
  - validasi `X-Twilio-Signature` (HMAC-SHA1 ala Twilio) bila `TWILIO_AUTH_TOKEN`
    ada; dilewati bila tidak (sandbox/dev). Dikecualikan dari prefix `/api/v1`.

### Env baru
- `WHATSAPP_BUSINESS_NUMBER` (E.164 tanpa `+`; default dari `TWILIO_WHATSAPP_FROM`).
- `FRONTEND_URL` (mis. `http://localhost:3001`) untuk link balasan.

## Frontend
- `lib/api.ts`: `requestWaLink()`, `exchangeWaLink(token)`.
- `lib/auth.tsx`: `loginWithWaToken(token)` → exchange; bila `ok` set token+user,
  balas `{ status, user? }`.
- `components/auth/phone-otp-actions.tsx` → jadi tombol WhatsApp (tanpa input nomor)
  + SMS disabled. Klik WA: request → `window.open(waUrl)` → simpan token → `/wa-login`.
- Halaman baru `/wa-login`:
  - `?r=token` → langsung exchange (jalur klik).
  - else token dari sessionStorage → polling tiap 3 dtk (timeout 15 mnt).
  - `ok` → `/dashboard` (atau `/complete-profile` bila `user.name` kosong).
  - tampilkan state: menunggu / berhasil / kedaluwarsa + tombol "buka WhatsApp lagi".
- `verify-account` (OTP code) tak lagi ditautkan.

## Keamanan
- Token 24 hex (unguessable), TTL 15 mnt, sekali pakai, hanya bisa ditukar setelah
  pesan WA membawanya masuk. Inbound webhook validasi signature Twilio.
- Race poll-vs-klik: yang exchange duluan menang; lainnya dapat `consumed`.

## Testing
- Unit backend (mock Prisma + reply): request bikin token+waUrl; inbound claim;
  exchange pending/ok/consumed/expired.
- Frontend `tsc`+`lint`. End-to-end perlu backend deploy + inbound webhook Twilio
  dikonfigurasi (sandbox: penguji harus `join`).

## Di luar scope
- Nomor WhatsApp bisnis resmi (produksi).
- Menghapus kode/endpoint OTP lama (dibiarkan sebagai dead-but-present).
