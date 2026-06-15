# Spec: Batch B — Outlets, Loyalty Config, Admin Stats

Tanggal: 2026-06-15
Status: Disetujui
Konteks: `docs/BACKEND-TODO.md` modul admin. Halaman frontend masih placeholder →
wiring UI langkah terpisah.

## Keputusan (terkunci)
1. `LoyaltyConfig.rupiahPerPoint` **dipakai** di perhitungan earning poin
   (`WebhooksService.calculatePoints`), fallback ke env `POIN_PER_RUPIAH`.
2. `Outlet` punya `storeId?` (`@unique`) untuk pemetaan ke POS `store_id`.

## Prisma (1 migrasi)
```prisma
enum OutletStatus { ACTIVE INACTIVE }

model Outlet {
  id        String       @id @default(cuid())
  name      String
  city      String?
  address   String?
  hours     String?
  phone     String?
  status    OutletStatus @default(ACTIVE)
  storeId   String?      @unique
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt
  @@map("outlets")
}

model LoyaltyConfig {
  id                     String   @id @default("singleton")
  rupiahPerPoint         Int      @default(1000)
  pointsPerUnit          Int      @default(1)
  pointExpiryMonths      Int?
  tierThresholds         Json     @default("[]")
  webhookUrl             String?
  requireIdempotencyKeys Boolean  @default(true)
  updatedAt              DateTime @updatedAt
  @@map("loyalty_config")
}
```

## 1. Outlets — modul baru `src/outlets/`
Controller TANPA guard kelas (supaya GET publik), method admin di-guard sendiri.
- `GET /outlets` — publik, hanya `status=ACTIVE` → `{ id, name, city, address, hours, phone, status }`
- `GET /admin/outlets` — semua (ADMIN)
- `POST /admin/outlets` — `CreateOutletDto { name*, city?, address?, hours?, phone?, status?, storeId? }`
- `PATCH /admin/outlets/:id` — `UpdateOutletDto` (partial)
- `DELETE /admin/outlets/:id` — hapus permanen (data master, bukan transaksi)
Guard admin per-method: `JwtAuthGuard + RolesGuard @Roles(ADMIN)`.

## 2. Loyalty Config — `src/admin/loyalty-config.service.ts`
- `GET /admin/loyalty-config` → ambil singleton; buat default bila belum ada (upsert).
- `PATCH /admin/loyalty-config` → upsert partial (`UpdateLoyaltyConfigDto`).
- Wiring earning: `calculatePoints(grandTotal)` jadi async, baca `rupiahPerPoint`
  dari `loyaltyConfig` (id `singleton`); fallback `env POIN_PER_RUPIAH` bila row/nilai
  tak ada. 1 query ringan sebelum proses transaksi (di luar $transaction).

## 3. Admin Stats — `GET /admin/stats`
`{ totalMembers, totalTransactions, pointsIssued, pointsRedeemed, activeOutlets, pointsFlow[] }`
- `totalMembers` = `member.count`
- `totalTransactions` = `transaction.count`
- `pointsIssued` = `_sum.points` dari `pointHistory` where type=earn
- `pointsRedeemed` = `_sum.pointsSpent` dari `redeem`
- `activeOutlets` = `outlet.count` where status=ACTIVE
- `pointsFlow` = 6 bulan terakhir `[{ month:"YYYY-MM", issued, redeemed }]` via raw SQL
  (`date_trunc('month', "createdAt")`, Postgres), digabung di JS (bulan kosong → 0).

## Testing (Jest, mock Prisma)
- Outlets: create/update/delete; `listPublic` hanya ACTIVE.
- LoyaltyConfig: GET buat default bila kosong; PATCH upsert.
- `calculatePoints`: pakai rate config; fallback env saat config kosong.
- Stats: bentuk hasil + merge pointsFlow (mock `$queryRaw`).
- Migrasi `prisma migrate` perlu DB → backend dev server dihentikan sebentar.

## Di luar scope
- Wiring halaman admin/customer frontend.
- Penetapan `Member.tier` otomatis dari `tierThresholds` (Batch C).
