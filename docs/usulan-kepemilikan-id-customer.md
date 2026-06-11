# Kepemilikan `customer.id` (Integrasi POS ↔ CRM)

**Dari:** Tim CRM · **Untuk:** Tim POS · **Tanggal:** 2026-06-11
**Terkait:** `integrasi-crm.md` §3 (Identitas Pelanggan) & §6 (Idempotency/Match).

---

> ## ✅ STATUS: DISEPAKATI — **Opsi A (CRM yang memiliki `customer.id`)**
> Disepakati bersama tim POS pada 2026-06-11. **Tanpa migrasi** karena ini startup — belum ada data pelanggan nyata, data POS saat ini masih dummy.
>
> **Kesepakatan:**
> - CRM menerbitkan id pelanggan (dipakai **`memberCode`**, mis. `MBR-...`), di-encode di QR member `{ id, nama, hp }`.
> - POS menyimpan id buatan CRM & **mengirimnya kembali** di `customer.id` tiap transaksi.
> - CRM mencocokkan `customer.id` → `memberCode` (nomor HP sebagai cadangan).
>
> Bagian di bawah adalah pertimbangan/latar yang dibahas, disimpan sebagai catatan.

---

## 1. Konteks

Tiap transaksi POS dikirim ke CRM lewat webhook. CRM mengenali pelanggan dari **`customer.id`** (utama) + **nomor HP** (cadangan). Pertanyaan yang disepakati: **siapa yang menerbitkan `customer.id`?** → **CRM (Opsi A).**

## 2. Alur yang disepakati (Opsi A)

```
CRM terbitkan id member (memberCode)  →  encode jadi QR  →  pelanggan tunjukkan QR
        │  scanner POS (2D) membaca id dari QR
        ▼
POS simpan id itu  →  kirim balik di customer.id tiap transaksi
        ▼
CRM cocokkan customer.id → memberCode  →  poin masuk ke akun yang benar
```

Keuntungan: pelanggan yang **mendaftar lewat web CRM lebih dulu** langsung punya id & QR, sehingga dikenali POS sejak transaksi pertama.

## 3. Opsi yang dipertimbangkan (arsip)

| Aspek | A: CRM punya id ✅ | B: POS punya id | C: pakai HP |
|---|---|---|---|
| Pelanggan daftar dari web duluan langsung dikenali | ✅ | ❌ (via HP) | ✅ (via HP) |
| Sesuai sistem POS awal | 🟡 POS sesuaikan | ✅ | 🟡 |
| Cocok offline-first | 🟡 | ✅ | ✅ |
| Keandalan identitas | ✅ tinggi | ✅ tinggi | ❌ HP bisa ganti |

Karena startup (tanpa data lama) & data POS masih dummy, beban perubahan Opsi A kecil → **Opsi A dipilih.**

## 4. Yang perlu dipastikan tim POS

1. **Format QR & scanner:** QR code **2D** berisi `{ id, nama, hp }`, scanner kasir mendukung 2D. (`id` = string `memberCode`, tidak muat di barcode 1D biasa.)
2. **Echo id:** POS menyimpan `memberCode` dari QR dan mengirimkannya **persis** di `customer.id` pada payload transaksi.
3. **Walk-in tanpa QR:** kirim `customer.id = null` (+ HP bila ada) → CRM tangani lewat HP / anonim, tidak memblok transaksi (sesuai §11 #4).

## 5. Sisi CRM — sudah & akan disesuaikan

- ✅ Webhook `POST /webhooks/pos/transactions` (HMAC, idempotent) — jalan & teruji.
- ✅ CRM generate **QR member** (sekarang `id` = `memberCode`).
- ✅ Pencocokan webhook: `customer.id` → `memberCode` (utama), HP (cadangan).
- Field `externalCustomerId` (dulu untuk serverId POS) tidak dipakai lagi pada Opsi A.

> Pencatatan transaksi & perhitungan poin **tidak terpengaruh** keputusan ini — hanya soal field identitas mana yang jadi kunci.
