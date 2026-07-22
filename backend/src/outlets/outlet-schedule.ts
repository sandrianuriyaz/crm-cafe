// Jadwal outlet disimpan terstruktur (openTime/closeTime/closedDays) supaya
// aplikasi bisa menghitung buka/tutup. Tapi tampilan tetap butuh satu baris
// teks, dan itu diturunkan di sini saat simpan — bukan dirakit ulang di tiap
// halaman.

// Indeks mengikuti Date#getDay(): 0 = Minggu.
const DAY_NAMES = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

// Urutan tampilan Senin-dulu, sesuai kebiasaan jadwal toko di Indonesia.
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

// "Senin - Sabtu" untuk hari berurutan, "Senin, Rabu" kalau terpotong.
function formatDays(closedDays: number[]): string {
  const open = DISPLAY_ORDER.filter((d) => !closedDays.includes(d));
  if (open.length === 0) return 'Tutup sementara';
  if (open.length === 7) return 'Setiap hari';

  const groups: number[][] = [];
  for (const day of open) {
    const last = groups[groups.length - 1];
    // Berurutan menurut DISPLAY_ORDER, bukan menurut nilai indeksnya — Sabtu(6)
    // dan Minggu(0) bersebelahan di tampilan meski angkanya melompat.
    const prevPos = last ? DISPLAY_ORDER.indexOf(last[last.length - 1]) : -2;
    if (last && DISPLAY_ORDER.indexOf(day) === prevPos + 1) last.push(day);
    else groups.push([day]);
  }

  return groups
    .map((g) =>
      g.length >= 2
        ? `${DAY_NAMES[g[0]]} - ${DAY_NAMES[g[g.length - 1]]}`
        : DAY_NAMES[g[0]],
    )
    .join(', ');
}

// Rakit teks tampilan. Kembalikan null kalau jam belum lengkap supaya pemanggil
// bisa membiarkan `hours` lama apa adanya.
export function buildHoursLabel(
  openTime?: string | null,
  closeTime?: string | null,
  closedDays?: number[] | null,
): string | null {
  if (!openTime || !closeTime) return null;
  const days = formatDays(closedDays ?? []);
  if (days === 'Tutup sementara') return days;
  return `${days} ${openTime} - ${closeTime}`;
}
