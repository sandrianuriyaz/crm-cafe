# CRM Cafe — Design System (MASTER)

> Global Source of Truth. Page-specific overrides live in `design-system/pages/<page>.md`.
> If a page file exists, its rules override this file. Else use this file only.

**Project:** P1 - Web Apps CRM Cafe · **Stack:** Next.js + Tailwind CSS + shadcn/ui · **Owner:** Sandria (Lead Frontend & UI)

---

## 1. Brand & Surfaces

Cafe loyalty CRM. Warm, friendly, reward-focused. Two surfaces, one brand:

| Surface | Device | Style | Background |
|---|---|---|---|
| **Customer Web App** | Mobile-first | Bento Grid, rounded soft cards | Cream `#FEF3C7` |
| **Admin Dashboard** | Desktop/laptop | shadcn blocks + `<Table>` | White `#FFFFFF` / `#F5F5F7` |

---

## 2. Color Palette (POLKS Group — espresso + caramel + cream)

> Source of truth = the POLKS Group dashboard reference mockup (Material Design 3 style).

| Token | Hex | HSL | Use |
|---|---|---|---|
| Primary (espresso) | `#2B1712` | `12 41% 12%` | Wallet card, bottom nav, primary buttons |
| Secondary | `#855140` | `15 35% 39%` | Quick-action icons, links |
| CTA / Accent (caramel) | `#B86B2B` | `27 62% 45%` | FAB, status pills, redeem |
| Background (member) | `#FFF8F6` | `13 100% 98%` | App bg (warm cream) |
| Background (admin) | `#FFFFFF` | `0 0% 100%` | Admin shell |
| Surface / Card | `#FFFFFF` | `0 0% 100%` | Cards |
| Text | `#1E1B1A` | `15 7% 11%` | Body |
| Muted text | `#504442` | `9 10% 29%` | Secondary text (≥4.5:1) |
| Text on espresso | `#E3BEB6` | `11 45% 80%` | Labels inside dark cards (`cream-text`) |
| Border | `#E8E1DF` | `13 16% 89%` | Card/input borders |

**Status colors** (voucher / transaction badges):

| State | Hex | Use |
|---|---|---|
| Active / available | `#B86B2B` caramel (`bg-accent/10 text-accent` pill) | Deal active, reward available |
| Success / paid | `#16A34A` | Transaction paid |
| Error / used/cancelled | `#BA1A1A` | Voucher used/cancelled, failed |

> **Custom Tailwind colors** (exact brand hexes): `espresso #2B1712`, `caramel #B86B2B`, `cream-text #E3BEB6`. Shadcn semantic tokens are mapped to these in `globals.css`.

---

## 3. Typography

| Role | Font | Notes |
|---|---|---|
| Heading | **Manrope** (600/700) | Matches POLKS reference; headings via `font-heading` |
| Body | **Manrope** (400/500) | Single-family system, clean & modern |

- Body min **16px** on mobile (greeting `26px`, section title `18px`, card title `16px`, caption `12px`).
- Line-height **1.5–1.75** for body.
- Line length 65–75 chars max.

Google Fonts: `Manrope:wght@400;500;600;700` (loaded via `next/font` as `--font-manrope`).

---

## 4. Style Rules

### Customer App — Bento Grid
- Card radius **16–24px** (`--radius: 1rem`).
- Soft shadow; hover scale **1.02** (transform only, no layout shift).
- Varied card spans (1x1, 2x1, 2x2). Point balance = hero card.
- Cards: point balance, QR member, active promo, reward catalog, history.

### Admin — shadcn blocks
- Scaffold from blocks: `npx shadcn@latest add dashboard-01`, `login-01`.
- Tabular data = `<Table><TableHeader><TableBody><TableRow>` — never div-grid.
- Filters, search, status badges, modals for CRUD.

---

## 5. Effects & Motion

- Micro-interactions **150–300ms** ease.
- Transition `transform`/`opacity` only (not width/height).
- Respect `prefers-reduced-motion`.
- Hover feedback via color/shadow, never layout-shifting scale.

---

## 6. Anti-Patterns (AVOID)

- ❌ Emoji as icons → use **Lucide** SVG icons.
- ❌ `bg-white/10` glass on cream → invisible. Use solid `#FFFFFF` cards.
- ❌ CTA same color as background.
- ❌ Scale-hover that shifts layout.
- ❌ Div grids for tables (admin).
- ❌ Body text lighter than `#9A6B4A` on cream (fails contrast).

---

## 7. Pre-Delivery Checklist

- [ ] No emojis as icons (Lucide SVG only)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states smooth (150–300ms)
- [ ] Text contrast ≥ 4.5:1 (both surfaces)
- [ ] Focus rings visible (keyboard nav)
- [ ] `prefers-reduced-motion` respected
- [ ] All images have alt text
- [ ] Form inputs have `<label htmlFor>`
- [ ] Responsive: 375 / 768 / 1024 / 1440px
- [ ] No horizontal scroll on mobile
- [ ] Voucher/transaction status uses badge + color (color not sole indicator)

---

## 8. shadcn Theme Tokens

See `frontend/app/globals.css`. Member surface = cream bg; wrap admin in `.admin` for white bg.

```css
:root {
  --background: 48 96% 89%;   /* cream */
  --foreground: 22 78% 26%;
  --card: 0 0% 100%;
  --card-foreground: 22 78% 26%;
  --primary: 25 84% 31%;
  --primary-foreground: 48 96% 96%;
  --secondary: 32 81% 36%;
  --secondary-foreground: 0 0% 100%;
  --accent: 45 93% 33%;
  --accent-foreground: 0 0% 100%;
  --muted: 48 60% 92%;
  --muted-foreground: 22 40% 40%;
  --destructive: 0 72% 51%;
  --destructive-foreground: 0 0% 100%;
  --border: 32 30% 82%;
  --input: 32 30% 82%;
  --ring: 45 93% 33%;
  --radius: 1rem;
}
.admin { --background: 0 0% 100%; }
```
