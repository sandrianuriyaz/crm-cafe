import { randomBytes } from 'node:crypto';

// Kode voucher acak, mis. VCR-9F3A1B7C. Unik (dijaga unique constraint DB).
export function generateVoucherCode(): string {
  return 'VCR-' + randomBytes(4).toString('hex').toUpperCase();
}
