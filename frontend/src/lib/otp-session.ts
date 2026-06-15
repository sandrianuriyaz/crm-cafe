import type { OtpChannel } from "./api";

// Nomor + channel dioper dari halaman login/register ke /verify-account lewat
// sessionStorage (bukan URL, supaya nomor tak tersimpan di history browser).
const PHONE_KEY = "otp_phone";
const CHANNEL_KEY = "otp_channel";

export function saveOtpSession(phone: string, channel: OtpChannel) {
  sessionStorage.setItem(PHONE_KEY, phone);
  sessionStorage.setItem(CHANNEL_KEY, channel);
}

export function readOtpSession(): { phone: string; channel: OtpChannel } | null {
  if (typeof window === "undefined") return null;
  const phone = sessionStorage.getItem(PHONE_KEY);
  const channel = sessionStorage.getItem(CHANNEL_KEY) as OtpChannel | null;
  if (!phone || !channel) return null;
  return { phone, channel };
}

export function clearOtpSession() {
  sessionStorage.removeItem(PHONE_KEY);
  sessionStorage.removeItem(CHANNEL_KEY);
}

// Samarkan tengah nomor: 0812****7890.
export function maskPhone(phone: string): string {
  if (phone.length <= 8) return phone;
  return `${phone.slice(0, 4)}****${phone.slice(-4)}`;
}
