# POS → CRM API — Integrasi Transaksi (Fase 1)

Dokumen untuk tim POS. Berisi **satu-satunya endpoint** yang perlu dipanggil POS:
webhook pengiriman transaksi selesai ke CRM. Endpoint CRM lainnya (member, rewards,
admin) bersifat internal dan tidak dipakai integrasi POS.

- Versi: 1.0 (Fase 1)
- Base URL: `https://<host-crm>` — _diisi tim CRM (staging/production)_
- Format: JSON, UTF-8
- Auth: HMAC-SHA256 per request (lihat §2)

> ⚠️ **Shared secret (`CRM_WEBHOOK_SECRET`) dikirim terpisah lewat kanal aman**,
> tidak dicantumkan di dokumen ini.

---

## 1. Endpoint

```
POST /webhooks/pos/transactions
```

Catatan: path ini **tanpa** prefix `/api/v1`. Jadi URL lengkap:
`https://<host-crm>/webhooks/pos/transactions`.

### Header

| Header | Wajib | Keterangan |
|---|---|---|
| `Content-Type: application/json` | ✅ | |
| `X-Signature` | ✅ | `sha256=<hmac_hex>` — tanda tangan HMAC body (lihat §2) |
| `X-Idempotency-Key` | ➖ | Fallback `idempotency_key` jika tidak ada di body |
| `X-Event` | ➖ | Nama event, mis. `transaction.completed` (informasional) |

---

## 2. Tanda tangan HMAC (`X-Signature`)

CRM memverifikasi setiap request. Hitung HMAC-SHA256 atas **raw body persis seperti
yang dikirim** (byte mentah — jangan re-serialize / ubah spasi setelah tanda tangan):

```
signature = "sha256=" + HEX( HMAC_SHA256(CRM_WEBHOOK_SECRET, raw_request_body) )
```

Kirim hasilnya di header `X-Signature`. CRM membandingkan secara constant-time;
tidak cocok → **401**.

**Contoh (Node.js):**
```js
const crypto = require("crypto");
const body = JSON.stringify(payload);           // kirim string INI apa adanya
const sig = "sha256=" + crypto
  .createHmac("sha256", CRM_WEBHOOK_SECRET)
  .update(body, "utf8")
  .digest("hex");
// header: { "X-Signature": sig, "Content-Type": "application/json" }, body: body
```

**Contoh (PHP):**
```php
$body = json_encode($payload);
$sig  = "sha256=" . hash_hmac("sha256", $body, $CRM_WEBHOOK_SECRET);
```

Penting: HMAC dihitung dari **string body yang sama** yang dikirim sebagai request
body. Kalau body yang dikirim berbeda satu byte pun dari yang ditandatangani,
verifikasi gagal.

---

## 3. Body request

```jsonc
{
  "event": "transaction.completed",     // wajib; Fase 1 selalu nilai ini
  "event_id": "evt_01H...",             // opsional; unik per pengiriman (beda tiap retry)
  "occurred_at": "2026-06-15T03:21:00Z",// opsional; ISO-8601 UTC
  "idempotency_key": "ORD-2026-0001",   // wajib; stabil per-order (= order_id). Kunci dedup
  "store_id": "store-01",               // opsional
  "branch_id": "branch-jkt-01",         // opsional

  "customer": {
    "id": "MBR-1A2B3C4D5E",  // opsional; memberCode terbitan CRM yang di-echo POS. null = non-member
    "name": "Budi",          // opsional; "Pelanggan Umum" dianggap kosong
    "phone": "081234567890", // opsional; dipakai mencocokkan member jika id null
    "is_member": true,        // opsional
    "consent_saved": true     // opsional
  },

  "transaction": {
    "order_id": "ORD-2026-0001",   // wajib
    "order_number": "A-001",        // opsional
    "order_type": "dine_in",        // opsional: dine_in | take_away
    "status": "selesai",            // opsional
    "cashier_id": "csh-09",         // opsional
    "currency": "IDR",              // opsional; default IDR
    "subtotal": 50000,              // opsional (rupiah, integer)
    "discount_total": 0,            // opsional
    "tax_total": 5000,              // opsional
    "tax_inclusive": true,          // opsional; default true
    "grand_total": 55000,           // wajib; total dibayar — baseline earning poin
    "payment_method": "qris",       // opsional
    "points_used": 0,               // opsional; default 0
    "points_discount_rupiah": 0,    // opsional; default 0
    "items": [
      {
        "product_id": "prd-12",     // opsional
        "name": "Kopi Susu",        // wajib
        "qty": 2,                    // wajib
        "unit_price": 22000,         // wajib (rupiah, integer)
        "variant": "Large",          // opsional
        "addons": ["Extra shot"],   // opsional
        "notes": "less sugar",       // opsional
        "is_reward": false,          // opsional; default false
        "line_total": 44000          // wajib
      }
    ]
  }
}
```

Field di luar daftar ini diabaikan CRM (whitelist). Nilai uang dalam **rupiah utuh
(integer)**, bukan desimal.

---

## 4. Identitas customer (kontrak Opsi A)

CRM adalah pemilik `customer.id`. Nilainya = **`memberCode`** yang diterbitkan CRM.
Saat POS mengirim transaksi member, **echo balik** `memberCode` itu di `customer.id`.

Urutan pencocokan member oleh CRM:
1. `customer.id` → cari member dengan `memberCode` sama (utama).
2. Kalau `id` kosong → `customer.phone` (cadangan).
3. Kalau `id` **dan** `phone` kosong → **walk-in anonim**: transaksi tetap dicatat,
   tapi tanpa member & **0 poin**.

Kalau `phone` ada tapi belum terdaftar, CRM membuat member baru + menerbitkan
`memberCode` baru (dikembalikan di `customer_crm_id`).

---

## 5. Poin (informasional untuk POS)

CRM yang menghitung & menyimpan saldo poin (source of truth). Aturan Fase 1:

```
points_awarded = floor(grand_total / POIN_PER_RUPIAH)   // default POIN_PER_RUPIAH = 1000
```

Hanya untuk member; walk-in anonim = 0. POS boleh mengabaikan field poin di response
pada Fase 1.

---

## 6. Response

**200 OK** (sukses maupun duplikat):
```json
{
  "ok": true,
  "duplicate": false,
  "customer_crm_id": "clx123...",  // id member CRM, atau null untuk walk-in anonim
  "points_awarded": 55,
  "points_balance": 1230            // saldo terbaru, atau null
}
```

| Field | Arti |
|---|---|
| `ok` | Selalu `true` saat 2xx |
| `duplicate` | `true` jika event ini sudah pernah diproses (no-op) |
| `customer_crm_id` | ID internal member CRM, `null` jika tidak ada member |
| `points_awarded` | Poin yang diberikan untuk transaksi ini |
| `points_balance` | Saldo poin member setelah transaksi, atau `null` |

---

## 7. Idempotency & retry

- Dedup berdasarkan `idempotency_key` (= `order_id`). Pengiriman ulang dengan key
  yang sama **tidak** menggandakan transaksi/poin — CRM balas `200` dengan
  `duplicate: true`.
- Aman melakukan retry pada timeout atau error 5xx, **pakai `idempotency_key` yang
  sama**. `event_id` boleh berbeda tiap retry.
- Target pemrosesan CRM jauh di bawah ~10 detik.

---

## 8. Kode error

| Status | Sebab | Tindakan POS |
|---|---|---|
| `200` | Diterima (termasuk duplikat) | Selesai |
| `400` | Body tidak valid (mis. `grand_total`/`order_id` hilang, tipe salah) | Perbaiki payload; jangan retry tanpa perubahan |
| `401` | `X-Signature` hilang / tidak cocok | Cek secret & cara hitung HMAC |
| `5xx` | Error sementara CRM | Retry dengan `idempotency_key` sama (backoff) |

---

## 9. Contoh `curl`

```bash
BODY='{"event":"transaction.completed","idempotency_key":"ORD-2026-0001","customer":{"id":"MBR-1A2B3C4D5E"},"transaction":{"order_id":"ORD-2026-0001","grand_total":55000,"items":[{"name":"Kopi Susu","qty":2,"unit_price":22000,"line_total":44000}]}}'
SIG="sha256=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$CRM_WEBHOOK_SECRET" | awk '{print $2}')"

curl -X POST "https://<host-crm>/webhooks/pos/transactions" \
  -H "Content-Type: application/json" \
  -H "X-Signature: $SIG" \
  -H "X-Idempotency-Key: ORD-2026-0001" \
  --data "$BODY"
```

---

## 10. Referensi (internal CRM)

- Spesifikasi kontrak lengkap: `docs/integrasi-crm.md`
- Keputusan kepemilikan id customer: `docs/usulan-kepemilikan-id-customer.md`
- Swagger semua endpoint (internal): `https://<host-crm>/docs`
