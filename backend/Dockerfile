# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-slim AS build
WORKDIR /app

# OpenSSL diperlukan Prisma engine.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

# Buang devDependencies untuk image runtime yang ramping.
RUN npm prune --omit=dev

# ── Runtime stage ────────────────────────────────────────────────────────────
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json

EXPOSE 3000

# Jalankan migrasi DB lalu start server. migrate deploy idempoten (aman diulang).
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
