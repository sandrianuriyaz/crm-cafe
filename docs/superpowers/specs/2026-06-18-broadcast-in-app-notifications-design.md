# Spec: Broadcast → Notifikasi In-App

Tanggal: 2026-06-18
Status: Disetujui
Konteks: Admin kirim pengumuman ke member. Kanal = **in-app** (gratis): disimpan
sebagai notifikasi per-member, member lihat di inbox.

## Keputusan (terkunci)
1. Kanal **in-app** (tanpa WA/email/biaya).
2. Scope penuh: backend + halaman admin broadcast + **inbox member baru**.
3. Targeting: `all | silver | gold | platinum | inactive`. Tier dari saldo poin
   (silver <1000, gold <5000, platinum ≥5000) — samakan dgn `getTier` frontend.
   `inactive` = tak ada transaksi 30 hari terakhir. Hanya member dgn akun
   (`userId != null`) yang menerima (yang punya inbox).
4. **Kirim langsung** (tanpa penjadwalan) untuk sekarang.

## Prisma (1 migrasi)
```prisma
model Broadcast {
  id             String   @id @default(cuid())
  title          String
  message        String
  target         String   // all|silver|gold|platinum|inactive
  recipientCount Int      @default(0)
  createdAt      DateTime @default(now())
  @@map("broadcasts")
}

model Notification {
  id        String    @id @default(cuid())
  memberId  String
  member    Member    @relation(fields: [memberId], references: [id])
  title     String
  message   String
  readAt    DateTime?
  createdAt DateTime  @default(now())
  @@index([memberId])
  @@map("notifications")
}
```
Tambah `notifications Notification[]` di `Member`.

## Backend — modul `src/notifications/`
- `NotificationsService`:
  - `broadcast(dto)`: resolve member target → buat `Broadcast` + `createMany`
    Notification utk tiap member → balas `{ recipientCount }`. (1 transaksi)
  - `listBroadcasts(skip,take)`: riwayat (paginated).
  - `listForMember(userId,skip,take)`, `unreadCount(userId)`, `markRead(userId,id)`,
    `markAllRead(userId)`.
- `BroadcastController` (ADMIN): `POST /admin/broadcast`, `GET /admin/broadcasts`.
- `NotificationsController` (member, JwtAuthGuard):
  `GET /member/notifications`, `GET /member/notifications/unread-count`,
  `PATCH /member/notifications/:id/read`, `POST /member/notifications/read-all`.
- DTO `CreateBroadcastDto { title(min2), message(1..500), target(IsIn) }`.
- Resolve target via Prisma where:
  - silver `pointBalance < 1000`; gold `>=1000 & <5000`; platinum `>=5000`;
  - inactive `transactions: { none: { createdAt: { gte: now-30d } } }`;
  - semua + `userId: { not: null }`.

## Frontend
- **Admin `/admin/broadcast`**: compose → `POST /admin/broadcast`; riwayat →
  `GET /admin/broadcasts`. Metric: total broadcast, total penerima.
- **Member `/inbox`** (baru): daftar `GET /member/notifications`, tandai dibaca
  saat dibuka (`read-all` atau per-item), state kosong.
- **Dashboard bell** → Link ke `/inbox`; titik merah muncul bila `unread-count > 0`.

## Testing
- Unit (mock Prisma): `broadcast` membuat Broadcast + notifikasi sejumlah target;
  resolve target tier/inactive; `markAllRead`. Frontend `tsc`+`lint`.

## Di luar scope (follow-up)
- Penjadwalan broadcast, open-rate tracking, kanal WA/email, preferensi notifikasi
  (`/notifications` toggles) menghubungkan ke pengiriman.
