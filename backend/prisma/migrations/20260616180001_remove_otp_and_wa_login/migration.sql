-- Hapus fitur login OTP & WhatsApp magic-link (tak dipakai; login via Google + email/password)
DROP TABLE IF EXISTS "otp_codes";
DROP TABLE IF EXISTS "wa_login_requests";
