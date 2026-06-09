# Product Requirements Document (PRD)
## P1 - Web Apps CRM Cafe

| Informasi | Keterangan |
|---|---|
| Nama Project | P1 - Web Apps CRM Cafe |
| Nama Produk | CRM Cafe |
| Tim | Tim 5 - Cafe CRM Crew |
| Anggota | Muhammad Alif Akhdan Tsani, Sandria Nuriya Az Zahra |
| Durasi Acuan | 40 hari kerja untuk MVP |
| Versi Dokumen | 1.2 |
| Tanggal Revisi | 9 Juni 2026 |
| Status | Draft untuk review mentor |
| Fokus Dokumen | PRD, scope MVP, rencana kerja, risiko, dan pertanyaan mentor |

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
3. Transaksi POS dikirim atau diambil oleh CRM.
4. CRM menghitung dan menambahkan poin ke member.
5. Customer melihat saldo poin, promo, reward, dan histori.
6. Customer redeem poin menjadi reward/voucher.
7. Admin mengelola data dasar loyalty melalui dashboard.

### Acceptance Criteria Produk

| ID | Kriteria | Cara Verifikasi |
|---|---|---|
| AC-01 | Customer dapat register/login dan masuk ke dashboard member | Uji manual flow auth |
| AC-02 | Customer dapat melihat profil, saldo poin, dan QR member | Uji halaman dashboard member |
| AC-03 | CRM dapat menerima atau mengambil transaksi POS/mock POS | Uji endpoint webhook atau polling |
| AC-04 | Transaksi valid menghasilkan penambahan poin | Cek transaksi, point ledger, dan saldo |
| AC-05 | Transaksi duplikat tidak menggandakan poin | Kirim transaction ID yang sama dua kali |
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
| POS Integration API | P0 | Webhook/polling sesuai hasil mentoring |
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
| FR-POINT-03 | Penambahan poin dari POS harus idempotent | P0 |
| FR-POINT-04 | Admin dapat melihat histori poin member | P0 |
| FR-POINT-05 | Admin dapat melakukan adjustment poin dengan alasan | P1 |

### 6.3 Promo

| ID | Requirement | Prioritas |
|---|---|---|
| FR-PROMO-01 | Customer dapat melihat promo aktif | P0 |
| FR-PROMO-02 | Promo memiliki title, description, image/banner, periode, dan status | P0 |
| FR-PROMO-03 | Admin dapat membuat, mengubah, publish, dan menonaktifkan promo | P0 |
| FR-PROMO-04 | Promo dapat diberi periode mulai dan selesai | P0 |
| FR-PROMO-05 | Admin dapat broadcast promo melalui channel yang tersedia | P1 |

### 6.4 Reward, Voucher, dan Redeem

| ID | Requirement | Prioritas |
|---|---|---|
| FR-REWARD-01 | Customer dapat melihat katalog reward | P0 |
| FR-REWARD-02 | Reward memiliki nama, deskripsi, gambar, point cost, stok, dan status | P0 |
| FR-REWARD-03 | Customer dapat redeem reward jika poin cukup dan stok tersedia | P0 |
| FR-REWARD-04 | Sistem membuat voucher unik setelah redeem berhasil | P0 |
| FR-REWARD-05 | Redeem memotong poin dan membuat voucher secara atomik | P0 |
| FR-REWARD-06 | Voucher memiliki status active, used, expired, atau cancelled | P0 |
| FR-REWARD-07 | Admin/kasir dapat memvalidasi atau menandai voucher sebagai used | P0 |

### 6.5 Admin Dashboard

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
-> POS mengirim data ke CRM atau CRM mengambil data dari POS
-> CRM memvalidasi payload dan member
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

### 8.1 Prinsip Integrasi

Integrasi POS adalah bagian paling kritis dan belum boleh diasumsikan final sebelum mentor memberi konfirmasi. CRM hanya perlu terhubung dengan POS internal perusahaan, bukan menggantikan POS.

Prinsip wajib:
- Setiap transaksi POS memiliki identifier unik.
- Proses mapping transaksi menjadi poin harus idempotent.
- Payload POS harus tervalidasi.
- Transaksi, point history, dan saldo harus konsisten.
- Kasus paid, cancel, refund, void, pending, dan failed perlu dikonfirmasi.
- Perlu log sinkronisasi untuk debugging dan rekonsiliasi.

### 8.2 Opsi Mekanisme

| Opsi | Penjelasan | Catatan |
|---|---|---|
| Webhook / push | POS mengirim transaksi ke CRM | Direkomendasikan jika POS mendukung |
| Polling / pull | CRM mengambil transaksi dari POS secara berkala | Fallback jika POS hanya menyediakan read API |
| Batch import | Transaksi dikirim dalam batch/export | Fallback untuk testing/demo |

### 8.3 Draft Payload Transaksi

Contoh berikut hanya draft diskusi, bukan kontrak final:

```json
{
  "transaction_id": "TRX-2026-0001",
  "status": "paid",
  "member_identifier": "MBR-0001",
  "amount": 55000,
  "discount_amount": 5000,
  "final_amount": 50000,
  "occurred_at": "2026-06-09T10:15:00+07:00",
  "outlet_id": "CAFE-01",
  "items": [
    {
      "sku": "LATTE",
      "name": "Latte",
      "qty": 2,
      "price": 27500
    }
  ]
}
```

### 8.4 Endpoint Awal CRM

| Endpoint | Method | Fungsi | Prioritas |
|---|---|---|---|
| `/api/pos/transactions` | POST | Menerima transaksi dari POS/webhook | P0 |
| `/api/pos/sync-events` | GET | Melihat log sinkronisasi POS | P1 |
| `/api/pos/sync-status` | GET | Melihat status sinkronisasi terakhir | P1 |
| `/api/vouchers/validate` | POST | Validasi voucher saat dipakai | P0 jika voucher harus divalidasi di CRM/POS |

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
| `members` | `id`, `user_id`, `member_code`, `point_balance`, `tier_id`, `created_at` | Data loyalty customer |
| `transactions` | `id`, `pos_transaction_id`, `member_id`, `amount`, `status`, `occurred_at`, `raw_payload` | Sumber transaksi dari POS |
| `point_histories` | `id`, `member_id`, `type`, `points`, `balance_after`, `reference_type`, `reference_id`, `note` | Ledger mutasi poin |
| `promos` | `id`, `title`, `description`, `image_url`, `start_at`, `end_at`, `status` | Promo customer |
| `rewards` | `id`, `name`, `description`, `image_url`, `point_cost`, `stock`, `status` | Katalog reward |
| `vouchers` | `id`, `code`, `reward_id`, `member_id`, `status`, `expired_at`, `used_at` | Output redeem |
| `redeems` | `id`, `member_id`, `reward_id`, `voucher_id`, `points_spent`, `created_at` | Histori redeem |
| `pos_sync_logs` | `id`, `external_id`, `status`, `raw_payload`, `error_message`, `created_at` | Audit integrasi POS |
| `tiers` | `id`, `name`, `min_points`, `benefits` | Opsional jika tier dibutuhkan |

Aturan integritas penting:
- `member_code` harus unique.
- `pos_transaction_id` harus unique untuk idempotency.
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
| Week 4 | Integrasi POS | Endpoint sync transaksi POS, mapping transaksi menjadi poin, histori transaksi | Endpoint POS, payload mapping, paid/cancel/refund handling | Histori transaksi, point history, status transaksi, loading/empty/error state |
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
| Buat draft spesifikasi API POS | Alif | Endpoint, payload, webhook/polling, auth, paid/cancel/refund, kebutuhan staging |
| Review output Week 1 | Alif dan Sandria | Revisi setelah arahan mentor dan kesiapan lanjut ke Week 2 |

---

## 14. Non-Functional Requirements

| Kategori | Requirement |
|---|---|
| Responsiveness | Customer web app mobile-first; admin dashboard desktop/laptop-friendly |
| Performance | Halaman utama customer ringan dan cepat dibuka di mobile |
| Reliability | Integrasi POS idempotent dan memiliki log sinkronisasi |
| Security | Auth aman, secret lewat environment variable, validasi input, proteksi endpoint admin |
| Privacy | QR member tidak memuat data sensitif langsung |
| Maintainability | Struktur folder jelas, API terdokumentasi, kode modular |
| Observability | Error log untuk POS sync, redeem, auth, dan admin action |
| Data Consistency | Poin, transaksi, redeem, dan voucher diproses konsisten |
| Documentation | PRD, ERD, user flow, API spec, dan meeting notes tersedia di `docs/` |

---

## 15. Risiko dan Mitigasi

| Area Risiko | Asumsi Awal | Dampak Jika Tidak Dikonfirmasi | Mitigasi |
|---|---|---|---|
| Integrasi POS | POS tersedia dan tim hanya membuat integrasi | Development Week 4 dapat tertunda | Prioritaskan pertanyaan POS di mentoring, buat mock POS |
| Aturan Poin | Poin dihitung dari nominal transaksi valid | Logic backend dan UI saldo berubah | Konfirmasi rumus poin dan pembulatan sebelum implementasi |
| Redeem Voucher | Voucher berupa kode unik atau QR | Jika harus divalidasi di POS, perlu endpoint tambahan | Konfirmasi bentuk voucher dan tempat validasi |
| Tier Membership | Tier disiapkan sebagai fitur lanjutan | Jika wajib MVP, scope database dan UI bertambah | Pastikan tier masuk MVP atau P2 |
| Provider OTP | OTP memakai email/WhatsApp sesuai credential | Auth Week 2 dapat terhambat | Sediakan fallback auth untuk staging |
| Tech Stack Backend | Planning menyebut Laravel, repo saat ini NestJS | Risiko rework setup backend | Putuskan stack final secepatnya |
| Libur Minggu Pertama | Timeline dapat digeser | Due date dan estimasi berubah | Update timeline setelah tanggal efektif disetujui |

---

## 16. Pertanyaan Mentor

### 16.1 Prioritas Saat Mentoring

Pertanyaan paling prioritas:
- A1 sampai A6: mekanisme integrasi POS, payload, identitas member, refund/void, staging, dan auth POS.
- B1 dan B4: rumus poin dan expiry poin.
- C3: tempat validasi voucher.
- D1, D3, D5: channel OTP, tech stack backend final, dan target deploy.

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
| A1 | Apakah POS mengirim data ke CRM via webhook/push atau CRM mengambil data via polling/pull? |
| A2 | Apa isi payload transaksi POS dan apakah ada contoh JSON real? |
| A3 | Field apa yang digunakan POS untuk mengenali member: no HP, member ID, email, QR code, atau barcode? |
| A4 | Bagaimana menangani refund, void, atau pembatalan transaksi? |
| A5 | Apakah tersedia staging atau sandbox POS untuk testing? |
| A6 | Autentikasi endpoint integrasi memakai API key, HMAC signature, OAuth, IP whitelist, atau lainnya? |
| A7 | Apakah POS hanya mengirim transaksi berhasil atau juga pending, failed, refund, dan void? |
| A8 | Apakah transaksi POS dikirim satu per satu atau batch? |
| A9 | Jika webhook gagal, apakah POS memiliki mekanisme retry? |
| A10 | Apakah transaksi lama perlu diimport ke CRM? |

### 16.5 Aturan Bisnis Poin

| Kode | Pertanyaan |
|---|---|
| B1 | Bagaimana rumus poin, misalnya berapa poin per rupiah? |
| B2 | Apakah ada minimum transaksi untuk mendapatkan poin? |
| B3 | Poin dihitung dari total sebelum diskon atau setelah diskon? |
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
- Integrasi POS atau mock POS untuk demo.
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

Project Web Apps CRM Cafe difokuskan pada pengembangan customer web app, admin dashboard, backend CRM API, database, dan integrasi dengan POS internal perusahaan. Tim tidak membangun sistem kasir dari nol, melainkan menyiapkan CRM agar transaksi dari POS dapat menjadi dasar penambahan poin member.

Pada tahap awal, tim memprioritaskan pendalaman kebutuhan, user flow, wireframe, ERD awal, dan draft spesifikasi API POS. Setelah mentoring teknis, dokumen ini perlu diperbarui agar scope, timeline, tech stack, dan rancangan integrasi sesuai dengan kebutuhan perusahaan.
