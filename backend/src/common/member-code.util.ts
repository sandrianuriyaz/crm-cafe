import { randomBytes } from 'node:crypto';

// Kode member acak, mis. MBR-1A2B3C4D5E. Unik (dijaga unique constraint DB).
export function generateMemberCode(): string {
  return 'MBR-' + randomBytes(5).toString('hex').toUpperCase();
}
