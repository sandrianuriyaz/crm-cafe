// Normalisasi nomor HP Indonesia ke bentuk lokal ("08xxx") — bentuk yang
// dipakai saat registrasi. Tanpa ini, POS yang mengirim "+6281..." tidak akan
// cocok dengan member yang tersimpan sebagai "081...", dan webhook membuat
// member baru (poin masuk ke member hantu).
export function normalizePhone(raw?: string | null): string | null {
  if (!raw) return null;

  // Buang spasi, tanda hubung, kurung, dsb. Sisakan digit saja.
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;

  // 62xxx / 062xxx → 0xxx
  if (digits.startsWith('62')) return '0' + digits.slice(2);
  if (digits.startsWith('062')) return '0' + digits.slice(3);
  if (digits.startsWith('0')) return digits;

  // "81234..." (0 di depan hilang saat POS menyimpannya sebagai angka)
  return '0' + digits;
}
