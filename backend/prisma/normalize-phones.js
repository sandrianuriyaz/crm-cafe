// Rapikan nomor HP lama ke bentuk lokal "08xxx".
//
// Sebelum perbaikan ini, registrasi & edit profil menyimpan nomor apa adanya
// ("+62 812-…", "0812 345 …") sementara webhook POS mencari member dengan
// nomor yang sudah dinormalisasi. Baris lama yang formatnya beda tidak akan
// pernah cocok, jadi poin transaksinya mendarat di member hantu.
//
// Dijalankan dari folder backend/:
//   node -r dotenv/config prisma/normalize-phones.js          (dry-run, aman)
//   node -r dotenv/config prisma/normalize-phones.js --apply  (menulis)
//
// Baris yang bentuk barunya sudah dipakai baris lain DILEWATI dan dilaporkan —
// itu dua data untuk satu nomor yang sama dan perlu keputusan manusia (mana
// yang dipakai, ke mana poinnya digabung), bukan ditimpa diam-diam.
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

// Disalin dari src/common/phone.util.ts — skrip ini berjalan tanpa build TS.
function normalizePhone(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('62')) return '0' + digits.slice(2);
  if (digits.startsWith('062')) return '0' + digits.slice(3);
  if (digits.startsWith('0')) return digits;
  return '0' + digits;
}

async function plan(rows) {
  const changes = [];
  for (const row of rows) {
    const next = normalizePhone(row.phone);
    if (next && next !== row.phone) changes.push({ ...row, next });
  }
  return changes;
}

async function run(label, rows, findByPhone, update) {
  const changes = await plan(rows);
  console.log(`\n== ${label}: ${changes.length} baris perlu dirapikan ==`);

  let done = 0;
  const skipped = [];
  for (const c of changes) {
    const clash = await findByPhone(c.next);
    if (clash && clash.id !== c.id) {
      skipped.push({ id: c.id, from: c.phone, to: c.next, clashId: clash.id });
      continue;
    }
    console.log(`  ${c.phone}  ->  ${c.next}${APPLY ? '' : '   (dry-run)'}`);
    if (APPLY) {
      await update(c.id, c.next);
      done++;
    }
  }

  if (skipped.length) {
    console.log(`  -- ${skipped.length} dilewati karena nomornya sudah dipakai baris lain:`);
    for (const s of skipped) {
      console.log(`     ${s.id}: ${s.from} -> ${s.to} (bentrok dengan ${s.clashId})`);
    }
  }
  if (APPLY) console.log(`  ${done} baris diperbarui.`);
}

(async () => {
  const members = await prisma.member.findMany({
    where: { phone: { not: null } },
    select: { id: true, phone: true },
  });
  await run(
    'Member',
    members,
    (phone) => prisma.member.findUnique({ where: { phone }, select: { id: true } }),
    (id, phone) => prisma.member.update({ where: { id }, data: { phone } }),
  );

  const users = await prisma.user.findMany({
    where: { phone: { not: null } },
    select: { id: true, phone: true },
  });
  await run(
    'User',
    users,
    (phone) => prisma.user.findFirst({ where: { phone }, select: { id: true } }),
    (id, phone) => prisma.user.update({ where: { id }, data: { phone } }),
  );

  if (!APPLY) {
    console.log('\nDry-run. Jalankan ulang dengan --apply untuk menulis perubahan.');
  }
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error(e.message);
  await prisma.$disconnect();
  process.exit(1);
});
