# Integrasi CRM — Spesifikasi Fase 1 (Transaction → CRM)

> **Audience:** Developer CRM. **Tujuan dokumen:** memberi cukup detail agar tim CRM bisa **mulai bekerja hari ini** tanpa harus baca seluruh codebase POS.

---

## 1. Tujuan & Ruang Lingkup

### Fase 1 (fokus sekarang)

Saat sebuah **transaksi di-submit (selesai)** di POS, sistem akan **mengirim (POST) event transaksi ke CRM** supaya:

1. **Pelanggan tercatat** di CRM (member maupun walk-in).
2. **Transaksi tercatat** di CRM (nominal, item, metode bayar).
3. **CRM yang menghitung poin** (earning) dan **konversi poin ↔ rupiah** — CRM adalah **sumber kebenaran (source of truth)** saldo poin.

> Kenapa CRM yang hitung poin, bukan POS? Karena poin itu milik **pelanggan**, dipakai lintas cabang/kasir/channel. Kalau tiap POS hitung & simpan sendiri → saldo bentrok/dobel. CRM = satu rumah saldo poin.

### Yang TIDAK termasuk Fase 1 (menyusul, jangan dikerjakan dulu)

- Void/refund → reversal poin (`transaction.voided` / `transaction.refunded`). **Fase 2.**
- **Redemption real-time** (tukar poin saat di kasir butuh cek saldo live ke CRM). **Fase 2.**
- **Sync-balance kembali ke POS** untuk ditampilkan di struk. **Fase 2.** Di Fase 1, struk POS tetap menampilkan **estimasi poin versi POS** (lihat §8); saldo resmi dilihat di CRM.

---

## 2. Arsitektur & Dari Mana Event Berasal

POS bersifat **offline-first**: transaksi disimpan lokal (Isar) lalu di-sync ke **Supabase** lewat edge function `sync-upload`. Order difinalkan di server (status `selesai`).

Pengiriman ke CRM memakai **pola outbox** supaya **andal** (tak hilang walau CRM down) dan **tidak menyentuh jalur order live**:

```
[POS] --sync--> orders (status=selesai)
 │ (DB trigger: enqueue_crm_transaction)
 ▼
 crm_outbox ──(worker crm-sync, terjadwal/cron)──> POST + HMAC ──> [WEBHOOK CRM]
                                                                   ▲ KAMU BANGUN INI
```

- **Trigger DB** menulis 1 baris outbox tiap order `selesai` — otomatis untuk **semua** jalur order (sync offline `sync-upload` & online `create-order`), pola sama dengan `award_loyalty_points`.
- **Worker `crm-sync`** (edge function, sisi kami) membaca outbox → kirim ke CRM dengan **retry + backoff**.
- Outbox = jaminan **at-least-once**: kalau CRM down/lambat, event tetap tersimpan & dikirim ulang.
- Di-gate `stores.crm_aktif` (default `false`) → outbox baru terisi untuk toko yang mengaktifkan CRM.

### Pembagian tanggung jawab

| Komponen | Siapa yang bangun |
|---|---|
| Pengirim event (edge function `crm-sync`, retry, signing) | **Tim kami (POS/Supabase)** |
| **Endpoint webhook penerima** di CRM | **Kamu (CRM)** |
| Perhitungan poin, saldo, konversi poin↔Rp | **Kamu (CRM)** |

> **Penting (sifat pengiriman):** event dikirim **asinkron** dan **at-least-once**. Artinya: bisa **terlambat** (karena POS offline lalu online), bisa **dikirim ulang** (retry), dan urutan antar-transaksi **tidak dijamin**. Maka endpoint kamu **wajib idempoten** (lihat §6).

---

## 3. Identitas Pelanggan (baca ini dulu)

Tiap order membawa info pelanggan dalam 3 kemungkinan:

| Kondisi | `customer.id` | `customer.phone` | `customer.name` |
|---|---|---|---|
| **Member** (pelanggan tersimpan / scan QR) | UUID (stabil) | bisa ada | nama asli |
| **Walk-in tapi diisi** (nama/HP diketik kasir, belum disimpan) | `null` | bisa ada | nama yang diketik |
| **Walk-in umum** | `null` | `null` | `"Pelanggan Umum"` |

- **Identifier utama = `customer.id`** (ini `serverId` pelanggan di sistem kami; sama dengan yang di-encode di **QR member** pelanggan).
- Kalau `customer.id` null tapi ada `phone` → CRM boleh pakai **phone sebagai fallback match**.
- Kalau dua-duanya null (`Pelanggan Umum`) → keputusan kamu: simpan sebagai **guest/anonymous** atau skip pencatatan pelanggan (tetap catat transaksinya). Lihat §11 (keputusan terbuka).

> **QR member:** isi QR pelanggan = `{ id: <serverId>, nama, hp }`. Jadi pelanggan balik = kasir scan QR → `customer.id` terisi. Inilah cara CRM mengenali returning customer paling akurat.

---

## 4. Kontrak Event — `transaction.completed`

### Request

```
POST {CRM_WEBHOOK_URL}/webhooks/pos/transactions
Content-Type: application/json
X-Event: transaction.completed
X-Idempotency-Key: <idempotency_key>   # stabil per-order (lihat §6)
X-Signature: sha256=<hex hmac-sha256 dari raw body, pakai shared secret>
```

### Body (contoh lengkap)

```json
{
  "event": "transaction.completed",
  "event_id": "5f2c1e9a-...-d1",
  "occurred_at": "2026-06-10T05:34:56Z",
  "idempotency_key": "#ORD-20260610-001_1718000096000",
  "store_id": "b3a1...-store-uuid",
  "branch_id": "c4d2...-branch-uuid",
  "customer": {
    "id": "9a8b...-customer-uuid",
    "name": "Budi Santoso",
    "phone": "+6281234567890",
    "is_member": true,
    "consent_saved": true
  },
  "transaction": {
    "order_id": "0f1e...-order-uuid",
    "order_number": "#ORD-20260610-001",
    "order_type": "dine_in",
    "status": "selesai",
    "cashier_id": "77aa...-user-uuid",
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
        "product_id": "p1...-uuid",
        "name": "Kopi Susu",
        "qty": 2,
        "unit_price": 18000,
        "variant": "Large",
        "addons": ["Extra Shot"],
        "notes": null,
        "is_reward": false,
        "line_total": 36000
      },
      {
        "product_id": "p2...-uuid",
        "name": "Croissant",
        "qty": 1,
        "unit_price": 14000,
        "variant": null,
        "addons": [],
        "notes": null,
        "is_reward": false,
        "line_total": 14000
      }
    ]
  }
}
```

---

## 5. Referensi Field

### Level atas

| Field | Tipe | Catatan |
|---|---|---|
| `event` | string | Selalu `"transaction.completed"` di Fase 1. |
| `event_id` | uuid | Unik **per pengiriman** (beda tiap retry). |
| `occurred_at` | ISO-8601 UTC | Waktu transaksi selesai. |
| `idempotency_key` | string | **Stabil per-order** (sama walau di-retry). Kunci dedup. |
| `store_id` / `branch_id` | uuid | Toko & cabang. |

### `customer`

| Field | Tipe | Catatan |
|---|---|---|
| `id` | uuid \| null | `serverId` pelanggan; null untuk walk-in. Identifier utama. |
| `name` | string | Bisa `"Pelanggan Umum"`. |
| `phone` | string \| null | Fallback match. |
| `is_member` | bool | `true` jika `id != null`. |
| `consent_saved` | bool | Pelanggan opt-in disimpan ke daftar (tombol "Simpan ke daftar pelanggan"). |

### `transaction`

| Field | Tipe | Catatan |
|---|---|---|
| `order_id` | uuid | ID order di server. |
| `order_number` | string | Mis. `#ORD-20260610-001`. |
| `order_type` | enum | `dine_in` \| `take_away`. |
| `status` | string | `selesai`. |
| `cashier_id` | uuid | Kasir yang melayani. |
| `currency` | string | `IDR`. |
| `subtotal` | int (rupiah) | Sebelum diskon & pajak. |
| `discount_total` | int | Gabungan diskon (voucher + manual). |
| `tax_total` | int | Total pajak. |
| `tax_inclusive` | bool | Sistem kami pakai pajak **inclusive**; pastikan logika poin kamu konsisten (lihat §8). |
| `grand_total` | int | **Total akhir yang dibayar.** |
| `payment_method` | enum | `tunai` \| `qris` \| `transfer_bank` \| `kartu_debit` \| `kartu_kredit` \| `compliment` \| `nota_gantung`. |
| `points_used` | int | Poin yang **sudah dipakai** pelanggan di transaksi ini (redemption di POS). Di Fase 1 biasanya `0`. |
| `points_discount_rupiah` | int | Nominal diskon dari poin yang dipakai. |
| `items[]` | array | Lihat di bawah. |

### `transaction.items[]`

| Field | Tipe | Catatan |
|---|---|---|
| `product_id` | uuid | ID produk. |
| `name` | string | Nama produk (snapshot). |
| `qty` | int | Kuantitas. |
| `unit_price` | int | Harga satuan. |
| `variant` | string \| null | Mis. `"Large"`. |
| `addons` | string[] | Nama add-on. |
| `notes` | string \| null | Catatan item. |
| `is_reward` | bool | `true` = item gratis hasil tukar poin (Hadiah Poin), harga `0`. |
| `line_total` | int | Subtotal baris. |

> Semua nominal **integer rupiah** (tanpa desimal/sen).

---

## 6. Idempotency, Auth, Retry

### Idempotency (WAJIB)

- `idempotency_key = transaction.order_id` (UUID order di server) — **stabil & unik per order**, sama di tiap retry.
- Dedup berdasarkan `idempotency_key`.
- Pengiriman **at-least-once** → key yang sama bisa datang >1×. Endpoint harus:
  - Kalau key **belum** diproses → proses & catat.
  - Kalau key **sudah** diproses → **balas 200** (no-op), **jangan** tambah poin lagi.

### Auth — HMAC signature (rekomendasi)

- Header `X-Signature: sha256=<hmac>`, di mana `hmac = HMAC_SHA256(shared_secret, raw_request_body)` (hex).
- Verifikasi: hitung ulang HMAC dari **raw body** pakai shared secret; tolak `401` kalau tidak cocok.
- Shared secret akan kami kirim lewat channel aman (lihat §11).

### Retry & respons

- Balas **2xx secepatnya** (cukup ack diterima). Kerjakan proses berat (hitung poin, dll) **async** di sisi CRM.
- Kalau kamu balas **non-2xx** atau timeout → kami **retry** dengan backoff. Maka idempotency wajib jalan.
- Target timeout dari sisi kami: **~10 detik**.

---

## 7. Respons yang Diharapkan dari CRM

### Fase 1 (minimum)

```
HTTP/1.1 200 OK
{ "ok": true }
```

### Opsional (akan kami pakai di Fase 2)

```json
{
  "ok": true,
  "customer_crm_id": "crm-cust-123",
  "points_awarded": 4950,
  "points_balance": 18230
}
```

> Di Fase 1, field poin di respons **belum** dipakai POS (struk sudah tercetak sebelum CRM menjawab). Boleh dikirim, kami abaikan dulu.

---

## 8. Perhitungan Poin — Aturan POS Saat Ini (sebagai baseline)

CRM bebas menentukan aturannya sendiri, tapi ini perilaku POS sekarang sebagai acuan agar tidak membingungkan pelanggan:

- **Earning:** `poin = floor(grand_total / poin_per_rupiah)`.
- **Konversi saat tukar poin:** `1 poin = poin_nilai_rupiah rupiah`.
- Config (`poin_aktif`, `poin_per_rupiah`, `poin_nilai_rupiah`) saat ini di-set **per-toko**.
- Pajak **inclusive** → `grand_total` sudah termasuk pajak. Tentukan apakah earning dihitung dari `grand_total` atau `subtotal` (keputusan terbuka §11).

> **Konsistensi pembulatan:** struk POS menampilkan **estimasi** poin (pakai rumus di atas). Kalau aturan/pembulatan CRM beda, bisa muncul selisih "struk tulis 10, CRM kasih 9". Disarankan CRM mengikuti rumus `floor` yang sama, atau kita sepakati satu aturan.

---

## 9. ⚠️ Hindari Double-Award

Saat ini Supabase punya **DB trigger** `award_loyalty_points()` yang otomatis menambah `customers.poin` ketika order `status=selesai` + `customer_id` tidak null (plus `loyalty_reverse_on_cancel()` untuk pembatalan). Trigger `enqueue_crm_transaction()` (baru) **terpisah** dan hanya menulis outbox — tidak menghitung poin.

Saat CRM mengambil alih perhitungan poin, trigger `award_loyalty_points()` akan kami **non-aktifkan** (mis. drop trigger / matikan `poin_aktif`) supaya poin tidak dihitung 2× (sekali oleh DB, sekali oleh CRM). **Ini koordinasi sisi kami** — kamu tidak perlu mengubah apa pun, tapi penting kamu tahu supaya angka tidak dobel saat migrasi.

---

## 10. ✅ Checklist Fase 1 untuk Tim CRM (mulai sekarang)

1. Bangun endpoint `POST /webhooks/pos/transactions` yang menerima payload §4.
2. **Verifikasi HMAC** `X-Signature` (tolak 401 kalau invalid).
3. **Idempotent**: simpan `idempotency_key` yang sudah diproses; key berulang → 200 no-op.
4. **Upsert pelanggan**: match by `customer.id` → fallback `phone`. Tangani walk-in (id+phone null).
5. **Catat transaksi** (simpan payload mentah + parsed) terhubung ke pelanggan.
6. **Hitung & award poin** pakai aturan CRM (acuan §8). Simpan saldo.
7. Balas **2xx cepat**; proses berat async.
8. Sediakan **endpoint staging** + terima **shared secret** untuk uji coba.

### Uji cepat (contoh `curl` yang akan kami kirimkan)

```bash
BODY='{"event":"transaction.completed","idempotency_key":"TEST-1", ...}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$SHARED_SECRET" | awk '{print $2}')
curl -X POST "$CRM_WEBHOOK_URL/webhooks/pos/transactions" \
  -H "Content-Type: application/json" \
  -H "X-Event: transaction.completed" \
  -H "X-Idempotency-Key: TEST-1" \
  -H "X-Signature: sha256=$SIG" \
  -d "$BODY"
```

---

## 11. Keputusan (sudah ditetapkan — bisa di-override)

Sudah kami tetapkan sebagai default terbaik. Hanya **#1 (URL webhook)** yang menunggu dari tim CRM.

| # | Hal | Keputusan |
|---|---|---|
| 1 | URL webhook CRM (staging & prod) | ⏳ **menunggu dari CRM** |
| 2 | Metode auth | **HMAC-SHA256** (`X-Signature`) |
| 3 | Earning dihitung dari | `grand_total` (incl. pajak — samakan dgn POS) |
| 4 | Walk-in tanpa id & phone | **Catat transaksinya**, pelanggan = guest anonim (jangan blok transaksi) |
| 5 | Pemetaan id pelanggan | Pakai `customer.id` kami sebagai **external key** di CRM |
| 6 | CRM membalas saldo/poin di Fase 1 | **Tidak** (boleh dikirim, kami abaikan; dipakai Fase 2) |
| 7 | Pemicu worker | **Terjadwal/cron tiap ~1 menit** (delay ≤1 menit dapat diterima di Fase 1) |

---

## 12. Lampiran — Referensi Kode (sisi POS, untuk konteks)

| Hal | Lokasi |
|---|---|
| Finalisasi order (submit) | `apps/pos/lib/features/pos/providers/completed_order_provider.dart` → `finalizeOrder()` |
| Payload sync POS→server | idem, builder payload |
| Upload ke server | `apps/pos/lib/services/sync_upload_service.dart` |
| Edge function finalisasi | `supabase/functions/sync-upload/index.ts` |
| Model order | `apps/pos/lib/models/local/order_local.dart` |
| Model item | `apps/pos/lib/models/local/order_item_local.dart` |
| Model pelanggan | `apps/pos/lib/models/local/customer_local.dart` |
| QR pelanggan | `apps/pos/lib/features/pos/utils/customer_qr.dart` |
| Config poin | `apps/pos/lib/services/loyalty_config_service.dart` |
| Trigger poin (DB) | `supabase/migrations/20260602020000_loyalty_points.sql` |

> Field internal kami sebagian berbahasa Indonesia (`nomorOrder`, `totalPajak`, `customerNama`, dst). Kontrak event di §4 sudah dinormalkan ke nama netral — CRM cukup mengacu ke §4–§6, tidak perlu tahu nama internal.

---

## 13. Sisi Server — Sudah Di-scaffold (sisi kami)

Komponen pengirim sudah dibuat mengikuti konvensi codebase (lihat `supabase/functions/AGENTS.md`). **Inert** sampai diaktifkan, jadi tidak mengganggu sistem berjalan.

| Komponen | File | Fungsi |
|---|---|---|
| Migration outbox + trigger | `supabase/migrations/20260610000000_crm_outbox.sql` | Tabel `crm_outbox`, flag `stores.crm_aktif`, trigger `enqueue_crm_transaction()` |
| Worker pengirim | `supabase/functions/crm-sync/index.ts` | Baca outbox → build event §4 → sign HMAC → POST ke CRM + retry/backoff |
| Registrasi fungsi | `supabase/config.toml` | `[functions.crm-sync] verify_jwt = false` |

### Status outbox

`pending` → (kirim sukses) `delivered` · (gagal, < 8 attempt) tetap `pending` dgn backoff eksponensial (cap 60 mnt) · (≥ 8 attempt) `failed`.

### Cara mengaktifkan & deploy (saat URL CRM siap)

```bash
# 1. Set secret (URL & secret dari tim CRM, + worker secret bebas)
supabase secrets set CRM_WEBHOOK_URL="https://crm.example.com/webhooks/pos/transactions"
supabase secrets set CRM_WEBHOOK_SECRET="<shared-secret-dgn-CRM>"
supabase secrets set CRM_WORKER_SECRET="<secret-pemicu-worker>"

# 2. Deploy migration + fungsi
supabase db push
supabase functions deploy crm-sync

# 3. Aktifkan untuk toko tertentu (gate)
#    UPDATE public.stores SET crm_aktif = true WHERE id = '<store-uuid>';

# 4. Jadwalkan worker (Supabase Cron / scheduler eksternal), tiap ~1 menit:
#    POST {FUNCTIONS_URL}/crm-sync   header: X-Worker-Secret: <CRM_WORKER_SECRET>
```

### Uji manual worker

```bash
curl -X POST "$FUNCTIONS_URL/crm-sync" -H "X-Worker-Secret: $CRM_WORKER_SECRET"
# → { "success": true, "data": { "processed": N, "delivered": x, "failed": y } }
```

> **Catatan asumsi** di worker yang perlu dikonfirmasi saat wiring: `points_used` / `points_discount_rupiah` di-hardcode `0` (Fase 1; redemption = Fase 2), dan `tax_inclusive: true` (mengikuti setup pajak inclusive). `is_reward` item diturunkan dari (`harga_satuan = 0` & catatan memuat "Hadiah Poin").
