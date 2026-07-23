# Brief untuk Tim CRM Cafe — Kirim `minSpend` di Respons Validate Voucher

## 1. Konteks & akar masalah

Kalian melaporkan bug: **reward diskon dengan syarat minimal belanja tetap bisa dipakai walaupun total belanja di bawah minimal.**

Akarnya bukan di logika reward kalian, tapi di **bentuk percakapan POS ↔ CRM saat ini**:

- POS memanggil validate hanya dengan kode voucher.
- CRM menjawab pada intinya: *"kode ini ada, statusnya ACTIVE, belum dipakai."*
- **CRM tidak pernah menerima isi keranjang**, jadi CRM secara struktural tidak mungkin tahu apakah syarat minimal belanja terpenuhi.
- POS juga tidak tahu ada syarat minimal, karena CRM tidak pernah mengirimkannya.

Hasilnya: syarat minimal belanja tersimpan di CRM tapi tidak pernah ditegakkan oleh siapa pun.

**Keputusan desain (sudah final):** CRM **mengirim syaratnya**, POS **menegakkan**. POS tidak akan mengirim subtotal keranjang ke CRM.

---

## 2. Yang kami minta

Tambahkan field **`minSpend`** di dalam objek `reward` pada respons endpoint POS-facing:

```
GET /pos/vouchers/:code
```

Spesifikasi field:

| Aspek | Nilai |
|---|---|
| Nama field | `minSpend` |
| Lokasi | di dalam objek `reward` |
| Tipe | angka (integer) |
| Satuan | **Rupiah penuh**, bukan sen, bukan ribuan. Minimal belanja Rp100.000 → `100000` |
| Reward tanpa syarat | `0` atau `null` (dua-duanya diterima), atau field-nya tidak usah dikirim sama sekali |

> **Catatan bentuk respons:** contoh di bawah adalah yang **CRM kembalikan** — objek voucher polos.
> Pembungkus `{ok, found, voucher}` yang mungkin kalian lihat di sisi kami itu ditambahkan oleh
> edge function POS, bukan sesuatu yang perlu kalian buat.

### Contoh respons — SEBELUM (sekarang)

```json
{
  "code": "RWD-8F3K2A",
  "status": "ACTIVE",
  "reward": {
    "name": "Diskon 20 Ribu",
    "description": "Potongan langsung untuk member Gold",
    "type": "DISCOUNT_AMOUNT",
    "value": 20000,
    "freeItemName": null
  },
  "member": {
    "name": "Budi Santoso",
    "memberCode": "MBR-00142"
  }
}
```

### Contoh respons — SESUDAH (yang kami harapkan)

```json
{
  "code": "RWD-8F3K2A",
  "status": "ACTIVE",
  "reward": {
    "name": "Diskon 20 Ribu",
    "description": "Potongan langsung untuk member Gold",
    "type": "DISCOUNT_AMOUNT",
    "value": 20000,
    "freeItemName": null,
    "minSpend": 100000
  },
  "member": {
    "name": "Budi Santoso",
    "memberCode": "MBR-00142"
  }
}
```

Untuk reward tanpa syarat minimal:

```json
"reward": {
  "name": "Gratis Es Teh",
  "type": "FREE_ITEM",
  "value": null,
  "freeItemName": "Es Teh Manis",
  "minSpend": 0
}
```

Itu saja perubahan yang dibutuhkan di sisi kalian. Tidak ada perubahan kontrak lain, tidak ada field yang dihapus atau diganti nama.

---

## 3. Kenapa POS yang menegakkan, bukan CRM

Bukan karena tidak percaya CRM — tapi karena **keranjang masih bisa berubah setelah voucher discan.**

Skenario nyata di kasir:

1. Keranjang Rp150.000. Kasir scan voucher "min belanja Rp100.000". Syarat terpenuhi.
2. Pelanggan batal pesan satu menu. Kasir hapus item. Keranjang tinggal Rp60.000.
3. Voucher masih terpasang, diskon tetap jalan.

Kalau pengecekan hanya dilakukan sekali di CRM saat validate, langkah 2–3 tetap lolos. Lubangnya tidak tertutup. Hanya POS yang melihat keranjang, jadi hanya POS yang bisa menutupnya.

Implementasi di POS mengecek di **dua titik**:

1. **Saat voucher dipasang** — kalau belum memenuhi, tombol "Terapkan" tidak muncul; kasir diberi tahu kurang berapa.
2. **Tepat sebelum pembayaran** — kalau keranjang berubah sampai di bawah minimal, muncul dialog: *lepas voucher & lanjut*, atau *batal* untuk menambah belanja.

Titik kedua itu yang menutup skenario di atas. Kami sengaja **tidak** memantau keranjang terus-menerus dan melepas voucher otomatis: keranjang berubah sepanjang transaksi, dan memuat nota tersimpan mengisi item satu per satu — pemantau jadi bereaksi pada keadaan setengah jadi dan melepas voucher yang sebenarnya memenuhi syarat. Titik bayar adalah satu-satunya saat keranjang benar-benar final.

Satu hal yang perlu kalian tahu: kalau kasir memilih *lepas voucher & lanjut*, POS **tidak akan memanggil redeem** untuk voucher itu. Jadi vouchernya tetap `ACTIVE` di sisi kalian dan masih bisa dipakai pelanggan lain kali — itu memang disengaja.

---

## 4. PERINGATAN PENTING — jangan hard reject di endpoint redeem

```
POST /pos/vouchers/:code/redeem
```

**Jangan menambahkan penolakan (hard reject) berbasis minimal belanja di endpoint ini.**

Alasannya kritis: **POS memanggil endpoint redeem SETELAH transaksi di-commit.** Uang sudah diterima, struk sudah dicetak, diskon sudah diberikan. Kalau CRM menolak di titik itu, yang terjadi:

- Penjualan **tetap terjadi** dengan diskon yang sudah diberikan — POS tidak punya apa pun lagi untuk dibatalkan.
- Voucher **tetap berstatus ACTIVE** di CRM karena redeem gagal.
- Voucher yang sama **bisa dipakai lagi** di transaksi berikutnya.

Artinya: menolak di redeem justru **lebih buruk daripada bug yang sekarang** — dari "diskon tidak semestinya, sekali" jadi "diskon tidak semestinya, berulang kali".

Kalau kalian ingin punya jejak untuk kasus tidak wajar, silakan **catat sebagai audit log / flag** (misal `flag: "MIN_SPEND_NOT_VERIFIED"`), lalu **tetap kembalikan sukses dan tetap tandai voucher sebagai USED**. Catat, jangan tolak.

---

## 5. Soal nama field

Nama yang **disepakati** dan yang harus kalian kirim:

```
voucher.reward.minSpend
```

POS juga menerima tiga variasi ejaan dari frasa yang sama sebagai jaring pengaman — `min_spend`, `minimumSpend`, `minimum_spend` — tapi **hanya di dalam objek `reward`**, bukan di root voucher.

Dua hal yang **sengaja TIDAK** diterima, supaya kalian tidak salah kira:

- **`minPurchase` / `minimalBelanja`** — frasanya ambigu, bisa berarti "minimal jumlah item". Kalau POS salah menafsirkannya sebagai rupiah, syaratnya meleset jauh dan voucher jadi terblokir di kasir tanpa jalan keluar.
- **Field di root `voucher`** — nilai bernama mirip di root berpeluang milik program/tier membership, bukan syarat voucher ini.

Nilai yang bukan angka atau negatif diperlakukan POS sebagai **tidak ada syarat minimal** (voucher tetap jalan — kami memilih tidak memblokir), tapi kalau field-nya ada dan gagal dibaca, POS mencatat peringatan ke log. Jadi kalau kalian mengirim bentuk seperti `{"amount": 100000, "currency": "IDR"}`, syaratnya **tidak akan berlaku** — kirim angka polos: `100000`.

---

## 6. Backward-compatible — kalian bisa rilis kapan pun

Perubahan di sisi POS sudah dibuat **siap menerima `minSpend` lebih dulu**, sebelum kalian mengirimnya.

- Kalau `minSpend` **tidak ada / null / 0** → perilaku POS **persis sama seperti sekarang**. Tidak ada voucher yang rusak, tidak ada regresi.
- Kalau `minSpend` **ada dan > 0** → POS langsung mulai menegakkan syaratnya, plus menampilkan syarat itu di kartu voucher supaya kasir tahu sebelum menekan "Pakai".

Konsekuensinya: **tidak ada koordinasi rilis yang diperlukan.** Tidak perlu deploy barengan, tidak perlu feature flag. Begitu kalian mengirim `minSpend`, fiturnya aktif dengan sendirinya. Sebelum itu, semuanya jalan seperti biasa.

---

## Ringkasan yang perlu dikerjakan tim CRM

1. Tambahkan `minSpend` (integer rupiah, `0`/`null` = tanpa syarat) di dalam `reward` pada respons `GET /pos/vouchers/:code`.
2. **Jangan** menambah penolakan minimal belanja di `POST /pos/vouchers/:code/redeem` — kalau perlu, catat sebagai audit saja.
3. Tidak ada perubahan lain. Rilis kapan saja.