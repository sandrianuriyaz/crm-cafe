# Admin Sidebar Redesign

**Tanggal:** 2026-06-26
**Konteks:** Revisi mentor — sidebar terlalu banyak item, idempotency jangan ditampilkan

---

## Masalah

Sidebar admin saat ini punya 15 item flat. Terlalu panjang, sulit di-scan, dan ada item Idempotency yang tidak perlu ditampilkan ke admin.

---

## Solusi

Kelompokkan item ke accordion group. Multiple grup bisa terbuka bersamaan. Settings dipisah sebagai standalone di bawah.

---

## Struktur Sidebar Final

```
Overview                          ← standalone

▾ Manajemen                       ← accordion group
    Members
    Group
    Outlets

▾ Loyalty                         ← accordion group
    Promotions
    Rewards
    Vouchers
    Loyalty Config

▾ Aktivitas                       ← accordion group
    POS Transactions
    Redeem History

▾ Sistem                          ← accordion group
    Broadcast
    POS Sync
    Webhook Inbox

─────────────────────────────────
Settings                          ← standalone, di atas Logout
Logout
```

**Dihapus:** Idempotency (tidak ditampilkan di sidebar)

---

## Behavior

### Accordion
- Klik label grup → toggle expand/collapse
- Multiple grup bisa terbuka bersamaan (tidak auto-close yang lain)
- Chevron `▸` (collapsed) / `▾` (expanded), animasi smooth rotate 180deg

### Auto-expand
- Saat halaman dimuat, grup yang berisi route aktif otomatis expand
- Derive dari `pathname` — tidak perlu simpan state ke localStorage
- Contoh: `/admin/members` → grup Manajemen otomatis terbuka

### Item aktif
- Highlight item sub-menu yang aktif (sama seperti sekarang)
- Grup label tidak bisa diklik sebagai navigasi, hanya sebagai toggle

---

## Visual Treatment

| Elemen | Style |
|---|---|
| Label grup | `text-[9px] font-bold uppercase tracking-[0.1em] text-white/30` |
| Chevron | `size-3 text-white/30`, rotate 180deg saat expanded |
| Sub-item | Sama seperti nav item sekarang + `pl-5` untuk indentasi |
| Separator sebelum Settings | `border-t border-white/[0.07]` (sudah ada di logout) |
| Settings | Tampil di dalam area `flex-shrink-0` di bawah, sebelum Logout |

---

## File yang Diubah

- `frontend/src/components/layout/admin-shell.tsx` — satu-satunya file yang perlu diubah

---

## Yang Tidak Berubah

- Route/URL semua halaman tidak berubah
- Tampilan topbar, avatar, search, bell tidak berubah
- Style warna, font, border tidak berubah
- Mobile drawer behavior tidak berubah
