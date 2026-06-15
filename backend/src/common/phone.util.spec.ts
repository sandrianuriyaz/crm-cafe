import { normalizePhone, toE164 } from './phone.util';

describe('normalizePhone', () => {
  it('keeps 08xxx as-is (canonical)', () => {
    expect(normalizePhone('081234567890')).toBe('081234567890');
  });

  it('strips spaces, dashes, and dots', () => {
    expect(normalizePhone('0812-3456 7890')).toBe('081234567890');
    expect(normalizePhone('0812.3456.7890')).toBe('081234567890');
  });

  it('converts +62 prefix to 0', () => {
    expect(normalizePhone('+6281234567890')).toBe('081234567890');
  });

  it('converts bare 62 prefix to 0', () => {
    expect(normalizePhone('6281234567890')).toBe('081234567890');
  });

  it('rejects empty / non-numeric', () => {
    expect(() => normalizePhone('')).toThrow();
    expect(() => normalizePhone('abcdef')).toThrow();
  });

  it('rejects numbers that do not start with 0/62/+62', () => {
    expect(() => normalizePhone('1234567890')).toThrow();
  });

  it('rejects too short', () => {
    expect(() => normalizePhone('08123')).toThrow();
  });
});

describe('toE164', () => {
  it('converts canonical 08xxx to +62xxx', () => {
    expect(toE164('081234567890')).toBe('+6281234567890');
  });
});
