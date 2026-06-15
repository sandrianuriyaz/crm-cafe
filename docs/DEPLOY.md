# Panduan Deploy — POLKS CRM

Arsitektur: **frontend (Next.js) → Vercel**, **backend (NestJS) → host server
(Railway/Render/Fly)**, **database → Supabase** (sudah ada). Keduanya aplikasi
terpisah yang berkomunikasi via HTTP API + Bearer token — beda platform itu normal.

---

## 1. Backend (NestJS) — Railway / Render via Docker

Sudah ada `backend/Dockerfile` (host-agnostic). Saat start, container otomatis
menjalankan `prisma migrate deploy` lalu `node dist/main`.

### Env yang WAJIB diset di host
| Var | Catatan |
|---|---|
| `DATABASE_URL` | Supabase pooler (pgbouncer, port 6543) — sama seperti `.env` lokal |
| `DIRECT_URL` | Supabase direct (port 5432) — dipakai migrasi |
| `JWT_SECRET` | ≥16 char, acak |
| `CRM_WEBHOOK_SECRET` | ≥16 char — **secret asli**, disepakati dgn tim POS (jangan dummy) |
| `CORS_ORIGIN` | Domain frontend Vercel, mis. `https://polks.vercel.app` |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_WHATSAPP_FROM` | OTP (opsional saat boot) |
| `PORT` | Biasanya diisi otomatis oleh host |
| `REDIS_URL` | Opsional — boleh dikosongkan (belum dipakai) |

### Railway
1. New Project → Deploy from GitHub repo → pilih folder `backend` (root directory = `backend`).
2. Railway deteksi `Dockerfile` otomatis.
3. Tab Variables → isi env di atas.
4. Deploy → dapat URL publik `https://<app>.up.railway.app`.

### Render
1. New → Web Service → connect repo, Root Directory = `backend`, Runtime = Docker.
2. Isi Environment Variables.
3. Create → dapat URL `https://<app>.onrender.com`.

> Pilih region terdekat ke Supabase (Tokyo / `ap-northeast-1`) untuk latency rendah.

### URL webhook untuk tim POS
Setelah deploy: `https://<host-backend>/webhooks/pos/transactions` (tanpa `/api/v1`).
Update juga base URL di `docs/POS-API.md`.

---

## 2. Frontend (Next.js) — Vercel

1. Import repo ke Vercel → Root Directory = `frontend`.
2. Environment Variable:
   - `NEXT_PUBLIC_API_URL` = `https://<host-backend>/api/v1`
3. Deploy. Setelah dapat domain Vercel, set domain itu ke `CORS_ORIGIN` backend.

---

## 3. Checklist sebelum integrasi POS
- [ ] Backend ter-deploy, `GET /api/v1/health` balas OK
- [ ] `CRM_WEBHOOK_SECRET` asli diset di host **dan** dibagikan ke POS via kanal aman
- [ ] `CORS_ORIGIN` = domain frontend
- [ ] `NEXT_PUBLIC_API_URL` frontend = URL backend
- [ ] Base URL di `docs/POS-API.md` diperbarui ke host backend
- [ ] (login customer asli) WhatsApp sender Twilio resmi — sandbox tidak cukup untuk publik

---

## 4. Migrasi DB
Otomatis saat container start (`prisma migrate deploy`). Manual bila perlu:
```
cd backend && npx prisma migrate deploy
```
Idempoten — hanya menerapkan migrasi yang belum ada.
