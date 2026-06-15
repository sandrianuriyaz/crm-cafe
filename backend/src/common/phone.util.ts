// Normalisasi nomor HP Indonesia ke bentuk kanonik lokal 08xxxxxxxxxx, supaya
// konsisten dengan kolom Member.phone existing. Sumber input bisa 08xxx, 62xxx,
// atau +62xxx dengan spasi/strip/titik. Lempar error untuk input tak valid.
export function normalizePhone(raw: string): string {
  const digits = (raw ?? '').replace(/[\s.\-()]/g, '');

  let local: string;
  if (digits.startsWith('+62')) {
    local = '0' + digits.slice(3);
  } else if (digits.startsWith('62')) {
    local = '0' + digits.slice(2);
  } else if (digits.startsWith('0')) {
    local = digits;
  } else {
    throw new Error('Nomor HP tidak valid');
  }

  // 08 diikuti 8–13 digit (total 10–15) — cukup longgar untuk nomor ID.
  if (!/^0\d{9,14}$/.test(local)) {
    throw new Error('Nomor HP tidak valid');
  }
  return local;
}

// Kanonik 08xxx → E.164 +62xxx untuk dikirim ke provider (Twilio).
export function toE164(canonical: string): string {
  return '+62' + canonical.slice(1);
}
