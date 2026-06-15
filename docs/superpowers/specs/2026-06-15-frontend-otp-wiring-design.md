# Spec: Sambungkan OTP ke Frontend

Tanggal: 2026-06-15
Status: Disetujui (siap implementasi)
Konteks: Backend OTP selesai (`2026-06-15-auth-otp-design.md`). Frontend masih pakai
dev-bridge di `verify-account/page.tsx`. Spec ini menyambungkan UI ke endpoint
`/auth/otp/request` & `/auth/otp/verify`.

## Keputusan (terkunci)
1. Field input nomor HP **inline** di halaman login & register (bukan layar terpisah).
2. Tombol **SMS dinonaktifkan** ("SMS segera hadir") — backend belum punya
   `TWILIO_SMS_FROM`. Channel aktif: `whatsapp`.
3. Nomor + channel dioper antar-halaman lewat **sessionStorage** (bukan URL).

## Perubahan

### `lib/api.ts`
- Tambah `requestOtp(phone, channel)` → `POST /auth/otp/request` (auth:false),
  return `{ success: true }`. Channel bertipe `"whatsapp" | "sms"`.

### `lib/auth.tsx`
- Tambah ke context: `loginWithOtp(phone, code)` → `POST /auth/otp/verify`
  (auth:false), lalu `setToken` + `setUser` (mirror `login()`).

### `components/auth/phone-otp-actions.tsx` (baru, "use client")
- Dipakai login & register (hindari duplikasi). Prop `mode: "login" | "register"`
  hanya untuk teks tombol ("Lanjut dengan" vs "Daftar dengan").
- Isi: input nomor HP (controlled) + tombol WhatsApp (submit) + tombol SMS disabled.
- Submit WA: validasi nomor tidak kosong → `requestOtp(phone, "whatsapp")` →
  simpan `sessionStorage.otp_phone` & `otp_channel` → `router.push("/verify-account")`.
- State `loading` & `error` (tampilkan `ApiError.message`).

### `app/login/page.tsx` & `app/register/page.tsx`
- Tetap layout/heading existing; ganti dua `<Link>` tombol jadi
  `<PhoneOtpActions mode="login" | "register" />`. Komponen `WhatsAppIcon` dipindah
  ke dalam PhoneOtpActions (atau di-share) supaya tombol konsisten.

### `app/verify-account/page.tsx`
- Buang dev-bridge (`DEV_EMAIL/PASSWORD`, blok `login(...)`).
- Mount: baca `otp_phone`/`otp_channel` dari sessionStorage; kosong → redirect `/login`.
  Tampilkan nomor ter-mask (`maskPhone`: 4 digit awal + `****` + 4 digit akhir).
- "Verifikasi": `loginWithOtp(phone, code)` → sukses bersihkan sessionStorage →
  `/dashboard`. Kode salah → tampilkan error di bawah kotak OTP.
- "Kirim ulang OTP": `requestOtp(phone, channel)` lagi + reset countdown 30s.

## Error & loading
- Pesan error dari backend sudah Bahasa Indonesia (`ApiError.message`). Tombol
  disable saat request berjalan.

## Testing
- Frontend tanpa test harness (Next.js, tanpa jest). Verifikasi: `tsc --noEmit` +
  `next lint` + run manual. OTP WhatsApp asli butuh HP yang sudah join Twilio sandbox.

## Di luar scope
- Tidak menambah field nama di register (backend `loginByPhone` pakai phone sebagai
  nama placeholder; edit profil menyusul lewat TODO `PATCH /member/profile`).
- SMS channel diaktifkan nanti setelah nomor SMS Twilio tersedia.
