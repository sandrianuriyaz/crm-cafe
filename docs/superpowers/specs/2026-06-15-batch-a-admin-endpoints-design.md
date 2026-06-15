# Spec: Batch A — Endpoint Quick Wins (admin audit + edit profil)

Tanggal: 2026-06-15
Status: Disetujui
Konteks: `docs/BACKEND-TODO.md`. Endpoint read-only admin + edit profil member.
Halaman admin frontend masih placeholder statis → wiring frontend langkah terpisah.

Semua route admin: `JwtAuthGuard + RolesGuard @Roles(ADMIN)`. Pagination existing
`{ total, skip, take, items }`. DTO query reuse `ListQueryDto` kecuali yang perlu filter.

## 1. `PATCH /member/profile`
- DTO `UpdateProfileDto { name?: string(min2), phone?: string }`.
- `updateProfile(userId, dto)`: ambil member milik user; update `Member.name`/`phone`.
  Phone diupdate juga di `User.phone` (1 transaksi) supaya login OTP tetap match.
  Konflik unique phone (P2002) → `409`. Balas profil seperti `getProfile`.

## 2. `GET /admin/vouchers`
- Query: `ListQueryDto` + `status?` (ACTIVE|USED|EXPIRED).
- Item: `{ id, code, memberName, reward, status, expiredAt, usedAt, createdAt }`.

## 3. `PATCH /admin/vouchers/:id`
- Tandai `USED` + `usedAt=now`. Kalau status ≠ ACTIVE → `400`. 404 kalau tak ada.

## 4. `GET /admin/redeems`
- `ListQueryDto`. Item: `{ id, memberName, reward, pointsSpent, voucherCode, createdAt }`.

## 5. `GET /admin/webhooks`
- Query: `ListQueryDto` + `status?`, `from?`, `to?` (ISO date).
- Sumber `PosSyncLog`. Item: `{ id, eventId, idempotencyKey, status, errorMessage, createdAt }`
  (rawPayload tidak diikut di list).

## 6. `GET /admin/idempotency-keys`
- `ListQueryDto`. Sumber `Transaction` (penyimpan kunci dedup unik).
  Item: `{ idempotencyKey, posOrderId, posOrderNumber, memberId, pointsAwarded, createdAt }`.

## 7. `GET /admin/pos-sync`
- Ringkasan per `storeId` dari `Transaction` (groupBy): `{ storeId, transactionCount,
  lastOccurredAt, lastCreatedAt }`. "Per outlet" sebenarnya menunggu model `Outlet`
  (Batch B). Endpoint retry (opsional) dilewati.

## Testing
- Unit (mock Prisma): `updateProfile` (sukses + konflik phone → 409),
  `markVoucherUsed` (sukses + status non-ACTIVE → 400). List lain: smoke ringan.

## Di luar scope
- Wiring halaman admin frontend ke endpoint ini.
- Model Outlet & pos-sync per-outlet penuh (Batch B).
