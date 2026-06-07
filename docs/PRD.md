# Product Requirements Document (PRD)
## Web Apps CRM Cafe — Loyalty Program & Promo Terintegrasi POS

| | |
|---|---|
| **Nama Produk** | CRM Cafe (Loyalty & Promo Web App) |
| **Tipe Produk** | Web Application (Customer-facing + Admin Dashboard) |
| **Versi Dokumen** | 1.0 (Draft) |
| **Tanggal** | 7 Juni 2026 |
| **Penyusun** | Peserta Magang (Software Developer) |
| **Status** | Draft — menunggu review mentor & tim POS |
| **Durasi Target** | 40 hari kerja (~8 minggu) — MVP |
| **Referensi** | Brief P1 — Magang 40 Hari Kerja |

> **Catatan penting:** Spesifikasi integrasi POS pada dokumen ini bersifat **asumsi sementara**. Detail final (skema auth, payload, mekanisme push/pull) **WAJIB** dikonfirmasi dengan mentor tim POS sebelum implementasi Minggu 4. Lihat [Bagian 11 — Open Questions](#11-open-questions--keputusan-yang-perlu-dikonfirmasi).

---

## Daftar Isi
1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Latar Belakang & Masalah](#2-latar-belakang--masalah)
3. [Tujuan & Metrik Sukses](#3-tujuan--metrik-sukses)
4. [Persona & Target Pengguna](#4-persona--target-pengguna)
5. [Ruang Lingkup (Scope)](#5-ruang-lingkup-scope)
6. [Functional Requirements](#6-functional-requirements)
7. [User Flows](#7-user-flows)
8. [Integrasi POS](#8-integrasi-pos-inti-proyek)
9. [Arsitektur & Tech Stack](#9-arsitektur--tech-stack)
10. [Model Data (ERD)](#10-model-data-erd)
11. [Open Questions](#11-open-questions--keputusan-yang-perlu-dikonfirmasi)
12. [Non-Functional Requirements](#12-non-functional-requirements)
13. [Milestone & Timeline](#13-milestone--timeline-40-hari-kerja)
14. [Deliverables](#14-deliverables)
15. [Risiko & Mitigasi](#15-risiko--mitigasi)
16. [Lampiran](#16-lampiran)

---

## 1. Ringkasan Eksekutif

CRM Cafe adalah web aplikasi *mobile-first* yang memungkinkan pelanggan cafe mengumpulkan poin dari setiap transaksi, menukar poin menjadi reward/voucher, dan menerima informasi promo terbaru. Sistem terhubung **secara real-time** dengan POS internal perusahaan sehingga setiap transaksi di kasir otomatis menambah poin ke akun member tanpa input manual.

Produk terdiri dari dua antarmuka:
- **Customer App** — diakses member via browser (tanpa install aplikasi native).
- **Admin Dashboard** — untuk admin/owner cafe mengelola member, promo, reward, dan broadcast.

Nilai utama: **retention pelanggan tanpa friksi instalasi**, dengan biaya akuisisi rendah dan loyalty engine yang terintegrasi langsung ke alur transaksi yang sudah ada.

---

## 2. Latar Belakang & Masalah

Cafe membutuhkan kanal retention pelanggan yang **tidak bergantung pada aplikasi mobile native** karena biaya install dan friksi onboarding yang tinggi. Aplikasi native menghadapi hambatan: pelanggan enggan menginstal app untuk satu cafe, biaya maintenance dua platform (iOS/Android), dan siklus rilis lambat.

**Solusi:** Web CRM ringan yang mobile-friendly, dapat dibuka langsung dari browser (atau QR code di meja/struk), dan terhubung ke POS untuk sinkronisasi poin otomatis. Member cukup membuka link, registrasi cepat dengan OTP, dan langsung mendapat poin dari transaksi.

**Masalah yang dipecahkan:**
- Tidak ada program loyalty terstruktur → pelanggan tidak punya alasan untuk kembali.
- Poin manual rawan error dan lambat → butuh sinkronisasi otomatis dari POS.
- Promo tidak tersampaikan ke pelanggan secara tepat → butuh kanal broadcast.

---

## 3. Tujuan & Metrik Sukses

### 3.1 Tujuan MVP
- Pelanggan dapat registrasi & login dengan minim friksi (email / no HP + OTP).
- Setiap transaksi di POS otomatis menambah poin ke akun pelanggan.
- Pelanggan dapat melihat saldo poin, histori transaksi, dan promo aktif.
- Pelanggan dapat menukar poin menjadi reward/voucher.
- Admin dapat mengelola member, promo, tier, dan reward dari dashboard.

### 3.2 Kriteria Sukses MVP (Acceptance Criteria tingkat produk)
| # | Kriteria | Cara Ukur |
|---|----------|-----------|
| KS-1 | Member bisa registrasi → dapat poin dari POS → tukar reward (end-to-end) | Uji manual end-to-end di staging |
| KS-2 | Sinkronisasi POS stabil, **tidak ada poin hilang/ganda** | Idempotency test: kirim webhook duplikat, poin tetap konsisten |
| KS-3 | Admin dapat menjalankan minimal 1 siklus promo penuh | Buat → publish → expire promo dari dashboard |
| KS-4 | Aplikasi responsif di mobile | Lighthouse Mobile **≥ 80** |

### 3.3 Metrik Produk (pasca-launch, untuk evaluasi)
- **Activation rate**: % pelanggan yang transaksi → registrasi member.
- **Redemption rate**: % member yang menukar minimal 1 reward.
- **Repeat visit**: rata-rata transaksi per member per bulan.
- **Sync reliability**: % transaksi POS yang berhasil tercatat sebagai poin (target ≥ 99,9%).

---

## 4. Persona & Target Pengguna

### 4.1 Member (Pelanggan Cafe) — *primary, mobile-first*
- **Konteks:** membuka web via browser HP, sering sambil mengantri/menunggu pesanan.
- **Kebutuhan:** registrasi cepat, lihat saldo poin, tahu cara dapat reward, lihat promo.
- **Pain point:** tidak mau install app, tidak mau isi form panjang.

### 4.2 Kasir / Staff Cafe — *trigger update poin*
- **Konteks:** berada di POS, men-scan QR member saat transaksi.
- **Kebutuhan:** identifikasi member cepat (scan QR / input no HP), poin terkirim otomatis.
- **Pain point:** alur tidak boleh memperlambat antrian.

### 4.3 Admin / Owner Cafe — *kelola & analitik*
- **Konteks:** mengakses dashboard via desktop/laptop.
- **Kebutuhan:** CRUD promo/reward/member, broadcast promo, lihat ringkasan member.
- **Pain point:** butuh kontrol penuh tanpa harus minta developer.

---

## 5. Ruang Lingkup (Scope)

### 5.1 In Scope (MVP — Must-have)
- ✅ Registrasi & login (email atau no HP + OTP).
- ✅ Halaman profil & saldo poin + **QR code member**.
- ✅ Sinkronisasi otomatis poin dari transaksi POS (webhook/polling).
- ✅ Daftar promo aktif (banner + detail).
- ✅ Katalog reward & flow tukar poin (redeem → voucher kode unik).
- ✅ Riwayat transaksi & riwayat redeem.
- ✅ Admin dashboard: CRUD promo, reward, member, broadcast info promo.

### 5.2 Out of Scope (Fase Lanjutan — *nice-to-have*)
- ⏳ Tier membership (silver/gold/platinum) dengan benefit berbeda.
- ⏳ Notifikasi WhatsApp (Fonnte / WA Business API) saat promo & redeem.
- ⏳ Referral program (member ajak member dapat poin).
- ⏳ Birthday reward otomatis.
- ⏳ Analitik member lanjutan (RFM, LTV).

> **Catatan:** Skema data sebaiknya **sudah menyiapkan kolom tier** (mis. `tier_id` di tabel member) agar fitur lanjutan tidak butuh migrasi besar. Implementasi logika tier tetap di luar MVP.

### 5.3 Asumsi
- POS internal perusahaan menyediakan environment **staging** untuk testing integrasi.
- POS mampu melakukan push (webhook) **atau** menyediakan API untuk polling.
- Setiap transaksi POS memiliki identifier member (QR member di-scan / no HP diinput kasir).

---

## 6. Functional Requirements

Setiap requirement diberi ID (`FR-x`) agar mudah dilacak ke test case. Prioritas: **P0** = wajib MVP, **P1** = sebaiknya, **P2** = lanjutan.

### 6.1 Autentikasi & Akun (FR-AUTH)
| ID | Requirement | Prioritas |
|----|-------------|-----------|
| FR-AUTH-1 | Member dapat registrasi dengan email **atau** nomor HP | P0 |
| FR-AUTH-2 | Verifikasi via OTP (kode 4–6 digit) yang dikirim ke email/WhatsApp | P0 |
| FR-AUTH-3 | Login menggunakan email/no HP + OTP, session via JWT | P0 |
| FR-AUTH-4 | OTP punya masa berlaku (mis. 5 menit) dan rate-limit (anti-spam) | P0 |
| FR-AUTH-5 | Member dapat logout dan token di-invalidate | P0 |
| FR-AUTH-6 | Admin login terpisah dengan role berbeda (RBAC: `admin`, `member`) | P0 |

### 6.2 Profil & Poin Member (FR-PROFILE)
| ID | Requirement | Prioritas |
|----|-------------|-----------|
| FR-PROFILE-1 | Member dapat melihat & edit profil (nama, email, no HP, tgl lahir) | P0 |
| FR-PROFILE-2 | Member dapat melihat saldo poin terkini | P0 |
| FR-PROFILE-3 | Sistem menampilkan **QR code member** unik untuk di-scan kasir | P0 |
| FR-PROFILE-4 | QR code merepresentasikan member ID (bukan data sensitif) | P0 |

### 6.3 Poin & Transaksi (FR-POINT)
| ID | Requirement | Prioritas |
|----|-------------|-----------|
| FR-POINT-1 | Sistem menerima data transaksi dari POS dan menambah poin otomatis | P0 |
| FR-POINT-2 | Aturan poin terkonfigurasi (mis. X poin per Rp Y), termasuk pembulatan | P0 |
| FR-POINT-3 | Setiap perubahan poin tercatat di **ledger** (earn/redeem/adjust) | P0 |
| FR-POINT-4 | Proses penambahan poin **idempoten** (anti dobel dari webhook ganda) | P0 |
| FR-POINT-5 | Member dapat melihat riwayat transaksi (tanggal, nominal, poin didapat) | P0 |
| FR-POINT-6 | (Opsional MVP) Poin punya masa kedaluwarsa (expiry) | P1 |

### 6.4 Promo (FR-PROMO)
| ID | Requirement | Prioritas |
|----|-------------|-----------|
| FR-PROMO-1 | Member dapat melihat daftar promo aktif (banner + detail) | P0 |
| FR-PROMO-2 | Promo punya periode mulai–berakhir dan status (draft/active/expired) | P0 |
| FR-PROMO-3 | Admin dapat CRUD promo (judul, deskripsi, gambar, periode) | P0 |
| FR-PROMO-4 | Admin dapat broadcast info promo ke member | P0 |

### 6.5 Reward & Redeem (FR-REWARD)
| ID | Requirement | Prioritas |
|----|-------------|-----------|
| FR-REWARD-1 | Member dapat melihat katalog reward (nama, poin dibutuhkan, stok) | P0 |
| FR-REWARD-2 | Member dapat menukar poin → reward jika saldo cukup | P0 |
| FR-REWARD-3 | Saat redeem, sistem generate **kode voucher unik** | P0 |
| FR-REWARD-4 | Poin dipotong **atomik** saat redeem (tidak boleh saldo negatif) | P0 |
| FR-REWARD-5 | Member dapat melihat riwayat redeem & status voucher (active/used/expired) | P0 |
| FR-REWARD-6 | Admin/kasir dapat menandai voucher sebagai *used* (redemption di cafe) | P0 |
| FR-REWARD-7 | Admin dapat CRUD reward (termasuk stok & status aktif) | P0 |

### 6.6 Admin Dashboard (FR-ADMIN)
| ID | Requirement | Prioritas |
|----|-------------|-----------|
| FR-ADMIN-1 | Admin dapat melihat & mencari daftar member | P0 |
| FR-ADMIN-2 | Admin dapat melihat detail member (saldo, riwayat, profil) | P0 |
| FR-ADMIN-3 | Admin dapat melakukan penyesuaian poin manual (dengan alasan, tercatat di ledger) | P1 |
| FR-ADMIN-4 | Admin dapat mengelola konfigurasi aturan poin | P1 |
| FR-ADMIN-5 | Dashboard menampilkan ringkasan (total member, poin beredar, redeem) | P1 |

### 6.7 Integrasi POS (FR-POS) — lihat detail di [Bagian 8](#8-integrasi-pos-inti-proyek)
| ID | Requirement | Prioritas |
|----|-------------|-----------|
| FR-POS-1 | Endpoint menerima transaksi dari POS (webhook) **atau** polling ke POS | P0 |
| FR-POS-2 | Autentikasi request POS (API key / signature / mTLS — sesuai spec POS) | P0 |
| FR-POS-3 | Validasi & idempotency berdasarkan `transaction_id` POS | P0 |
| FR-POS-4 | Logging setiap event sinkronisasi untuk audit & rekonsiliasi | P0 |
| FR-POS-5 | Mekanisme retry/dead-letter untuk transaksi yang gagal diproses | P1 |

---

## 7. User Flows

### 7.1 Registrasi & Onboarding Member
```
Buka link/scan QR cafe → Halaman registrasi → Input email/no HP
  → Kirim OTP → Input OTP → Verifikasi sukses → Lengkapi profil
  → Dashboard member (saldo 0, QR member tampil)
```

### 7.2 Earn Point (transaksi di cafe)
```
Member pesan di kasir → Tunjukkan QR member → Kasir scan di POS
  → POS proses transaksi → POS push webhook ke CRM (transaction_id, member_id, amount)
  → CRM hitung poin (rule) → cek idempotency → tambah poin ke ledger
  → Saldo member ter-update → (opsional) notifikasi
```

### 7.3 Redeem Reward
```
Member buka katalog reward → Pilih reward → Cek saldo cukup
  → Konfirmasi tukar → Sistem potong poin (atomik) → Generate kode voucher unik
  → Tampilkan voucher → Member tunjukkan ke kasir → Kasir tandai "used"
```

### 7.4 Admin Kelola Promo
```
Admin login → Menu Promo → Buat promo (judul, gambar, periode) → Simpan (draft)
  → Publish (status active) → Promo tampil di member app
  → (opsional) Broadcast → Saat lewat periode → status expired otomatis
```

> Diagram flow visual (Figma/Excalidraw) akan dilampirkan terpisah sebagai deliverable Minggu 1.

---

## 8. Integrasi POS (Inti Proyek)

> ⚠️ **JANGAN biarkan coding agent menebak spesifikasi POS.** Ambil dokumen resmi dari mentor tim POS terlebih dahulu. Bagian ini adalah **rancangan asumsi** untuk diskusi.

### 8.1 Dua Mekanisme Sinkronisasi

**Opsi A — Webhook (push, direkomendasikan):**
POS mengirim HTTP POST ke endpoint CRM setiap kali ada transaksi.
- **Kelebihan:** real-time, hemat resource.
- **Kebutuhan:** POS mendukung outbound webhook + signing.

**Opsi B — Polling (pull, fallback):**
CRM memanggil API POS secara periodik (mis. setiap 1–5 menit) untuk mengambil transaksi baru.
- **Kelebihan:** tidak butuh POS push, lebih mudah jika POS hanya punya API read.
- **Kekurangan:** ada delay, butuh penanda *cursor*/timestamp terakhir.

> **Rekomendasi:** mulai dengan **webhook** jika POS mendukung; siapkan **polling sebagai fallback**.

### 8.2 Contoh Payload Webhook (ASUMSI — konfirmasi ke tim POS)
```json
{
  "event": "transaction.completed",
  "transaction_id": "TRX-2026-0001",
  "occurred_at": "2026-06-07T10:15:00+07:00",
  "member_identifier": "MBR-abc123",   // dari QR scan / no HP
  "amount": 55000,                      // total transaksi (Rp)
  "outlet_id": "CAFE-JKT-01",
  "items": [ { "name": "Latte", "qty": 2, "price": 27500 } ],
  "signature": "hmac-sha256-..."        // verifikasi keaslian
}
```

### 8.3 Keamanan & Keandalan (wajib)
- **Autentikasi:** verifikasi signature (HMAC) atau API key — sesuai skema POS.
- **Idempotency:** simpan `transaction_id`; tolak/abaikan duplikat agar **poin tidak dobel**.
- **Validasi:** pastikan `member_identifier` valid; jika tidak ditemukan → simpan ke *pending/unmatched* untuk rekonsiliasi.
- **Atomicity:** penambahan poin + pencatatan ledger dalam satu transaksi DB.
- **Retry & Dead-letter:** transaksi gagal masuk antrian untuk diproses ulang (Redis queue).
- **Audit log:** simpan raw payload + status proses tiap event.

### 8.4 Spec API CRM → POS (untuk dokumentasi Swagger)
| Endpoint | Method | Fungsi |
|----------|--------|--------|
| `POST /api/v1/pos/webhook/transaction` | POST | Menerima transaksi dari POS |
| `GET /api/v1/pos/sync/status` | GET | Status sinkronisasi terakhir |
| (polling mode) panggil API POS | GET | Tarik transaksi baru sejak cursor |

---

## 9. Arsitektur & Tech Stack

### 9.1 Tech Stack (saran brief — final menyusul keputusan peserta)
| Layer | Teknologi |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui |
| **Backend** | NestJS (atau Fastify) + Prisma ORM |
| **Database** | PostgreSQL (Supabase / Neon) |
| **Cache & Queue** | Redis (Upstash) — OTP, rate-limit, queue webhook |
| **Auth** | JWT + OTP (WhatsApp / email) |
| **Storage** | S3 / MinIO — gambar promo & banner |
| **Deploy** | Vercel (frontend) + Railway / Fly.io (backend) |
| **API Docs** | OpenAPI / Swagger |

### 9.2 Arsitektur Tingkat Tinggi
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Member Web  │     │  Admin Web   │     │   POS Internal│
│  (Next.js)   │     │  (Next.js)   │     │  (perusahaan) │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │  HTTPS/JWT         │                    │ webhook/poll
       └─────────┬──────────┘                    │
                 ▼                                ▼
          ┌──────────────────────────────────────────┐
          │            Backend API (NestJS)           │
          │  Auth · Point Engine · Promo · Reward ·   │
          │  POS Sync · Admin · Notification          │
          └───────┬───────────────┬──────────┬────────┘
                  ▼               ▼          ▼
            ┌──────────┐    ┌─────────┐ ┌──────────┐
            │PostgreSQL│    │  Redis  │ │  S3/MinIO│
            └──────────┘    └─────────┘ └──────────┘
```

---

## 10. Model Data (ERD)

Entitas inti (draft — akan difinalkan sebagai diagram ERD Minggu 1):

| Entitas | Field Kunci | Catatan |
|---------|-------------|---------|
| **members** | id, name, email, phone, birthdate, tier_id (nullable), point_balance, created_at | `tier_id` disiapkan untuk fitur lanjutan |
| **point_ledger** | id, member_id, type (earn/redeem/adjust/expire), amount, balance_after, ref_type, ref_id, created_at | Sumber kebenaran saldo (immutable) |
| **transactions** | id, pos_transaction_id (unique), member_id, amount, outlet_id, occurred_at, raw_payload, status | `pos_transaction_id` unik → idempotency |
| **promos** | id, title, description, image_url, start_at, end_at, status, created_by | |
| **rewards** | id, name, description, image_url, point_cost, stock, is_active | |
| **redemptions** | id, member_id, reward_id, voucher_code (unique), point_spent, status (active/used/expired), created_at, used_at | |
| **users (admin)** | id, name, email, password_hash, role | RBAC admin |
| **otp_codes** | id, identifier, code_hash, expires_at, attempts | Rate-limit & verifikasi |
| **tiers** | id, name, min_points, benefits | *Out of scope MVP* — struktur disiapkan |

**Relasi utama:**
- `members 1—N point_ledger`
- `members 1—N transactions`
- `members 1—N redemptions`
- `rewards 1—N redemptions`
- `members N—1 tiers` (opsional)

**Aturan integritas kritikal:**
- `transactions.pos_transaction_id` **UNIQUE** → cegah poin dobel.
- Saldo dihitung/diverifikasi dari `point_ledger`, bukan sekadar kolom counter.
- Redeem: cek saldo + insert ledger + buat voucher dalam **satu transaksi DB**.

---

## 11. Open Questions — Keputusan yang Perlu Dikonfirmasi

> Pertanyaan ini **harus dijawab bersama mentor/tim POS sebelum Minggu 4**. Jangan diasumsikan oleh coding agent.

### 11.1 Integrasi POS (prioritas tertinggi)
- [ ] Bagaimana POS mengekspos data transaksi: **webhook, API pull, atau akses database**?
- [ ] Skema autentikasi API POS: API key, HMAC signature, OAuth, atau mTLS?
- [ ] Format & field payload transaksi yang pasti?
- [ ] Bagaimana member diidentifikasi di POS (QR scan, no HP, kartu)?
- [ ] Apakah tersedia **environment staging** POS untuk testing?
- [ ] Bagaimana menangani transaksi refund/void (kurangi poin)?

### 11.2 Skema Poin & Bisnis
- [ ] Berapa **poin per Rupiah**? (mis. 1 poin / Rp 1.000)
- [ ] Aturan **pembulatan** (ke bawah/terdekat)?
- [ ] Apakah poin punya **masa kedaluwarsa (expiry)**? Berapa lama?
- [ ] Apakah ada minimum transaksi untuk dapat poin?

### 11.3 Membership & Skala
- [ ] Apakah sudah ada **tier membership** saat ini?
- [ ] Berapa **jumlah member existing** yang perlu dimigrasi (jika ada)?
- [ ] Berapa estimasi volume transaksi/hari (untuk sizing)?

### 11.4 Channel OTP & Notifikasi
- [ ] OTP via **email, WhatsApp (Fonnte/WA Business), atau keduanya**?
- [ ] Apakah perusahaan sudah punya gateway WhatsApp/SMS?

---

## 12. Non-Functional Requirements

| Kategori | Requirement |
|----------|-------------|
| **Performance** | Lighthouse Mobile ≥ 80; halaman utama member load < 3 dtk di 4G |
| **Responsiveness** | Mobile-first, berfungsi penuh di layar ≥ 360px |
| **Reliability** | Sinkronisasi POS ≥ 99,9% transaksi tercatat; idempoten |
| **Security** | JWT, hash password (admin), OTP rate-limit, validasi signature POS, HTTPS only, input sanitization |
| **Privacy** | QR member tidak memuat data sensitif; PII (no HP/email) tersimpan aman |
| **Scalability** | Queue (Redis) untuk lonjakan webhook saat jam ramai |
| **Observability** | Logging audit sinkronisasi POS; error tracking |
| **Maintainability** | Kode di-review manual sebelum merge; struktur modular |
| **Documentation** | OpenAPI/Swagger untuk seluruh endpoint, khususnya POS |
| **Compatibility** | Browser modern (Chrome, Safari, Firefox) mobile & desktop |

---

## 13. Milestone & Timeline (40 Hari Kerja)

| Minggu | Fase | Output Utama |
|--------|------|--------------|
| **1** | Riset & Desain | User flow, wireframe, ERD, **dokumen spec API POS** (hasil diskusi mentor) |
| **2** | Setup & Auth | Repo, CI/CD, base UI, sistem auth OTP, halaman profil member |
| **3** | Core Member | Saldo poin, QR member, halaman promo, halaman reward (UI + API) |
| **4** | Integrasi POS | Endpoint sinkronisasi transaksi → poin, simulasi webhook dari POS |
| **5** | Admin Dashboard | CRUD promo, reward, member, broadcast (UI + API) |
| **6** | Redeem & Histori | Flow tukar poin, kode voucher unik, halaman histori |
| **7** | QA & Polish | Bug fix, responsive check, error handling, dokumentasi API |
| **8** | Demo & Handover | Deploy production, demo internal, serah terima ke tim POS |

> **Catatan timeline:** Spec POS (Minggu 1) adalah *blocker* untuk Minggu 4. Jika dokumen POS belum siap, prioritaskan eskalasi ke mentor lebih awal. Gunakan **mock/simulator webhook** agar Minggu 3–4 tidak terblokir menunggu staging POS.

---

## 14. Deliverables

- [ ] Source code (Git repo) — frontend & backend.
- [ ] MVP terdeploy — **staging + production**.
- [ ] Dokumentasi API (OpenAPI/Swagger) — khususnya endpoint integrasi POS.
- [ ] ERD database & user flow diagram.
- [ ] Demo video singkat (3–5 menit).
- [ ] Catatan koordinasi dengan tim POS (notulen / Loom).

---

## 15. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| Spec POS belum jelas / staging belum siap | Blokir Minggu 4 | Eskalasi awal; bangun **mock webhook simulator** untuk paralel kerja |
| Poin dobel/hilang dari webhook ganda | Kepercayaan member rusak | **Idempotency** via `pos_transaction_id` unik + ledger + transaksi atomik |
| Race condition saat redeem (saldo) | Saldo negatif / voucher invalid | Operasi redeem atomik (DB transaction + lock/cek saldo) |
| OTP disalahgunakan (spam) | Biaya & abuse | Rate-limit per identifier/IP, masa berlaku OTP pendek |
| Scope creep ke fitur lanjutan | Telat MVP | Pegang batas In/Out of Scope; tier/WA/referral ke fase berikutnya |
| Performa mobile < 80 | Gagal kriteria sukses | Optimasi gambar (S3 + lazy), code-split, audit Lighthouse rutin |
| Ketergantungan coding agent tanpa review | Bug masuk produksi | **Code review manual wajib** sebelum merge (sesuai catatan brief) |

---

## 16. Lampiran

### 16.1 Referensi Kompetitor / Riset
- Loyverse Loyalty — https://loyverse.com/loyalty-program
- Tada (loyalty Indonesia) — https://tada.network
- Supabase Auth (OTP) — https://supabase.com/docs/guides/auth
- shadcn/ui — https://ui.shadcn.com

### 16.2 Glosarium
| Istilah | Arti |
|---------|------|
| **Ledger** | Catatan immutable setiap mutasi poin (earn/redeem/adjust/expire) |
| **Idempotency** | Sifat operasi yang aman dijalankan berulang tanpa efek ganda |
| **Redeem** | Proses menukar poin menjadi reward/voucher |
| **Webhook** | HTTP callback dari POS ke CRM saat ada event transaksi |
| **Tier** | Tingkatan membership (silver/gold/platinum) — fitur lanjutan |
| **RFM** | Recency, Frequency, Monetary — metrik analitik member (lanjutan) |

---

*Dokumen ini adalah PRD turunan dari Brief P1. Keputusan desain & arsitektur final tetap di tangan peserta magang, dengan detail teknis integrasi POS dikonfirmasi bersama mentor sebelum eksekusi.*
