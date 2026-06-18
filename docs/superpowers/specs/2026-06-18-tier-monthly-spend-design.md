# Spec: Tier Berbasis Belanja Bulanan

Tanggal: 2026-06-18
Status: Disetujui
Konteks: Tier member ditentukan dari total belanja (Rp) bulan berjalan, reset tiap
bulan. Rate earning poin berbeda per tier. Semua bisa diatur di admin loyalty config.

## Aturan (default, bisa diubah admin)
- Ambang belanja/bulan: Bronze 0, Silver ≥500.000, Gold ≥1.000.000, Platinum ≥1.500.000
- Rate earning (Rp per 1 poin): Bronze 1000, Silver 950, Gold 900, Platinum 850
- **Reset bulanan otomatis**: tier selalu dihitung dari transaksi bulan kalender ini
  → tak perlu cron.
- **Rate transaksi** = tier dari (belanja bulan ini **termasuk** transaksi tsb).

## Backend
### Prisma — tambah field di `LoyaltyConfig` (1 migrasi)
```
tierSilverMin   Int @default(500000)
tierGoldMin     Int @default(1000000)
tierPlatinumMin Int @default(1500000)
rateBronze      Int @default(1000)
rateSilver      Int @default(950)
rateGold        Int @default(900)
ratePlatinum    Int @default(850)
```
(`rupiahPerPoint` lama tetap ada tapi tak dipakai earning; rate bronze menggantikan.)

### `src/common/tier.util.ts` (murni)
- `TierName = bronze|silver|gold|platinum`, `TierConfig`
- `tierForSpend(spend, cfg)`, `rateForTier(tier, cfg)`, `nextTier(spend, cfg)`,
  `startOfMonth(now)`.

### `src/tier/` — `TierModule` + `TierService`
- `getConfig()` → baca LoyaltyConfig singleton + fallback default.
- `monthlySpend(memberId, client?)` → `_sum.grandTotal` transaksi `createdAt >= awal bulan`.
- `statusForMember(memberId)` → `{ tier, monthlySpend, rupiahPerPoint, nextTier }`.
- Di-export; diimpor WebhooksModule & MemberModule.

### Webhook earning (`webhooks.service`)
- Baca `cfg = tier.getConfig()` di luar transaksi.
- Di dalam $transaction (setelah upsert member): `spend = monthlySpend(tx, member.id) + grand_total`
  → `tier = tierForSpend(spend, cfg)` → `rate = rateForTier(tier, cfg)` →
  `poin = floor(grand_total / rate)`.

### Member profile (`member.service.getProfile`)
- Tambah `tier`, `monthlySpend`, `nextTier` dari `TierService.statusForMember`.

### Loyalty config DTO
- Tambah 7 field opsional Int (ambang + rate). Service `update` sudah spread `...rest`.

## Frontend
- `lib/loyalty/tier.ts`: `Tier` jadi 4 nilai (+bronze), `TIER_META` +bronze.
- `lib/auth.tsx`: `AuthUser` + `tier`, `monthlySpend`, `nextTier`; map dari `/member/profile`.
- Halaman member (dashboard, member-card, profile, profile/account, rewards/[id]):
  pakai `user.tier` dari backend (bukan `getTier(points)`); progress dari `nextTier`
  (sisa Rp belanja), bukan poin.
- Admin `/admin/config`: section **Tier** — 3 ambang + 4 rate, simpan via PATCH.

## Testing
- Unit tier.util: `tierForSpend`, `rateForTier`, `nextTier`.
- Webhook: poin dihitung pakai rate tier (mis. belanja 1,5jt → platinum rate).
- Frontend `tsc`+`lint`.

## Catatan
- Batas bulan pakai waktu server (UTC). Cukup untuk kebutuhan saat ini.
- Tier tidak disimpan di `Member` (selalu on-the-fly) → konsisten & auto-reset.
