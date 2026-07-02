# UI Redesign — Material 3 Theme (POLKS GROUP CRM)

**Date:** 2026-06-11
**Owner:** Sandria (Frontend)
**Status:** Approved design, pending spec review

## Goal

Replace the current POLKS brown/cocoa loyalty UI with a new Material 3 design
system (blue primary, navy + gold accents, Inter font) across the whole
frontend — customer and admin. Source of truth is 11 HTML mockups provided by
the user.

## Scope

In scope:
- All customer pages (light mode).
- All admin pages (light mode).
- New global design token layer (Tailwind config + globals.css).
- New layout shells (customer + admin).
- New/restyled shared UI components.

Out of scope:
- Dark mode (tokens prepared, no toggle wired).
- Backend / API changes.
- Switching icon library — keep `lucide-react`, map Material Symbols names to
  lucide equivalents.

## Design Decisions (confirmed)

| Decision | Choice |
|---|---|
| Redesign breadth | All pages, global design-system swap |
| Icons | Keep lucide-react, map Material Symbols → lucide |
| Mockups | Full set provided (11 pages); pages without a mockup get extrapolated |
| Admin routing | Under `/admin/*` |
| Dark mode | Light only first; dark tokens defined but no toggle |

## Approach

**Token-swap + shell rebuild.** Replace `polks-*` tokens with the M3 token set,
load Inter via `next/font`, build two layout shells, then rebuild each page
against the new tokens. Reuse existing API wiring (auth, login/register). Delete
dead `src/components/member/*` components superseded by the new components.

Rejected: parallel two-token-system (CSS bloat, slow migration); full rewrite
(loses working API wiring).

## Architecture

### 1. Token layer
- `tailwind.config.ts`: replace `polks-*` colors with M3 tokens from the mockups
  (primary `#0037b0`, primary-container `#1d4ed8`, surface/on-surface family,
  outline-variant, plus `deep-navy #0F172A`, `gold #F5B82E`, `soft-gold #FFF3C4`).
  Add the mockup spacing scale (`xs/sm/base/md/lg/gutter/xl`), radius
  (`lg/xl/2xl/3xl/full`), and named fontSize tokens (`app-name`, `page-title`,
  `section-title`, `card-title`, `body`, `body-semibold`, `caption`, `label-xs`).
- `globals.css`: set `background`/`on-background` body defaults; define the
  `.ds-input` focus-ring helper from the mockups.
- Inter loaded via `next/font/google` in `app/layout.tsx`.

### 2. Icon layer — `src/components/ui/icon.tsx`
Single map from Material Symbols name → lucide component, e.g.
`coffee_maker→Coffee`, `qr_code_2→QrCode`, `account_balance_wallet→Wallet`,
`stars→Star`, `receipt_long→ReceiptText`, `campaign→Megaphone`,
`content_copy→Copy`, `card_membership→IdCard`. One table, easy to audit.
Material Symbols "fill" state → lucide filled/solid variant where needed.

### 3. Layout shells — `src/components/layout/`
- `CustomerShell` — desktop left nav-drawer (navy `on-secondary-fixed`) +
  mobile sticky top-app-bar + floating pill bottom-nav. Nav items: Home, Wallet,
  Rewards, Profile. Active state = `border-l-4 border-primary-fixed bg-primary/20`.
- `AdminShell` — left sidebar (Dashboard, Members, Transactions, Campaigns,
  Analytics, Settings) + top-app-bar with avatar.

### 4. Shared UI — `src/components/ui/`
Restyle existing `Button`, `Card`, `Badge` to M3. Add: `Input` (with `.ds-input`
focus ring + leading icon), `Chip` (category pills), `StatCard` (admin bento
stat), `WalletCard` (navy + gold balance card), `PromoCard`, `RewardCard`,
`DataTable` (admin tables with filters + pagination).

### 5. Pages → routes

| Mockup | Route | Existing? |
|---|---|---|
| Login | `/login` | restyle |
| Guest Home | `/` | restyle |
| Member Dashboard | `/dashboard` | restyle |
| Rewards Catalog | `/rewards` | restyle |
| Member Card QR | `/member-card` | restyle |
| Transaction History | `/history` | new |
| Admin Login | `/admin/login` | new |
| Admin Dashboard | `/admin` | new |
| POS Transactions | `/admin/transactions` | new |
| Member Management | `/admin/members` | new |
| Loyalty Config | `/admin/config` | new |

Pages without a mockup — `register`, `verify`, `verify-account`,
`voucher-success` — are restyled with the same tokens and component patterns for
consistency.

## Work Order
1. Token layer + Inter font.
2. Icon map.
3. Layout shells (Customer, Admin).
4. Shared UI components.
5. Customer pages (login, guest home, dashboard, rewards, member-card, history).
6. Admin pages (login, dashboard, transactions, members, config).
7. Remaining customer pages (register, verify, verify-account, voucher-success).

## Verification
- `npm run build` clean (no TS / lint errors) after each phase.
- `npm run dev` (port 3001): visual check each page vs its mockup, mobile +
  desktop breakpoints.
- No `polks-*` token references remain (grep).
- No broken icon references (every Material Symbols name mapped).

## Risks
- Token rename touches every page at once → migrate behind the new shells, build
  after each phase to catch breakage early.
- Mockups use the Tailwind CDN config; production uses `tailwind.config.ts` — the
  token values must be transcribed exactly, not approximated.
- Existing API wiring in `login`/`register`/`auth.tsx` must be preserved during
  restyle (markup changes, logic stays).
