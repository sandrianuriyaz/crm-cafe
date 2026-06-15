# Spec: Auth OTP (WhatsApp + SMS via Twilio)

Tanggal: 2026-06-15
Status: Disetujui (siap implementasi)
Konteks: `docs/BACKEND-TODO.md` → 🔴 WAJIB — Auth OTP. Memblokir alur login Figma
(OTP) yang sekarang ditambal dev-bridge di `frontend/src/app/verify-account/page.tsx`.

## Tujuan

Menyediakan login/registrasi tanpa password lewat OTP WhatsApp/SMS:
- `POST /auth/otp/request` — kirim kode 6 digit (TTL 5 menit).
- `POST /auth/otp/verify` — validasi kode; nomor baru → buat `User`+`Member` otomatis;
  balas `access_token` + profil (bentuk sama dengan `/auth/login` & `/auth/register`).

## Keputusan desain (terkunci)

1. **Provider**: Twilio (WhatsApp + SMS). Dipanggil lewat interface `OtpSender`,
   implementasi konkret `TwilioOtpSender`. Kredensial dari `.env`, tidak di-hardcode.
2. **Skema User**: `email` & `passwordHash` jadi nullable. User OTP tidak punya
   keduanya. Login email/password ditambah guard: `passwordHash` null → ditolak.

## Perubahan skema Prisma (1 migrasi)

```prisma
model User {
  // ...
  email        String?  @unique   // sebelumnya String
  passwordHash String?            // sebelumnya String
}

model OtpCode {
  id         String    @id @default(cuid())
  phone      String    // kanonik 08xxx
  codeHash   String    // bcrypt; kode plain tidak disimpan
  channel    String    // whatsapp | sms
  expiresAt  DateTime
  consumedAt DateTime?
  attempts   Int       @default(0)
  createdAt  DateTime  @default(now())

  @@index([phone])
  @@map("otp_codes")
}
```

## Komponen

### `src/common/phone.util.ts`
- `normalizePhone(raw)` → kanonik lokal `08xxxxxxxxxx` untuk simpan/match DB
  (konsisten dengan `Member.phone` existing). Tolak input tak valid.
- `toE164(canonical)` → `+62xxxxxxxxxx` untuk dikirim ke Twilio.

### `src/auth/otp/otp-sender.ts`
- `interface OtpSender { send(params: { phone: string; channel: Channel; code: string }): Promise<void> }`
- `TwilioOtpSender implements OtpSender` — POST ke
  `https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages.json` (Basic Auth
  `SID:AUTH_TOKEN`, body form-urlencoded). `whatsapp` → `From/To` prefix `whatsapp:`,
  `sms` → nomor biasa. Env hilang → lempar error jelas saat kirim (boot tetap jalan).
- Token DI: `OTP_SENDER`.

### `src/auth/otp/otp.service.ts`
- `request(phone, channel)`:
  - normalisasi phone; cooldown resend 30 dtk (tolak bila kode aktif < 30 dtk lalu);
    batas 5 request/jam/nomor.
  - generate 6 digit acak (`crypto`), hash bcrypt, simpan `expiresAt = now+5m`.
    Tandai kode lama nomor itu consumed (invalidasi).
  - panggil `OtpSender.send`. Response `{ success: true }`.
- `verify(phone, code)`:
  - ambil `OtpCode` terbaru nomor itu yang belum consumed & belum expired.
  - cek `attempts` (maks 5) — lampaui → invalidasi & tolak.
  - bandingkan bcrypt. Salah → `attempts++`, tolak. Benar → set `consumedAt`.
  - find-or-create `User`+`Member` by phone (pakai pola klaim member dari
    `AuthService.register`: klaim member POS tanpa userId bila ada).
  - balas via `AuthService.buildAuthResponse` (di-expose).

### DTO
- `RequestOtpDto { phone: string; channel: 'whatsapp' | 'sms' }`
- `VerifyOtpDto { phone: string; code: string (6 digit) }`
- Validasi class-validator (`@IsString`, `@IsIn`, `@Length(6,6)`).

### Controller
- Tambah `@Post('otp/request')` & `@Post('otp/verify')` (HttpCode 200) ke
  `AuthController`, delegasi ke `OtpService`.

### Module & env
- `AuthModule`: provider `OtpService` + `{ provide: OTP_SENDER, useClass: TwilioOtpSender }`.
- `buildAuthResponse` di `AuthService` diubah `private` → `public` (atau dipindah util)
  agar OtpService bisa pakai.
- `env.validation.ts`: tambah `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`,
  `TWILIO_WHATSAPP_FROM`, `TWILIO_SMS_FROM` — semua `.optional()` (boot tetap jalan
  tanpa kredensial; error muncul saat benar-benar kirim). Tambah konstanta OTP
  (TTL, panjang) sebagai konstanta kode, bukan env.

## Error handling
- Format error mengikuti `http-exception.filter.ts` existing
  (`{ success:false, error:{ message } }`).
- `request`: nomor invalid → 400; rate limit → 429.
- `verify`: kode salah/expired/habis attempts → 401 "Kode OTP salah atau kedaluwarsa"
  (pesan seragam, tidak bocorkan sebab pasti).

## Testing (Jest, mock Prisma + OtpSender)
- `otp.service.spec.ts`:
  - request: menyimpan `codeHash` (bukan plain) + memanggil `OtpSender.send`.
  - request: cooldown 30 dtk ditolak.
  - verify: kode salah menaikkan `attempts` & menolak.
  - verify: kode expired ditolak.
  - verify sukses: nomor baru → buat User+Member, balas `access_token`.
  - verify sukses: klaim member POS existing (userId null) by phone.
- `auth.service.spec.ts`: login dgn `passwordHash` null ditolak.
- `phone.util.spec.ts`: normalisasi 08/62/+62 → 08xxx; E.164 benar; input invalid ditolak.

## Catatan operasional
- Migrasi `prisma migrate` & test perlu DB/network nyala — dijalankan di environment
  user (dikonfirmasi saat eksekusi).
- Frontend belum dihubungkan di scope ini (dev-bridge tetap). Penggantian dev-bridge
  → panggilan OTP asli dilakukan terpisah setelah backend terverifikasi.
