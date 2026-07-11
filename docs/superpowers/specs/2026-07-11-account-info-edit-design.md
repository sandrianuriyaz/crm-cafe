# Spec: Edit Informasi Akun (Nama, Email, No. HP)

Tanggal: 2026-07-11
Status: Disetujui
Konteks: Item #19 backlog notulensi mentor 2026-07-07 — "nama, email, nomor hp
bisa diubah di informasi akun". Halaman `frontend/src/app/profile/account/page.tsx`
saat ini 100% read-only ("hubungi admin untuk ubah data").

## Keputusan (terkunci)

1. **Nama & No. HP** — edit langsung, tanpa konfirmasi tambahan. Endpoint
   `PATCH /member/profile` sudah mendukung ini (cek keunikan No. HP), tinggal
   dipakai dari UI baru.
2. **Email** — butuh konfirmasi link ke email baru sebelum berlaku (reuse pola
   `EMAIL_VERIFY` yang sudah ada). Email lama tetap dipakai login sampai
   dikonfirmasi.
3. **Akun Google-only** (tidak punya `passwordHash`) — field Email **dikunci**
   (read-only) di UI, dan endpoint request menolak dengan `BadRequestException`.
   Alasan: login Google dicocokkan murni via `User.email` (tidak ada `googleId`
   terpisah di skema) — kalau email diubah, login Google berikutnya tidak akan
   menemukan akun ini lagi.
4. **Dampak ke POS**: dicek, aman.
   - Email tidak pernah dikirim/dipakai POS sama sekali.
   - Nama & No. HP: webhook `transaction.completed` (`webhooks.service.ts`
     `upsertMember`) cuma **mengisi field yang masih kosong**
     (`member.name ?? name`, `member.phone ?? phone`) — tidak pernah menimpa
     data yang sudah ada. Perubahan dari app tidak akan ke-revert oleh transaksi
     POS berikutnya.
   - Satu edge case yang **sengaja tidak dimitigasi** di scope ini: kalau kasir
     tidak scan QR member (matching fallback ke `phone`) untuk transaksi yang
     terjadi setelah user ganti No. HP di app, transaksi itu bisa membuat member
     baru terpisah alih-alih match ke akun lama. Ini karakteristik desain
     matching yang sudah ada sebelumnya (lihat `docs/integrasi-crm.md` §3),
     bukan regresi dari fitur ini, dan dampaknya bukan kehilangan data (cuma
     1 transaksi walk-in nyasar ke member baru).
5. **UX**: satu tombol "Edit" membuka form penuh (bukan edit per-baris),
   konsisten dengan pola form lain di app (Register, Complete Profile).

## Prisma (1 migrasi)

```prisma
enum AuthTokenType {
  PASSWORD_RESET
  EMAIL_VERIFY
  EMAIL_CHANGE   // baru
}

model User {
  // ...existing fields...
  pendingEmail String? // baru — email baru menunggu konfirmasi, null bila tidak ada perubahan pending
}
```

`pendingEmail` **tidak** diberi constraint `@unique` di level DB (dicek di
level aplikasi saat request & saat confirm — race ditangkap lewat `P2002` pada
`User.email` yang memang unique).

## 1. Backend — `src/auth/`

### `POST /auth/email-change/request` (authed, throttle 3/60s)

Body: `{ email: string }` (`@IsEmail`).

1. Ambil `User` dari `userId` (current user).
2. Kalau `user.passwordHash === null` → `BadRequestException('Akun ini masuk lewat Google, email tidak bisa diubah di sini')`.
3. Normalisasi (`toLowerCase().trim()`). Kalau sama dengan `user.email` → `BadRequestException('Email baru sama dengan email saat ini')`.
4. Cek `User.findUnique({ where: { email } })` — kalau ada (dan bukan diri sendiri) → `ConflictException('Email sudah dipakai akun lain')`.
5. Transaksi:
   - `User.update`: set `pendingEmail = email`.
   - Invalidate token `EMAIL_CHANGE` lama yang `usedAt: null` milik user (`updateMany` → `usedAt: now`), pola sama seperti `sendEmailVerification`.
   - Buat `AuthToken` baru (`type: EMAIL_CHANGE`, `expiresAt: now + 24h`).
6. Kirim email ke **alamat baru** (bukan alamat lama): `mail.sendEmailChangeConfirmation(email, user.name, confirmUrl)`.
   `confirmUrl = ${FRONTEND_URL}/auth/confirm-email-change?token=${token}`.
7. Balas `{ message: 'Tautan konfirmasi dikirim ke email baru.' }`.

### `POST /auth/email-change/confirm` (public, throttle 10/60s)

Body: `{ token: string }`.

1. `consumeToken(token, AuthTokenType.EMAIL_CHANGE)` (helper yang sudah ada — cek hash, `expiresAt`, `usedAt`).
2. Ambil `User` dari `record.userId`. Kalau `user.pendingEmail === null` → token sudah tidak relevan (mis. dibatalkan) → `BadRequestException('Tidak ada perubahan email yang menunggu')`.
3. Transaksi:
   - `User.update`: `email = user.pendingEmail`, `pendingEmail = null`, `emailVerified = true`, `emailVerifiedAt = now`.
   - Tangkap `P2002` (email keburu dipakai user lain di antara request & confirm) → `ConflictException('Email sudah dipakai akun lain, minta ulang perubahan')`. `pendingEmail` **tidak** direset otomatis di kasus ini — biarkan usaha "kirim ulang" berikutnya gagal lagi di step validasi request sampai user pilih email lain (menghindari kompleksitas rollback tambahan).
   - `AuthToken.update`: `usedAt = now`.
4. Balas `{ message: 'Email berhasil diperbarui.', email: user.pendingEmail }`.

### `POST /auth/email-change/cancel` (authed)

1. `User.update`: `pendingEmail = null`.
2. Invalidate token `EMAIL_CHANGE` pending (`usedAt: now`).
3. Balas `{ message: 'Perubahan email dibatalkan.' }`.

## 2. Backend — `src/member/`

- `GET /member/profile` — tambah 2 field ke response: `pendingEmail: string | null` dan `hasPassword: boolean` (`!!user.passwordHash`, dipakai frontend untuk kunci field Email akun Google).
- `PATCH /member/profile` — **tidak berubah** (tetap hanya `name`, `phone`, `birthDate`).

## 3. Mail — `src/mail/mail.service.ts`

Method baru `sendEmailChangeConfirmation(to, name, confirmUrl)`, reuse `layout()` yang sudah ada (copy pola `sendEmailVerification`, subjek "Konfirmasi perubahan email POLKS", teks jelaskan ini email BARU, tautan berlaku 24 jam).

## 4. Frontend

### `app/profile/account/page.tsx`

- State `editing: boolean` + form state lokal (`name`, `phone`, `email`).
- Tombol **"Edit"** (di dalam kartu, bawah baris terakhir) → masuk mode edit:
  - Baris `Nama` & `No. HP` jadi `<input>`.
  - Baris `Email`: kalau `!hasPassword` → `<input disabled>` + teks kecil "Terhubung ke akun Google, tidak bisa diubah di sini"; kalau punya password → `<input>` biasa.
  - Member ID, Tier, Bergabung tetap read-only (bukan bagian dari scope ini).
- Tombol **"Simpan"**:
  1. Kalau `name` atau `phone` berubah dari nilai awal → `PATCH /member/profile`.
  2. Kalau `email` berubah dari nilai awal (dan field tidak disabled) → `POST /auth/email-change/request`.
  3. Tangani error per-field (mis. `ConflictException` No. HP / Email → tampil di bawah input terkait, bukan toast generik).
  4. Sukses → keluar mode edit, `load()` ulang, toast ringkas sesuai apa yang berubah.
- **Banner pending email** (di bawah kartu, mirip banner "Email belum diverifikasi" yang sudah ada): tampil kalau `p.pendingEmail` terisi —
  *"Perubahan email ke **{pendingEmail}** menunggu konfirmasi — cek inbox."*
  + tombol teks kecil "Kirim ulang" (`POST /auth/email-change/request` ulang dengan email yang sama) dan "Batalkan" (`POST /auth/email-change/cancel`).
- Hapus baris teks statis "Untuk mengubah data akun, hubungi admin POLKS atau pusat bantuan." (sudah tidak relevan begitu fitur ini ada) — ganti jadi teks kecil generik kalau perlu (mis. petunjuk field mana yang perlu verifikasi).

### Halaman baru: `app/auth/confirm-email-change/page.tsx`

Copy struktur `app/auth/verify-email/page.tsx` 1:1 (loading/success/error state, `Suspense` wrapper), ganti:
- Panggilan API → `POST /auth/email-change/confirm`.
- Teks sukses → "Email berhasil diperbarui! Login berikutnya pakai email baru."
- Link tombol sukses & error tetap ke `/profile/account`.

### `lib/auth.tsx` / tipe `User`

Tidak perlu perubahan tipe di context auth global — `hasPassword`/`pendingEmail` cukup dibaca dari response `/member/profile` di halaman ini saja (state lokal `MemberProfile`), sama seperti `emailVerified` sekarang.

## Testing (Jest, mock Prisma)

- `email-change.request`: sukses (set pendingEmail + kirim mail), tolak akun Google (`passwordHash` null), tolak email sama dengan saat ini, tolak email dipakai user lain, invalidate token lama saat request kedua.
- `email-change.confirm`: sukses (email ter-update, `pendingEmail` null, `emailVerified` true), token expired/used, `pendingEmail` null (sudah dibatalkan), race `P2002`.
- `email-change.cancel`: `pendingEmail` ter-clear, token pending ke-invalidate.
- `getProfile`: response memuat `pendingEmail` & `hasPassword` dengan benar.
- Migrasi `prisma migrate` perlu DB → backend dev server dihentikan sebentar.
- Verifikasi end-to-end di browser: edit nama+HP (langsung berlaku), ubah email (link muncul di dev mail log, klik, email ter-update, banner pending hilang), coba ubah email di akun yang login via Google (harus diblok dengan pesan jelas).

## Di luar scope

- Verifikasi No. HP (OTP) saat diubah — diputuskan direct-edit, lihat Keputusan #1.
- Mitigasi edge case matching-by-phone di POS — lihat Keputusan #4, sengaja tidak ditangani di sini.
- Redesign visual halaman Informasi Akun / Profile (item #20, #21 — backlog terpisah).
- Field Member ID, Tier, Bergabung tetap read-only (bukan data yang bisa diubah user).
