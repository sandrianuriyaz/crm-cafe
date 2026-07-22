import { buildHoursLabel } from './outlet-schedule';

describe('buildHoursLabel', () => {
  it('meringkas hari berurutan jadi rentang', () => {
    expect(buildHoursLabel('09:00', '21:00', [0])).toBe(
      'Senin - Sabtu 09:00 - 21:00',
    );
  });

  it('menulis "Setiap hari" saat tidak ada libur', () => {
    expect(buildHoursLabel('08:00', '22:00', [])).toBe(
      'Setiap hari 08:00 - 22:00',
    );
  });

  it('memisahkan kelompok yang terpotong hari libur', () => {
    // Libur Rabu → Senin-Selasa dan Kamis-Minggu.
    expect(buildHoursLabel('10:00', '20:00', [3])).toBe(
      'Senin - Selasa, Kamis - Minggu 10:00 - 20:00',
    );
  });

  it('menganggap Sabtu dan Minggu bersebelahan', () => {
    expect(buildHoursLabel('10:00', '20:00', [1, 2, 3, 4, 5])).toBe(
      'Sabtu - Minggu 10:00 - 20:00',
    );
  });

  it('menyebut satu hari tanpa rentang', () => {
    expect(buildHoursLabel('10:00', '20:00', [0, 1, 2, 3, 4, 5])).toBe(
      'Sabtu 10:00 - 20:00',
    );
  });

  it('mengembalikan null kalau jam belum lengkap', () => {
    expect(buildHoursLabel(null, '21:00', [])).toBeNull();
    expect(buildHoursLabel('09:00', null, [])).toBeNull();
  });
});
