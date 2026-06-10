# Product Requirements Document (PRD)
## P1 - Web Apps CRM Cafe

| Informasi | Keterangan |
|---|---|
| Nama Project | P1 - Web Apps CRM Cafe |
| Nama Produk | CRM Cafe |
| Tim | Tim 5 - Cafe CRM Crew |
| Anggota | Muhammad Alif Akhdan Tsani, Sandria Nuriya Az Zahra |
| Durasi Acuan | 40 hari kerja untuk MVP |
| Versi Dokumen | 1.3 |
| Tanggal Revisi | 10 Juni 2026 |
| Status | Draft untuk review mentor |
| Fokus Dokumen | PRD, scope MVP, rencana kerja, integrasi POS Fase 1, risiko, dan pertanyaan mentor |

Dokumen ini disusun sebagai acuan awal pengembangan Web Apps CRM Cafe. Isi dokumen menggabungkan kebutuhan produk, rencana teknis, pembagian kerja, timeline, dan daftar pertanyaan yang perlu dikonfirmasi sebelum development utama dimulai.

---

## Daftar Isi
1. [Ringkasan Project](#1-ringkasan-project)
2. [Latar Belakang](#2-latar-belakang)
3. [Tujuan MVP](#3-tujuan-mvp)
4. [Role Pengguna](#4-role-pengguna)
5. [Scope MVP](#5-scope-mvp)
6. [Functional Requirements](#6-functional-requirements)
7. [User Flow Utama](#7-user-flow-utama)
8. [Integrasi POS](#8-integrasi-pos)
9. [Rencana Arsitektur dan Repository](#9-rencana-arsitektur-dan-repository)
10. [Model Data Awal](#10-model-data-awal)
11. [Pembagian Peran Tim](#11-pembagian-peran-tim)
12. [Timeline 40 Hari Kerja](#12-timeline-40-hari-kerja)
13. [Sprint Backlog Minggu Pertama](#13-sprint-backlog-minggu-pertama)
14. [Non-Functional Requirements](#14-non-functional-requirements)
15. [Risiko dan Mitigasi](#15-risiko-dan-mitigasi)
16. [Pertanyaan Mentor](#16-pertanyaan-mentor)
17. [Deliverables](#17-deliverables)
18. [Kesimpulan](#18-kesimpulan)

---

## 1. Ringkasan Project

CRM Cafe adalah aplikasi CRM berbasis web untuk cafe yang berfokus pada loyalty program, promo, reward, voucher, dan integrasi dengan POS internal perusahaan.

Customer dapat menggunakan web app untuk:
- Register atau login sebagai member.
- Melihat profil, saldo poin, dan QR member.
- Melihat promo aktif.
- Melihat katalog reward.
- Menukar poin menjadi reward atau voucher.
- Melihat histori transaksi dan histori redeem.

Admin dapat menggunakan dashboard untuk:
- Melihat ringkasan data loyalty.
- Mengelola member.
- Mengelola promo.
- Mengelola reward.
- Mengelola voucher.
- Mengelola broadcast promo.

Integrasi POS menjadi bagian penting karena transaksi di kasir adalah sumber data untuk perhitungan poin pelanggan. Tim tidak membuat sistem kasir dari nol; POS dipahami sebagai sistem internal perusahaan yang perlu dihubungkan dengan CRM.

Update integrasi 10 Juni 2026: Fase 1 integrasi POS sudah diarahkan sebagai alur `transaction.completed` dari POS/Supabase ke CRM melalui webhook. CRM menjadi source of truth untuk perhitungan poin, saldo poin, dan konversi poin ke rupiah.

---

## 2. Latar Belakang

Cafe membutuhkan sistem loyalty yang dapat meningkatkan retensi pelanggan tanpa memaksa pelanggan menginstal aplikasi native. Web app dipilih karena lebih ringan, mudah diakses melalui browser, dan dapat dibuka dari QR/link yang disediakan cafe.

Masalah utama yang ingin diselesaikan:
- Loyalty program belum terdigitalisasi secara rapi.
- Pencatatan poin manual rawan salah dan sulit diaudit.
- Customer tidak memiliki tempat mandiri untuk melihat poin, promo, reward, dan histori.
- Admin membutuhkan dashboard untuk mengelola promo, reward, member, voucher, dan broadcast.
- Transaksi POS perlu menjadi trigger otomatis untuk penambahan poin.

---

## 3. Tujuan MVP

Tujuan MVP adalah menghasilkan web CRM yang dapat menjalankan alur loyalty secara end-to-end:

1. Customer melakukan register/login.
2. Customer memiliki QR member.
3. POS/Supabase mengirim event transaksi selesai ke webhook CRM.
4. CRM menghitung dan menambahkan poin ke member.
5. Customer melihat saldo poin, promo, reward, dan histori.
6. Customer redeem poin menjadi reward/voucher.
7. Admin mengelola data dasar loyalty melalui dashboard.

### Acceptance Criteria Produk

| ID | Kriteria | Cara Verifikasi |
|---|---|---|
| AC-01 | Customer dapat register/login dan masuk ke dashboard member | Uji manual flow auth |
| AC-02 | Customer dapat melihat profil, saldo poin, dan QR member | Uji halaman dashboard member |
| AC-03 | CRM dapat menerima event `transaction.completed` dari POS/mock POS | Uji endpoint webhook dengan HMAC |
| AC-04 | Transaksi valid menghasilkan penambahan poin | Cek transaksi, point ledger, dan saldo |
| AC-05 | Transaksi duplikat tidak menggandakan poin | Kirim `X-Idempotency-Key` yang sama dua kali |
| AC-06 | Customer dapat redeem reward saat saldo cukup | Cek voucher dibuat dan poin berkurang |
| AC-07 | Customer tidak dapat redeem jika saldo tidak cukup | Cek validasi dan saldo tidak berubah |
| AC-08 | Admin dapat CRUD member, promo, reward, dan voucher | Uji dashboard admin |
| AC-09 | Tampilan customer mobile-first dan admin desktop-friendly | Uji responsive design |

---

## 4. Role Pengguna

| Role | Fungsi Utama | Implikasi ke Sistem |
|---|---|---|
| Customer / Member | Melihat poin, promo, reward, QR member, histori, dan melakukan redeem | Membutuhkan UI mobile-first, alur login sederhana, dan informasi yang jelas |
| Admin / Owner | Mengelola member, promo, reward, voucher, broadcast, dan histori | Membutuhkan dashboard desktop-friendly dengan tabel, form, filter, dan status data |
| Kasir / Staff | Melakukan transaksi melalui POS internal yang memicu update poin | Perlu dikonfirmasi apakah cukup memakai POS atau perlu halaman khusus di CRM |

Catatan: untuk MVP, halaman yang diprioritaskan adalah Customer Web App dan Admin Dashboard. Role kasir masih menunggu konfirmasi mentor karena kasir kemungkinan tetap menggunakan POS internal.

---

## 5. Scope MVP

### 5.1 Customer Web App

| Fitur | Prioritas | Catatan |
|---|---|---|
| Register/login customer | P0 | Mekanisme OTP/provider perlu dikonfirmasi |
| Profil customer | P0 | Nama, email/no HP, dan data dasar |
| Saldo poin | P0 | Diambil dari point balance/ledger |
| QR member | P0 | Untuk identifikasi member di POS |
| Promo aktif | P0 | Banner/list dan detail promo |
| Katalog reward | P0 | Menampilkan point cost dan stok/status |
| Redeem reward/voucher | P0 | Menghasilkan kode voucher unik atau QR voucher sesuai keputusan mentor |
| Histori transaksi | P0 | Menampilkan transaksi dan poin yang didapat |
| Histori redeem | P0 | Menampilkan voucher, status, dan tanggal redeem |

### 5.2 Admin Dashboard

| Fitur | Prioritas | Catatan |
|---|---|---|
| Dashboard ringkas | P0 | Total member, promo aktif, reward, voucher/redeem |
| Member management | P0 | List, search, detail member |
| Promo management | P0 | CRUD promo dan status publish |
| Reward management | P0 | CRUD reward, stok, point cost |
| Voucher management | P0 | List voucher dan status active/used/expired |
| Broadcast promo | P1 | Channel tergantung keputusan mentor/provider |
| Point adjustment | P1 | Perlu alasan dan audit log |

### 5.3 Backend CRM API

| Fitur | Prioritas | Catatan |
|---|---|---|
| Auth API | P0 | Customer dan admin |
| Member API | P0 | Profil, saldo, QR, histori |
| Promo API | P0 | Public dan admin CRUD |
| Reward API | P0 | Public dan admin CRUD |
| Redeem API | P0 | Validasi poin, stok, dan voucher |
| Transaction/Point API | P0 | Mapping transaksi menjadi poin |
| POS Integration API | P0 | Webhook `POST /webhooks/pos/transactions` untuk event `transaction.completed` |
| Dashboard API | P0 | Ringkasan admin |
| API documentation | P0 | Swagger/OpenAPI jika disepakati |

### 5.4 Out of Scope MVP

- Membuat sistem POS/kasir dari nol.
- Aplikasi native Android/iOS.
- Tier membership lengkap jika belum diwajibkan mentor.
- Analitik lanjutan seperti RFM, cohort, atau LTV.
- Referral program.
- Birthday reward otomatis.
- Multi-outlet reporting lanjutan.
- Integrasi production WhatsApp/SMS jika credential/provider belum tersedia.
- Pemrosesan event POS `transaction.voided` dan `transaction.refunded` pada Fase 1.
- Sinkronisasi saldo poin kembali ke POS/struk untuk Fase 1.

---

## 6. Functional Requirements

Prioritas:
- P0: wajib untuk MVP.
- P1: penting, dapat menyusul setelah MVP inti stabil.
- P2: fitur lanjutan.

### 6.1 Auth dan Account

| ID | Requirement | Prioritas |
|---|---|---|
| FR-AUTH-01 | Customer dapat register menggunakan email/no HP sesuai keputusan mentor | P0 |
| FR-AUTH-02 | Customer dapat login dengan mekanisme sederhana dan aman | P0 |
| FR-AUTH-03 | Admin memiliki login terpisah | P0 |
| FR-AUTH-04 | Sistem membedakan role customer dan admin | P0 |
| FR-AUTH-05 | OTP memiliki expiry, attempt limit, dan rate limit jika OTP dipakai | P0 |
| FR-AUTH-06 | Provider OTP/email/WhatsApp dapat dikonfigurasi melalui environment variable | P1 |

### 6.2 Member dan Point

| ID | Requirement | Prioritas |
|---|---|---|
| FR-MEMBER-01 | Customer dapat melihat profil member | P0 |
| FR-MEMBER-02 | Customer dapat melihat saldo poin | P0 |
| FR-MEMBER-03 | Customer memiliki QR member unik | P0 |
| FR-MEMBER-04 | QR member tidak memuat data sensitif langsung seperti email/no HP | P0 |
| FR-POINT-01 | Sistem menghitung poin dari transaksi valid | P0 |
| FR-POINT-02 | Mutasi poin dicatat sebagai point history/ledger | P0 |
| FR-POINT-03 | Penambahan poin dari POS harus idempotent berdasarkan `idempotency_key` | P0 |
| FR-POINT-04 | Admin dapat melihat histori poin member | P0 |
| FR-POINT-05 | Admin dapat melakukan adjustment poin dengan alasan | P1 |

### 6.3 Integrasi POS Fase 1

| ID | Requirement | Prioritas |
|---|---|---|
| FR-POS-01 | CRM menyediakan endpoint `POST /webhooks/pos/transactions` | P0 |
| FR-POS-02 | Endpoint menerima event `transaction.completed` | P0 |
| FR-POS-03 | Endpoint memvalidasi header `X-Signature` HMAC-SHA256 dari raw body | P0 |
| FR-POS-04 | Endpoint membaca `X-Idempotency-Key` dan `idempotency_key` dari body untuk deduplication | P0 |
| FR-POS-05 | CRM menyimpan raw payload dan parsed payload untuk audit | P0 |
| FR-POS-06 | CRM melakukan upsert customer berdasarkan `customer.id`, fallback ke `customer.phone` | P0 |
| FR-POS-07 | Walk-in tanpa `customer.id` dan `phone` tetap dicatat sebagai guest anonim | P0 |
| FR-POS-08 | CRM menghitung poin dari `transaction.grand_total` menggunakan aturan CRM | P0 |
| FR-POS-09 | Endpoint membalas 2xx cepat agar worker POS tidak timeout | P0 |
| FR-POS-10 | Event refund/void tidak diproses di Fase 1 dan dicatat sebagai Fase 2 | P1 |

### 6.4 Promo

| ID | Requirement | Prioritas |
|---|---|---|
| FR-PROMO-01 | Customer dapat melihat promo aktif | P0 |
| FR-PROMO-02 | Promo memiliki title, description, image/banner, periode, dan status | P0 |
| FR-PROMO-03 | Admin dapat membuat, mengubah, publish, dan menonaktifkan promo | P0 |
| FR-PROMO-04 | Promo dapat diberi periode mulai dan selesai | P0 |
| FR-PROMO-05 | Admin dapat broadcast promo melalui channel yang tersedia | P1 |

### 6.5 Reward, Voucher, dan Redeem

| ID | Requirement | Prioritas |
|---|---|---|
| FR-REWARD-01 | Customer dapat melihat katalog reward | P0 |
| FR-REWARD-02 | Reward memiliki nama, deskripsi, gambar, point cost, stok, dan status | P0 |
| FR-REWARD-03 | Customer dapat redeem reward jika poin cukup dan stok tersedia | P0 |
| FR-REWARD-04 | Sistem membuat voucher unik setelah redeem berhasil | P0 |
| FR-REWARD-05 | Redeem memotong poin dan membuat voucher secara atomik | P0 |
| FR-REWARD-06 | Voucher memiliki status active, used, expired, atau cancelled | P0 |
| FR-REWARD-07 | Admin/kasir dapat memvalidasi atau menandai voucher sebagai used | P0 |

### 6.6 Admin Dashboard

| ID | Requirement | Prioritas |
|---|---|---|
| FR-ADMIN-01 | Admin dapat melihat dashboard ringkas | P0 |
| FR-ADMIN-02 | Admin dapat melihat, mencari, dan membuka detail member | P0 |
| FR-ADMIN-03 | Admin dapat CRUD promo | P0 |
| FR-ADMIN-04 | Admin dapat CRUD reward | P0 |
| FR-ADMIN-05 | Admin dapat melihat dan mengelola voucher | P0 |
| FR-ADMIN-06 | Admin dapat melihat histori transaksi dan histori redeem | P0 |

---

## 7. User Flow Utama

### 7.1 Customer Register sampai Dashboard

```text
Customer membuka web CRM
-> pilih register/login
-> input email atau nomor HP
-> verifikasi sesuai metode auth
-> profil member dibuat/dimuat
-> masuk ke dashboard member
-> melihat saldo poin, QR member, promo, reward, dan histori
```

### 7.2 Earn Point dari POS

```text
Customer melakukan transaksi di kasir
-> kasir mengenali member melalui QR/no HP/member ID di POS
-> transaksi berhasil di POS
-> POS/Supabase menulis event ke outbox
-> worker crm-sync mengirim webhook ke CRM
-> CRM memvalidasi signature, idempotency, payload, dan member
-> CRM menghitung poin sesuai aturan bisnis
-> CRM menyimpan transaksi dan point history
-> saldo poin customer bertambah
```

### 7.3 Redeem Reward

```text
Customer membuka katalog reward
-> memilih reward
-> sistem mengecek saldo poin dan stok
-> customer konfirmasi redeem
-> sistem memotong poin
-> sistem membuat voucher unik
-> customer melihat kode/QR voucher
-> voucher divalidasi oleh admin/kasir/POS sesuai keputusan mentor
```

### 7.4 Admin Kelola Promo dan Reward

```text
Admin login
-> membuka dashboard
-> memilih menu promo/reward
-> membuat atau mengubah data
-> mengatur status publish/active
-> data tampil di customer web app
```

---

## 8. Integrasi POS

### 8.1 Tujuan Fase 1

Fase 1 integrasi POS berfokus pada event `transaction.completed`. Saat transaksi selesai di POS, sistem POS/Supabase akan mengirim event transaksi ke CRM agar:

- Pelanggan tercatat di CRM, baik member maupun walk-in.
- Transaksi tercatat di CRM lengkap dengan nominal, item, dan metode bayar.
- CRM menghitung poin earning.
- CRM menyimpan saldo poin sebagai source of truth.

CRM tidak membuat sistem POS baru. CRM menerima event dari POS, memproses customer, transaksi, dan poin, lalu menyimpan hasilnya untuk customer app dan admin dashboard.

### 8.2 Ruang Lingkup Fase 1

| Masuk Fase 1 | Tidak Masuk Fase 1 |
|---|---|
| Event `transaction.completed` | Event `transaction.voided` |
| Penerimaan webhook dari POS/Supabase | Event `transaction.refunded` |
| HMAC signature verification | Sinkronisasi saldo resmi kembali ke POS |
| Idempotency transaksi | Penukaran poin langsung di POS |
| Upsert customer dari payload POS | Validasi voucher di POS jika belum disepakati |
| Pencatatan transaksi dan raw payload | Multi-event ordering antar transaksi |
| Perhitungan dan award poin oleh CRM | |

### 8.3 Arsitektur Pengiriman Event

POS bersifat offline-first. Transaksi disimpan lokal lalu di-sync ke Supabase. Dari sisi POS/Supabase, event ke CRM dikirim menggunakan pola outbox agar transaksi tidak hilang walau CRM sedang down.

```text
POS
-> sync-upload ke Supabase
-> orders status selesai
-> DB trigger enqueue_crm_transaction
-> crm_outbox
-> worker crm-sync terjadwal/cron
-> POST + HMAC
-> webhook CRM
```

Pembagian tanggung jawab:

| Komponen | Penanggung Jawab |
|---|---|
| Pengirim event, outbox, retry, signing HMAC | Tim POS/Supabase |
| Endpoint webhook penerima di CRM | Tim CRM |
| Perhitungan poin, saldo, dan konversi poin ke rupiah | Tim CRM |
| Customer app dan admin dashboard | Tim CRM |

Sifat pengiriman event:
- Asinkron.
- At-least-once delivery.
- Bisa terlambat jika POS offline lalu online.
- Bisa dikirim ulang karena retry.
- Urutan antar transaksi tidak dijamin.

Karena itu endpoint CRM wajib idempotent.

### 8.4 Identitas Pelanggan dari POS

Payload transaksi membawa customer dalam tiga kemungkinan:

| Kondisi | `customer.id` | `customer.phone` | `customer.name` | Perlakuan CRM |
|---|---|---|---|---|
| Member / scan QR | UUID stabil | Bisa ada | Nama asli | Match utama memakai `customer.id` |
| Walk-in tetapi diisi kasir | `null` | Bisa ada | Nama input kasir | Fallback match memakai `phone` |
| Walk-in umum | `null` | `null` | `Pelanggan Umum` | Catat transaksi sebagai guest anonim |

QR pelanggan dari POS berisi data `{ id: <serverId>, nama, hp }`. Ketika pelanggan kembali dan QR discan kasir, `customer.id` akan terisi. CRM harus menyimpan `customer.id` dari POS sebagai external customer key.

### 8.5 Contract Webhook CRM

Request:

```http
POST {CRM_WEBHOOK_URL}/webhooks/pos/transactions
Content-Type: application/json
X-Event: transaction.completed
X-Idempotency-Key: <idempotency_key>
X-Signature: sha256=<hex hmac-sha256 dari raw body>
```

Endpoint final CRM:

| Endpoint | Method | Fungsi | Prioritas |
|---|---|---|---|
| `/webhooks/pos/transactions` | POST | Menerima event transaksi selesai dari POS/Supabase | P0 |
| `/api/pos/sync-events` | GET | Melihat log sinkronisasi POS untuk admin/internal | P1 |
| `/api/pos/sync-status` | GET | Melihat status sinkronisasi terakhir | P1 |

### 8.6 Contoh Payload `transaction.completed`

```json
{
  "event": "transaction.completed",
  "event_id": "5f2c1e9a-0000-0000-0000-0000000000d1",
  "occurred_at": "2026-06-10T05:34:56Z",
  "idempotency_key": "#ORD-20260610-001_1718000096000",
  "store_id": "b3a1-store-uuid",
  "branch_id": "c4d2-branch-uuid",
  "customer": {
    "id": "9a8b-customer-uuid",
    "name": "Budi Santoso",
    "phone": "+6281234567890",
    "is_member": true,
    "consent_saved": true
  },
  "transaction": {
    "order_id": "0f1e-order-uuid",
    "order_number": "#ORD-20260610-001",
    "order_type": "dine_in",
    "status": "selesai",
    "cashier_id": "77aa-user-uuid",
    "currency": "IDR",
    "subtotal": 50000,
    "discount_total": 5000,
    "tax_total": 4500,
    "tax_inclusive": true,
    "grand_total": 49500,
    "payment_method": "qris",
    "points_used": 0,
    "points_discount_rupiah": 0,
    "items": [
      {
        "product_id": "p1-product-uuid",
        "name": "Kopi Susu",
        "qty": 2,
        "unit_price": 18000,
        "variant": "Large",
        "addons": ["Extra Shot"],
        "notes": null,
        "is_reward": false,
        "line_total": 36000
      }
    ]
  }
}
```

Semua nominal uang memakai integer rupiah tanpa desimal.

### 8.7 Referensi Field Penting

| Field | Tipe | Catatan |
|---|---|---|
| `event` | string | Selalu `transaction.completed` untuk Fase 1 |
| `event_id` | uuid | Unik per pengiriman; bisa berbeda saat retry |
| `occurred_at` | ISO-8601 UTC | Waktu transaksi selesai |
| `idempotency_key` | string | Stabil per order dan menjadi kunci dedup |
| `store_id` | uuid | ID toko dari POS |
| `branch_id` | uuid | ID cabang dari POS |
| `customer.id` | uuid/null | Identifier utama customer dari POS |
| `customer.phone` | string/null | Fallback match jika `customer.id` null |
| `transaction.order_id` | uuid | ID order server |
| `transaction.order_number` | string | Nomor order yang tampil di POS |
| `transaction.order_type` | enum | `dine_in` atau `take_away` |
| `transaction.status` | string | `selesai` untuk Fase 1 |
| `transaction.grand_total` | int | Total akhir yang dibayar; baseline earning poin |
| `transaction.payment_method` | enum | `tunai`, `qris`, `transfer_bank`, `kartu_debit`, `kartu_kredit`, `compliment`, `nota_gantung` |
| `transaction.points_used` | int | Fase 1 umumnya `0` |
| `transaction.items[].is_reward` | bool | `true` jika item gratis hasil hadiah poin |

### 8.8 Idempotency, Auth, dan Retry

Prinsip wajib:
- Simpan `idempotency_key` dengan unique constraint.
- Jika key belum pernah diproses, proses transaksi dan award poin.
- Jika key sudah diproses, balas 200 dan jangan award poin lagi.
- Verifikasi `X-Signature` menggunakan HMAC-SHA256 atas raw request body.
- Jika signature tidak valid, balas 401 dan jangan proses payload.
- Jika CRM balas non-2xx atau timeout, worker POS akan retry dengan backoff.
- Target response webhook dari sisi POS sekitar 10 detik.

### 8.9 Respons dari CRM

Minimum Fase 1:

```json
{
  "ok": true
}
```

Respons opsional untuk Fase 2:

```json
{
  "ok": true,
  "customer_crm_id": "crm-cust-123",
  "points_awarded": 4950,
  "points_balance": 18230
}
```

Pada Fase 1, POS belum memakai respons poin karena struk sudah tercetak sebelum CRM menjawab. Field opsional boleh dikirim tetapi akan diabaikan oleh POS.

### 8.10 Aturan Poin Baseline

CRM bebas menentukan aturan final, tetapi untuk menjaga konsistensi dengan estimasi poin di struk POS, baseline yang disarankan:

```text
poin = floor(grand_total / poin_per_rupiah)
```

Keputusan default dari dokumen integrasi:

| Hal | Keputusan Default |
|---|---|
| Metode auth | HMAC-SHA256 melalui `X-Signature` |
| Earning dihitung dari | `transaction.grand_total` |
| Pajak | `tax_inclusive: true` |
| Walk-in tanpa ID dan phone | Catat transaksi sebagai guest anonim |
| Pemetaan ID pelanggan | `customer.id` POS disimpan sebagai external key CRM |
| Respons saldo/poin ke POS | Tidak dipakai di Fase 1 |
| Worker pengirim | Cron/terjadwal sekitar 1 menit |

### 8.11 Checklist Implementasi Tim CRM

- [ ] Buat endpoint `POST /webhooks/pos/transactions`.
- [ ] Validasi header `X-Event: transaction.completed`.
- [ ] Validasi `X-Signature` HMAC-SHA256 dari raw body.
- [ ] Simpan dan deduplicate `idempotency_key`.
- [ ] Upsert pelanggan berdasarkan `customer.id`, fallback `customer.phone`.
- [ ] Tangani walk-in anonim tanpa memblokir transaksi.
- [ ] Catat transaksi, item, raw payload, dan status pemrosesan.
- [ ] Hitung poin dari `grand_total`.
- [ ] Simpan mutasi poin di ledger/history.
- [ ] Balas 2xx cepat.
- [ ] Sediakan URL webhook staging dan shared secret untuk testing.

---

## 9. Rencana Arsitektur dan Repository

### 9.1 Struktur Repository

Project direncanakan menggunakan monorepo sederhana:

```text
crm-cafe/
  frontend/   Next.js untuk customer web app dan admin dashboard
  backend/    REST API, database, logic poin, redeem, dan integrasi POS
  docs/       PRD, user flow, wireframe, ERD, API spec, meeting notes, demo notes
  README.md   Panduan setup dan informasi project
```

### 9.2 Catatan Tech Stack

| Bagian | Rencana dari Planning | Catatan |
|---|---|---|
| Frontend | Next.js, Tailwind CSS, shadcn/ui | Fokus Sandria |
| Backend | Laravel REST API | Fokus Alif |
| Repo saat ini | Terdapat starter `backend/` berbasis NestJS | Perlu keputusan apakah lanjut NestJS atau disesuaikan ke Laravel |
| Database | Menunggu keputusan mentor | Kandidat: MySQL/PostgreSQL/Supabase/database perusahaan |
| API Docs | Swagger/OpenAPI | Perlu konfirmasi format |
| Deploy | Menunggu keputusan mentor | Kandidat: Vercel, Railway, Render, VPS, server perusahaan |

Keputusan tech stack backend harus dikonfirmasi karena planning awal menyebut Laravel, sementara repository saat ini berisi starter NestJS.

---

## 10. Model Data Awal

| Tabel | Field Utama | Catatan |
|---|---|---|
| `users` | `id`, `name`, `email`, `phone`, `password_hash`, `role` | Untuk customer/admin jika memakai satu tabel user |
| `members` | `id`, `user_id`, `member_code`, `external_customer_id`, `point_balance`, `tier_id`, `created_at` | `external_customer_id` menyimpan `customer.id` dari POS |
| `transactions` | `id`, `pos_order_id`, `pos_order_number`, `idempotency_key`, `member_id`, `store_id`, `branch_id`, `grand_total`, `payment_method`, `status`, `occurred_at`, `raw_payload` | Sumber transaksi dari POS |
| `transaction_items` | `id`, `transaction_id`, `product_id`, `name`, `qty`, `unit_price`, `variant`, `addons`, `is_reward`, `line_total` | Snapshot item dari payload POS |
| `point_histories` | `id`, `member_id`, `type`, `points`, `balance_after`, `reference_type`, `reference_id`, `note` | Ledger mutasi poin |
| `promos` | `id`, `title`, `description`, `image_url`, `start_at`, `end_at`, `status` | Promo customer |
| `rewards` | `id`, `name`, `description`, `image_url`, `point_cost`, `stock`, `status` | Katalog reward |
| `vouchers` | `id`, `code`, `reward_id`, `member_id`, `status`, `expired_at`, `used_at` | Output redeem |
| `redeems` | `id`, `member_id`, `reward_id`, `voucher_id`, `points_spent`, `created_at` | Histori redeem |
| `pos_sync_logs` | `id`, `event_id`, `idempotency_key`, `status`, `raw_payload`, `error_message`, `created_at` | Audit integrasi POS |
| `tiers` | `id`, `name`, `min_points`, `benefits` | Opsional jika tier dibutuhkan |

Aturan integritas penting:
- `member_code` harus unique.
- `members.external_customer_id` sebaiknya unique jika tersedia.
- `transactions.idempotency_key` harus unique untuk idempotency.
- `transactions.pos_order_id` sebaiknya unique jika tersedia.
- `voucher.code` harus unique.
- Point history bersifat append-only.
- Redeem harus memakai transaksi database agar poin dan voucher konsisten.

---

## 11. Pembagian Peran Tim

| Nama | Role | Fokus Tanggung Jawab |
|---|---|---|
| Muhammad Alif Akhdan Tsani | Lead Backend & Project Coordinator | Backend, database, ERD, REST API, auth, logic poin, redeem voucher, dokumentasi API, integrasi POS |
| Sandria Nuriya Az Zahra | Lead Frontend & UI | User flow, wireframe, frontend Next.js, customer web app, admin dashboard, responsive design, integrasi UI dengan API |

---

## 12. Timeline 40 Hari Kerja

| Minggu | Fase | Output Utama | Fokus Alif | Fokus Sandria |
|---|---|---|---|---|
| Week 1 | Riset & Desain | User flow, wireframe, ERD awal, draft spesifikasi API POS, daftar kebutuhan mentor | Kebutuhan POS, ERD awal, draft API POS | User flow, wireframe customer, wireframe admin, referensi UI |
| Week 2 | Setup & Auth | Repository siap, struktur frontend-backend, base UI, auth awal | Setup backend, database, API auth | Setup Next.js, Tailwind, shadcn/ui, UI login/register |
| Week 3 | Core Member | Saldo poin, QR member, promo, reward, API pendukung | API member, poin, promo, reward, data dummy | Dashboard member, profil, saldo poin, QR, promo, reward |
| Week 4 | Integrasi POS | Webhook `transaction.completed`, HMAC, idempotency, mapping transaksi menjadi poin, histori transaksi | Endpoint webhook, signature verification, idempotency, payload mapping | Histori transaksi, point history, status transaksi, loading/empty/error state |
| Week 5 | Admin Dashboard | Dashboard admin, CRUD member, promo, reward, broadcast promo | API admin, CRUD member, promo, reward, broadcast | Layout admin, table, form, modal, management page |
| Week 6 | Redeem & Histori | Flow redeem reward, kode voucher unik, histori redeem, status voucher | API redeem, validasi poin, kode voucher, status voucher | UI redeem, konfirmasi, kode voucher, histori redeem, status badge |
| Week 7 | QA & Polish | Bug fixing, responsive check, error handling, dokumentasi API, Lighthouse mobile check | Testing API, bug backend, logic poin/redeem, dokumentasi API | Responsive check, polish UI, loading/empty/error state, bug frontend |
| Week 8 | Demo & Handover | Deploy, demo internal, dokumentasi final, demo video, handover | Deploy backend, final API test, dokumentasi integrasi POS | Deploy frontend, final UI check, demo flow customer/admin |

---

## 13. Sprint Backlog Minggu Pertama

| Task | Penanggung Jawab | Target Output |
|---|---|---|
| Kumpulkan kebutuhan dari mentor | Alif dan Sandria | Catatan kebutuhan POS, loyalty, role, branding, data dummy, scope MVP |
| Buat user flow customer | Sandria | Alur customer dari register sampai redeem dan histori |
| Buat user flow admin | Sandria | Alur admin dari login sampai mengelola promo, reward, member, histori |
| Buat wireframe customer web app | Sandria | Login, dashboard member, saldo poin, QR, promo, reward, redeem, histori |
| Buat wireframe admin dashboard | Sandria | Overview, member management, promo, reward, voucher, broadcast, histori |
| Buat ERD awal | Alif | Tabel users, members, transactions, point histories, promos, rewards, vouchers, redeems, tier jika dibutuhkan |
| Buat draft spesifikasi API POS | Alif | Endpoint webhook, payload `transaction.completed`, HMAC auth, idempotency, kebutuhan staging |
| Review output Week 1 | Alif dan Sandria | Revisi setelah arahan mentor dan kesiapan lanjut ke Week 2 |

---

## 14. Non-Functional Requirements

| Kategori | Requirement |
|---|---|
| Responsiveness | Customer web app mobile-first; admin dashboard desktop/laptop-friendly |
| Performance | Halaman utama customer ringan dan cepat dibuka di mobile |
| Reliability | Integrasi POS idempotent dan memiliki log sinkronisasi |
| Security | Auth aman, secret lewat environment variable, validasi input, proteksi endpoint admin, validasi HMAC webhook |
| Privacy | QR member tidak memuat data sensitif langsung |
| Maintainability | Struktur folder jelas, API terdokumentasi, kode modular |
| Observability | Error log untuk POS sync, redeem, auth, dan admin action |
| Data Consistency | Poin, transaksi, redeem, dan voucher diproses konsisten |
| Documentation | PRD, ERD, user flow, API spec, dan meeting notes tersedia di `docs/` |

---

## 15. Risiko dan Mitigasi

| Area Risiko | Asumsi Awal | Dampak Jika Tidak Dikonfirmasi | Mitigasi |
|---|---|---|---|
| URL webhook CRM belum siap | POS/Supabase sudah menunggu URL staging/prod dari CRM | Worker `crm-sync` belum bisa diuji end-to-end | Siapkan endpoint staging lebih awal |
| HMAC signature salah | Shared secret atau raw body handling tidak cocok | Webhook valid ditolak 401 | Buat test curl HMAC dan dokumentasikan cara verifikasi |
| Duplicate delivery | Worker POS mengirim at-least-once | Poin bisa dobel jika tidak idempotent | Unique constraint `idempotency_key` dan no-op untuk duplikat |
| POS offline / event terlambat | POS offline-first | Poin tidak langsung muncul di CRM | Tampilkan histori berdasarkan waktu transaksi dan log sync |
| Aturan Poin | Poin dihitung dari nominal transaksi valid | Logic backend dan UI saldo berubah | Konfirmasi rumus poin dan pembulatan sebelum implementasi |
| Redeem Voucher | Voucher berupa kode unik atau QR | Jika harus divalidasi di POS, perlu endpoint tambahan | Konfirmasi bentuk voucher dan tempat validasi |
| Double award poin | POS/Supabase masih punya trigger poin lama | Saldo pelanggan dobel | Koordinasi agar trigger poin lama dimatikan saat CRM jadi source of truth |
| Tier Membership | Tier disiapkan sebagai fitur lanjutan | Jika wajib MVP, scope database dan UI bertambah | Pastikan tier masuk MVP atau P2 |
| Provider OTP | OTP memakai email/WhatsApp sesuai credential | Auth Week 2 dapat terhambat | Sediakan fallback auth untuk staging |
| Tech Stack Backend | Planning menyebut Laravel, repo saat ini NestJS | Risiko rework setup backend | Putuskan stack final secepatnya |
| Libur Minggu Pertama | Timeline dapat digeser | Due date dan estimasi berubah | Update timeline setelah tanggal efektif disetujui |

---

## 16. Pertanyaan Mentor

### 16.1 Prioritas Saat Mentoring

Keputusan integrasi yang sudah ditetapkan dari dokumen `integrasi-crm.docx`:
- Fase 1 hanya memproses `transaction.completed`.
- POS/Supabase mengirim event ke CRM via webhook.
- Endpoint CRM: `POST /webhooks/pos/transactions`.
- Auth webhook memakai HMAC-SHA256 pada header `X-Signature`.
- Deduplication memakai `idempotency_key` / `X-Idempotency-Key`.
- CRM menjadi source of truth saldo poin.
- Earning default dihitung dari `transaction.grand_total`.
- Walk-in tanpa ID dan phone tetap dicatat sebagai guest anonim.
- Refund/void dan sync saldo balik ke POS masuk Fase 2.

Pertanyaan tersisa yang paling prioritas:
- URL webhook CRM staging dan production.
- Shared secret HMAC dan cara distribusinya.
- Nilai konfigurasi poin final: `poin_per_rupiah`, nilai rupiah per poin, expiry poin.
- Keputusan tech stack backend final.
- Target deployment CRM.

### 16.2 Frontend dan UI

| Topik | Pertanyaan |
|---|---|
| Logo | Apakah sudah ada file logo resmi cafe/perusahaan dalam PNG atau SVG? |
| Warna Brand | Apakah ada warna utama brand yang wajib diikuti? |
| Referensi Tampilan | Apakah ada referensi loyalty app seperti Fore, Kopi Kenangan, Starbucks Rewards, atau dashboard tertentu? |
| Banner Promo | Apakah tersedia contoh banner promo atau ukuran banner yang biasa digunakan? |
| Data Dummy | Apakah mentor dapat menyediakan data dummy member, promo, reward, voucher, transaksi, dan redeem? |
| Halaman Customer | Halaman customer apa saja yang wajib untuk MVP dan mana yang boleh menyusul? |
| Halaman Admin | Halaman admin apa saja yang wajib untuk MVP? |
| QR Member | QR member digunakan untuk identitas member, voucher redeem, atau keduanya? |
| Redeem Voucher | Setelah redeem, output berupa kode voucher unik, QR voucher, barcode, atau status voucher saja? |
| Prioritas Device | Customer harus mobile-first dan admin desktop/laptop-first? |

### 16.3 Loyalty dan Role

| Topik | Pertanyaan |
|---|---|
| Aturan Poin | Bagaimana skema poin, pembulatan, dan masa berlaku poin? |
| Aturan Redeem | Bagaimana minimal poin, masa berlaku voucher, status voucher, dan pengurangan poin? |
| Role Pengguna | Apakah role hanya customer, admin, kasir, atau ada role tambahan? |
| Role Kasir | Apakah kasir cukup memakai POS internal atau perlu halaman khusus di CRM? |
| Tier Membership | Apakah silver/gold/platinum masuk MVP atau fitur lanjutan? |

### 16.4 Backend dan Integrasi POS

| Kode | Pertanyaan |
|---|---|
| A1 | Apa URL webhook CRM untuk staging dan production? |
| A2 | Bagaimana shared secret HMAC dikirim dan dirotasi? |
| A3 | Apakah CRM perlu menyediakan IP allowlist atau cukup HMAC? |
| A4 | Apakah event dari staging POS sudah bisa dikirim ke endpoint staging CRM? |
| A5 | Apakah transaksi lama dari POS perlu diimport ke CRM? |
| A6 | Kapan trigger poin lama di POS/Supabase dimatikan agar tidak terjadi double-award? |
| A7 | Bagaimana format final `poin_per_rupiah` dan `poin_nilai_rupiah` yang harus diikuti CRM? |
| A8 | Apakah `compliment` dan `nota_gantung` tetap mendapat poin atau dikecualikan? |
| A9 | Apakah CRM perlu memproses item `is_reward: true` untuk earning poin atau dikecualikan? |
| A10 | Untuk Fase 2, apakah refund/void akan dikirim sebagai event baru atau koreksi transaksi lama? |

### 16.5 Aturan Bisnis Poin

| Kode | Pertanyaan |
|---|---|
| B1 | Bagaimana rumus poin, misalnya berapa poin per rupiah? |
| B2 | Apakah ada minimum transaksi untuk mendapatkan poin? |
| B3 | Apakah keputusan final tetap memakai `grand_total` untuk earning poin? |
| B4 | Apakah poin memiliki expiry? |
| B5 | Apakah poin bisa digunakan di POS atau hanya untuk redeem reward di CRM? |
| B6 | Apakah ada batas maksimal poin per transaksi atau per hari? |

### 16.6 Member, Reward, dan Voucher

| Kode | Pertanyaan |
|---|---|
| C1 | Apakah sudah ada data member existing dari POS, Excel, atau sistem lain? |
| C2 | Member baru hanya dibuat dari CRM atau juga bisa dibuat dari POS? |
| C3 | Voucher hasil redeem divalidasi di POS, admin CRM, atau hanya ditunjukkan customer? |
| C4 | Bentuk voucher berupa kode unik, QR code, barcode, atau kombinasi? |
| C5 | Apakah voucher memiliki masa berlaku? |
| C6 | Apakah reward memiliki stok? |
| C7 | Apakah tier membership masuk MVP atau disiapkan untuk pengembangan berikutnya? |

### 16.7 Backend, Auth, dan Operasional

| Kode | Pertanyaan |
|---|---|
| D1 | OTP dikirim melalui WhatsApp gateway, email, SMS, atau provider lain? |
| D2 | Apakah credential OTP provider sudah tersedia? |
| D3 | Backend final memakai Laravel sesuai planning atau NestJS/Fastify sesuai starter repo/brief? |
| D4 | Database final memakai MySQL, PostgreSQL, Supabase, atau database perusahaan? |
| D5 | Target deployment memakai Vercel, Railway, Render, VPS, server perusahaan, atau platform lain? |
| D6 | Siapa yang menyediakan environment variable dan secret seperti database URL, POS API key, OTP credential, JWT secret, dan deploy credential? |
| D7 | Apakah dokumentasi API harus dibuat dalam format Swagger/OpenAPI? |

---

## 17. Deliverables

- Customer Web App.
- Admin Dashboard.
- Backend CRM API.
- Database schema dan migration.
- Endpoint webhook POS `POST /webhooks/pos/transactions`.
- Integrasi POS/mock POS untuk demo event `transaction.completed`.
- Dokumentasi HMAC signature dan idempotency.
- ERD.
- User flow customer dan admin.
- Wireframe customer dan admin.
- API documentation.
- Dokumentasi integrasi POS.
- Testing notes untuk auth, POS sync, point calculation, redeem, dan admin CRUD.
- Demo video atau demo notes.
- Handover document.

---

## 18. Kesimpulan

Project Web Apps CRM Cafe difokuskan pada pengembangan customer web app, admin dashboard, backend CRM API, database, dan integrasi dengan POS internal perusahaan. Tim tidak membangun sistem kasir dari nol, melainkan menyiapkan CRM agar event transaksi selesai dari POS dapat menjadi dasar pencatatan customer, transaksi, dan penambahan poin member.

Pada tahap berikutnya, tim perlu memprioritaskan endpoint webhook staging, validasi HMAC, idempotency, model data transaksi, dan aturan poin final. Dokumen ini tetap perlu diperbarui jika ada perubahan kontrak POS, URL staging/production, atau keputusan tech stack backend.
