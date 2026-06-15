// Seed akun admin (idempoten). Jalankan: `node prisma/seed-admin.js` dari folder backend.
// Email/password bisa di-override lewat env ADMIN_EMAIL / ADMIN_PASSWORD.
require('dotenv').config();
const { PrismaClient, Role } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || 'admin@polks.test').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || 'admin12345';
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: Role.ADMIN },
    create: {
      name: 'Admin POLKS',
      email,
      passwordHash,
      role: Role.ADMIN,
    },
  });

  console.log(`✅ Admin siap: ${user.email} (role=${user.role}, id=${user.id})`);
}

main()
  .catch((e) => {
    console.error('❌ Gagal seed admin:', e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
