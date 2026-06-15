// Seed akun admin (idempoten). Jalankan: `node prisma/seed-admin.js` dari folder backend.
// Dev: boleh pakai default (admin@polks.test / admin12345).
// Production: WAJIB set ADMIN_EMAIL & ADMIN_PASSWORD (min 12 char) — tak ada default.
require('dotenv').config();
const { PrismaClient, Role } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const isProd = process.env.NODE_ENV === 'production';

async function main() {
  // Default hanya untuk non-production. Di production kredensial harus eksplisit.
  const email = (process.env.ADMIN_EMAIL || (isProd ? '' : 'admin@polks.test'))
    .toLowerCase()
    .trim();
  const password = process.env.ADMIN_PASSWORD || (isProd ? '' : 'admin12345');

  if (!email || !password) {
    throw new Error(
      'ADMIN_EMAIL & ADMIN_PASSWORD wajib diset (khususnya di production).',
    );
  }
  if (isProd && password.length < 12) {
    throw new Error('ADMIN_PASSWORD terlalu lemah untuk production (min 12 karakter).');
  }

  // Jangan diam-diam mengambil-alih / menaikkan akun yang sudah ada. Kalau email
  // dipakai akun non-admin, batal demi keamanan (cegah privilege escalation).
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.role !== Role.ADMIN) {
    throw new Error(
      `Email ${email} sudah dipakai akun non-admin (role=${existing.role}). ` +
        'Batal demi keamanan — pakai email lain.',
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email },
    // Reset password admin yang sudah ada; TIDAK mengubah role (anti-elevation).
    update: { passwordHash },
    create: { name: 'Admin POLKS', email, passwordHash, role: Role.ADMIN },
  });

  console.log(`✅ Admin siap: ${user.email} (role=${user.role}, id=${user.id})`);
}

main()
  .catch((e) => {
    console.error('❌ Gagal seed admin:', e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
