# UI Redesign — Material 3 Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the POLKS brown/cocoa loyalty UI with a Material 3 design system (blue primary, navy + gold accents, Inter font) across all customer and admin pages.

**Architecture:** Token-swap + shell rebuild. Replace `polks-*` Tailwind tokens with the M3 token set, load Inter via `next/font`, build two layout shells (Customer + Admin), then rebuild each page against the new tokens. Existing API wiring (auth/api thin client) is preserved — only markup changes. Icons stay on `lucide-react` via a Material-Symbols→lucide name map.

**Tech Stack:** Next.js 14 (App Router), Tailwind CSS v3, lucide-react, next/font (Inter), TypeScript.

**Spec:** `docs/superpowers/specs/2026-06-11-ui-redesign-m3-design.md`
**Mockups (source of truth for markup):** `docs/superpowers/mockups/01-login.html` … `11-admin-loyalty-config.html`

---

## Conventions for this plan

- **No unit tests for visual pages.** This is pixel/layout work; unit tests don't add value. Per-task verification gate is: `npx tsc --noEmit` clean + `npm run build` clean + visual check vs the named mockup file at `npm run dev` (port 3001), mobile (≤640px) + desktop.
- **Mockup = markup source.** Each page task ports the exact markup from its mockup file. Read the mockup file, translate HTML→JSX (`class`→`className`, `for`→`htmlFor`, self-close tags, replace `<span class="material-symbols-outlined">name</span>` with the mapped lucide `<Icon>`), wire data/handlers, keep Tailwind classes verbatim (the new tokens make them resolve).
- **Preserve API wiring.** `src/lib/api.ts`, `src/lib/auth.tsx` are NOT changed. Pages using them (`login`, `register`) keep their hooks/handlers; only presentational markup is swapped.
- **Commit after every task.** All work on branch `development` (already checked out).
- All commands run from `frontend/`.

---

## File Structure

Created:
- `src/lib/fonts.ts` — Inter via next/font
- `src/components/ui/icon.tsx` — Material-Symbols→lucide map + `<Icon name="...">`
- `src/components/ui/input.tsx` — M3 text input with leading icon + `.ds-input` focus ring
- `src/components/ui/chip.tsx` — category pill
- `src/components/ui/stat-card.tsx` — admin bento stat
- `src/components/ui/data-table.tsx` — admin table primitives
- `src/components/layout/customer-shell.tsx` — desktop drawer + mobile top bar + bottom nav
- `src/components/layout/customer-bottom-nav.tsx`
- `src/components/layout/customer-drawer.tsx`
- `src/components/layout/admin-shell.tsx` — sidebar + topbar
- `src/components/customer/wallet-card.tsx`, `promo-card.tsx`, `reward-card.tsx`
- `src/app/history/page.tsx`
- `src/app/admin/login/page.tsx`, `src/app/admin/page.tsx`, `src/app/admin/transactions/page.tsx`, `src/app/admin/members/page.tsx`, `src/app/admin/config/page.tsx`

Modified:
- `tailwind.config.ts` — token swap
- `src/app/globals.css` — body defaults + `.ds-input`
- `src/app/layout.tsx` — Inter font class
- `src/app/page.tsx` (guest home), `login/page.tsx`, `register/page.tsx`, `dashboard/page.tsx`, `rewards/page.tsx`, `member-card/page.tsx`, `verify/page.tsx`, `verify-account/page.tsx`, `voucher-success/page.tsx`
- `src/lib/loyalty/mock-data.ts` — add fields the new mockups need (tier, transactions, admin stats)

Deleted (superseded, dead after migration):
- `src/components/member/*` (bottom-nav, offer-thumbnail, quick-actions, top-app-bar, wallet-card)
- `src/components/loyalty/bottom-nav.tsx`, `customer-mobile-shell.tsx`, `admin-layout.tsx` (replaced by `layout/*`)
- `src/components/auth/auth-ui.tsx` (replaced by `ui/input.tsx` + inline shells) — only after login/register migrated

---

## Phase 1 — Token layer + font

### Task 1: Swap Tailwind tokens

**Files:**
- Modify: `frontend/tailwind.config.ts`

- [ ] **Step 1: Replace the `theme.extend` color/spacing/radius/font tokens** with the M3 set. Copy exact hex values from `docs/superpowers/mockups/03-member-dashboard.html` (its config is the superset — includes `deep-navy`, `gold`, `soft-gold`). Keep `content`, `darkMode: "class"`, and `plugins` (`tailwindcss-animate`) as-is.

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "on-tertiary-container": "#d3d1ff",
        "surface-container-low": "#f3f2fe",
        "on-tertiary-fixed": "#0f0069",
        "on-primary-fixed": "#001551",
        "error-container": "#ffdad6",
        "surface-container": "#ededf9",
        "on-secondary-fixed": "#131b2e",
        outline: "#747686",
        "surface-container-highest": "#e2e1ed",
        "on-background": "#1a1b23",
        "on-surface": "#1a1b23",
        "inverse-on-surface": "#f0f0fb",
        "tertiary-container": "#4b41e1",
        "outline-variant": "#c4c5d7",
        "surface-bright": "#faf8ff",
        "primary-container": "#1d4ed8",
        "tertiary-fixed": "#e2dfff",
        surface: "#faf8ff",
        "on-secondary-fixed-variant": "#3f465c",
        "secondary-fixed": "#dae2fd",
        "surface-container-high": "#e8e7f3",
        "on-secondary": "#ffffff",
        "on-tertiary": "#ffffff",
        "surface-dim": "#d9d9e5",
        "inverse-primary": "#b7c4ff",
        error: "#ba1a1a",
        "on-secondary-container": "#5c647a",
        "secondary-container": "#dae2fd",
        "on-surface-variant": "#434655",
        "surface-tint": "#2151da",
        "surface-variant": "#e2e1ed",
        "on-primary-container": "#cad3ff",
        primary: "#0037b0",
        "primary-fixed": "#dce1ff",
        "inverse-surface": "#2e3039",
        tertiary: "#311fca",
        "surface-container-lowest": "#ffffff",
        "on-tertiary-fixed-variant": "#3323cc",
        "secondary-fixed-dim": "#bec6e0",
        "on-error-container": "#93000a",
        background: "#faf8ff",
        "tertiary-fixed-dim": "#c3c0ff",
        secondary: "#565e74",
        "on-primary": "#ffffff",
        "on-error": "#ffffff",
        "on-primary-fixed-variant": "#0039b5",
        "primary-fixed-dim": "#b7c4ff",
        "deep-navy": "#0F172A",
        gold: "#F5B82E",
        "soft-gold": "#FFF3C4",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        full: "9999px",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        base: "8px",
        md: "16px",
        "margin-mobile": "16px",
        lg: "24px",
        gutter: "24px",
        xl: "32px",
        "margin-desktop": "32px",
      },
      fontFamily: {
        "app-name": ["var(--font-inter)", "Inter", "sans-serif"],
        body: ["var(--font-inter)", "Inter", "sans-serif"],
        "card-title": ["var(--font-inter)", "Inter", "sans-serif"],
        "label-xs": ["var(--font-inter)", "Inter", "sans-serif"],
        "page-title": ["var(--font-inter)", "Inter", "sans-serif"],
        caption: ["var(--font-inter)", "Inter", "sans-serif"],
        "section-title": ["var(--font-inter)", "Inter", "sans-serif"],
        "body-semibold": ["var(--font-inter)", "Inter", "sans-serif"],
      },
      fontSize: {
        "app-name": ["18px", { lineHeight: "24px", letterSpacing: "-0.01em", fontWeight: "600" }],
        body: ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "card-title": ["16px", { lineHeight: "24px", fontWeight: "600" }],
        "label-xs": ["11px", { lineHeight: "12px", fontWeight: "700" }],
        "page-title": ["24px", { lineHeight: "32px", letterSpacing: "-0.02em", fontWeight: "700" }],
        caption: ["12px", { lineHeight: "16px", letterSpacing: "0.01em", fontWeight: "500" }],
        "section-title": ["18px", { lineHeight: "24px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "body-semibold": ["14px", { lineHeight: "20px", fontWeight: "600" }],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

- [ ] **Step 2: Verify config compiles.** Run: `npx tsc --noEmit`. Expected: PASS (existing pages still reference `polks-*` classes — they will error at build, that's fine until Phase 2+; tsc only checks types, not Tailwind classnames, so it passes).
- [ ] **Step 3: Commit.**

```bash
git add frontend/tailwind.config.ts
git commit -m "feat(ui): swap Tailwind tokens to Material 3 design system"
```

### Task 2: Load Inter font + globals

**Files:**
- Create: `frontend/src/lib/fonts.ts`
- Modify: `frontend/src/app/layout.tsx`, `frontend/src/app/globals.css`

- [ ] **Step 1: Create the font module.**

```ts
// src/lib/fonts.ts
import { Inter } from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});
```

- [ ] **Step 2: Apply the font variable on `<html>` in `layout.tsx`.** Add `className={inter.variable}` to the `<html>` tag and `font-body` to `<body>`. Keep the existing `<AuthProvider>` wrapper and metadata.

```tsx
// src/app/layout.tsx — relevant changes
import { inter } from "@/lib/fonts";
// ...
return (
  <html lang="id" className={inter.variable}>
    <body className="font-body bg-background text-on-background antialiased">
      <AuthProvider>{children}</AuthProvider>
    </body>
  </html>
);
```

- [ ] **Step 3: Reset `globals.css`** to the M3 base. Replace the existing body/`polks` rules. Keep the Tailwind directives.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: theme("colors.background");
  color: theme("colors.on-background");
}

/* Design-system input focus ring (from mockups) */
.ds-input:focus {
  outline: none;
  border-color: #1d4ed8;
  box-shadow: 0 0 0 2px #dbeafe;
}
```

- [ ] **Step 4: Verify.** Run: `npx tsc --noEmit`. Expected: PASS.
- [ ] **Step 5: Commit.**

```bash
git add frontend/src/lib/fonts.ts frontend/src/app/layout.tsx frontend/src/app/globals.css
git commit -m "feat(ui): load Inter font and M3 globals base"
```

---

## Phase 2 — Icon map

### Task 3: Material-Symbols→lucide Icon component

**Files:**
- Create: `frontend/src/components/ui/icon.tsx`

The mockups reference these Material Symbols names. Map each to a lucide-react component. Audit the full set by grepping the mockups: `grep -rho 'material-symbols-outlined[^>]*>[a-z_]*' docs/superpowers/mockups | sed 's/.*>//' | sort -u`.

- [ ] **Step 1: Create the icon map** covering all names found. Starter map (extend with any name the grep surfaces):

```tsx
// src/components/ui/icon.tsx
import {
  ArrowLeft, ArrowRight, Wallet, Star, Gift, Home, User, Menu, Bell,
  CreditCard, History, Copy, QrCode, ScanLine, Coffee, MapPin, Lock, Eye,
  EyeOff, LogIn, LayoutDashboard, Users, ReceiptText, Megaphone, BarChart3,
  Settings, CardSim, Search, Filter, ChevronLeft, ChevronRight, Check,
  Plus, Pencil, Trash2, CircleDollarSign, Tag, BadgeCheck, RefreshCw,
  CalendarDays, type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  arrow_back: ArrowLeft,
  arrow_forward: ArrowRight,
  account_balance_wallet: Wallet,
  stars: Star,
  card_giftcard: Gift,
  home: Home,
  person: User,
  menu: Menu,
  notifications: Bell,
  credit_card: CreditCard,
  history: History,
  content_copy: Copy,
  qr_code: QrCode,
  qr_code_2: QrCode,
  qr_code_scanner: ScanLine,
  coffee_maker: Coffee,
  location_on: MapPin,
  lock: Lock,
  visibility: Eye,
  visibility_off: EyeOff,
  login: LogIn,
  dashboard: LayoutDashboard,
  group: Users,
  receipt_long: ReceiptText,
  campaign: Megaphone,
  analytics: BarChart3,
  settings: Settings,
  card_membership: CardSim,
  search: Search,
  filter_list: Filter,
  chevron_left: ChevronLeft,
  chevron_right: ChevronRight,
  check: Check,
  add: Plus,
  edit: Pencil,
  delete: Trash2,
  paid: CircleDollarSign,
  sell: Tag,
  verified: BadgeCheck,
  refresh: RefreshCw,
  calendar_month: CalendarDays,
};

export function Icon({
  name,
  className,
  fill = false,
  ...props
}: { name: string; className?: string; fill?: boolean } & React.SVGProps<SVGSVGElement>) {
  const Cmp = MAP[name];
  if (!Cmp) {
    if (process.env.NODE_ENV !== "production") console.warn(`Icon: unmapped "${name}"`);
    return null;
  }
  return <Cmp className={className} {...(fill ? { fill: "currentColor" } : {})} {...props} />;
}
```

- [ ] **Step 2: Verify map covers every mockup name.** Run the grep above; for any name printed that is NOT a key in `MAP`, add a lucide mapping. Re-run until the diff is empty.
- [ ] **Step 3: Verify.** Run: `npx tsc --noEmit`. Expected: PASS.
- [ ] **Step 4: Commit.**

```bash
git add frontend/src/components/ui/icon.tsx
git commit -m "feat(ui): add Material Symbols to lucide icon map"
```

---

## Phase 3 — Shared UI primitives

### Task 4: Restyle Button / Card / Badge + add Input, Chip

**Files:**
- Modify: `frontend/src/components/ui/button.tsx`, `card.tsx`, `badge.tsx`
- Create: `frontend/src/components/ui/input.tsx`, `frontend/src/components/ui/chip.tsx`

- [ ] **Step 1: Update `button.tsx` cva variants** to M3 tokens: `default` = `bg-primary-container text-on-primary rounded-lg font-body-semibold shadow-sm hover:bg-primary-container/90 active:scale-[0.98]`; `outline` = `border border-outline-variant/50 bg-surface-container-lowest text-on-surface`; `ghost` = `text-primary hover:bg-surface-container-low`. Default size `h-12 px-4`. Keep the `asChild`/Slot API.
- [ ] **Step 2: Update `card.tsx`** base to `bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden`.
- [ ] **Step 3: Update `badge.tsx`** variants to M3 (`bg-surface-container-high text-on-surface`, plus `success`/`warning`/`error` using `error`/`secondary-container` tokens).
- [ ] **Step 4: Create `input.tsx`** — label + relative wrapper + optional leading `Icon` + `.ds-input` class, matching the login mockup (`docs/superpowers/mockups/01-login.html`, lines ~164–183).

```tsx
// src/components/ui/input.tsx
import * as React from "react";
import { Icon } from "./icon";
import { cn } from "@/lib/utils";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  iconName?: string;
  trailing?: React.ReactNode;
  action?: React.ReactNode;
};

export const Input = React.forwardRef<HTMLInputElement, Props>(
  ({ label, iconName, trailing, action, id, className, ...props }, ref) => (
    <div className="flex flex-col gap-xs">
      {(label || action) && (
        <div className="flex items-center justify-between">
          {label && (
            <label htmlFor={id} className="font-body-semibold text-body-semibold text-on-surface">
              {label}
            </label>
          )}
          {action}
        </div>
      )}
      <div className="relative">
        {iconName && (
          <Icon name={iconName} className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-outline" />
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "ds-input h-12 w-full rounded-lg border border-outline-variant/50 bg-surface-container-lowest font-body text-body text-on-surface placeholder:text-outline transition-all",
            iconName ? "pl-10" : "pl-3",
            trailing ? "pr-10" : "pr-3",
            className,
          )}
          {...props}
        />
        {trailing && <div className="absolute right-3 top-1/2 -translate-y-1/2">{trailing}</div>}
      </div>
    </div>
  ),
);
Input.displayName = "Input";
```

- [ ] **Step 5: Create `chip.tsx`** — category pill matching rewards mockup (`docs/superpowers/mockups/04-rewards-catalog.html`, "Category Chips" section). Active = `bg-primary text-on-primary`; idle = `bg-surface-container text-on-surface-variant`. Props: `active?: boolean`, `children`, `onClick`.
- [ ] **Step 6: Verify.** Run: `npx tsc --noEmit`. Expected: PASS.
- [ ] **Step 7: Commit.**

```bash
git add frontend/src/components/ui/button.tsx frontend/src/components/ui/card.tsx frontend/src/components/ui/badge.tsx frontend/src/components/ui/input.tsx frontend/src/components/ui/chip.tsx
git commit -m "feat(ui): M3 button/card/badge + input + chip primitives"
```

---

## Phase 4 — Layout shells

### Task 5: CustomerShell (drawer + top bar + bottom nav)

**Files:**
- Create: `frontend/src/components/layout/customer-shell.tsx`, `customer-drawer.tsx`, `customer-bottom-nav.tsx`

Reference markup: desktop drawer + mobile top bar + floating pill bottom-nav from `docs/superpowers/mockups/02-guest-home.html` (NavigationDrawer / TopAppBar / BottomNavBar sections) and the authenticated variant in `03-member-dashboard.html`.

- [ ] **Step 1: Create `customer-bottom-nav.tsx`** — client component, floating pill, items Home/Wallet/Rewards/Profile with routes `/dashboard`, `/member-card`, `/rewards`, `/profile`. Use `usePathname()` for active state (active = filled `Icon` + `bg-on-tertiary-fixed-variant rounded-full`). Use `<Icon name fill={active} />`.
- [ ] **Step 2: Create `customer-drawer.tsx`** — desktop-only (`hidden md:flex`) navy drawer (`bg-on-secondary-fixed`), POLKS GROUP wordmark, same nav items, active = `border-l-4 border-primary-fixed bg-primary/20`. Accept `footer?: ReactNode` slot for the Login/Register buttons (guest) vs profile (member).
- [ ] **Step 3: Create `customer-shell.tsx`** — composes drawer (`md:pl-[280px]` body offset) + mobile sticky top bar (POLKS GROUP, menu) + `<main>` + bottom nav. Props: `children`, `topbarRight?: ReactNode`, `drawerFooter?: ReactNode`, `maxWidth?: string` (default `max-w-7xl`).
- [ ] **Step 4: Verify.** Run: `npx tsc --noEmit`. Expected: PASS.
- [ ] **Step 5: Commit.**

```bash
git add frontend/src/components/layout/customer-shell.tsx frontend/src/components/layout/customer-drawer.tsx frontend/src/components/layout/customer-bottom-nav.tsx
git commit -m "feat(ui): customer layout shell (drawer + top bar + bottom nav)"
```

### Task 6: AdminShell (sidebar + topbar)

**Files:**
- Create: `frontend/src/components/layout/admin-shell.tsx`

Reference markup: `docs/superpowers/mockups/07-admin-dashboard.html` (header + NavigationDrawer sections) and `09-admin-pos-transactions.html`.

- [ ] **Step 1: Create `admin-shell.tsx`** — sticky top app bar (POLKS GROUP, notifications, avatar `S`) + desktop sidebar (`bg-on-secondary-fixed`) with items: Dashboard `/admin`, Members `/admin/members`, Transactions `/admin/transactions`, Campaigns `/admin/config` (config maps to the Loyalty Config mockup's settings), Analytics `/admin`, Settings `/admin/config`. Active state via `usePathname()` = `border-l-4 border-primary-fixed bg-primary/20`. Props: `children`, `title`.
- [ ] **Step 2: Verify.** Run: `npx tsc --noEmit`. Expected: PASS.
- [ ] **Step 3: Commit.**

```bash
git add frontend/src/components/layout/admin-shell.tsx
git commit -m "feat(ui): admin layout shell (sidebar + topbar)"
```

---

## Phase 5 — Customer feature components + mock data

### Task 7: Extend mock data

**Files:**
- Modify: `frontend/src/lib/loyalty/mock-data.ts`

- [ ] **Step 1: Add fields the new mockups need** without removing existing exports (existing pages still import them until migrated). Add: `member.tier` value `"Gold Tier Member"`; a `transactions` array (date, outlet, amount, points, type earn/redeem) matching `06-transaction-history.html`; an `adminStats` object (totalMembers, activeOutlets, totalPoints) and `adminMembers`, `posTransactions`, `loyaltyConfig` shaped to mockups 07/09/10/11. Read each mockup's hardcoded sample rows and mirror them.
- [ ] **Step 2: Verify.** Run: `npx tsc --noEmit`. Expected: PASS.
- [ ] **Step 3: Commit.**

```bash
git add frontend/src/lib/loyalty/mock-data.ts
git commit -m "feat(ui): extend mock data for new pages"
```

### Task 8: WalletCard / PromoCard / RewardCard

**Files:**
- Create: `frontend/src/components/customer/wallet-card.tsx`, `promo-card.tsx`, `reward-card.tsx`

- [ ] **Step 1: `wallet-card.tsx`** — navy balance card (`bg-deep-navy rounded-3xl`), gold balance number, tier chip, mini QR, member ID + copy button. Port from `03-member-dashboard.html` "Premium Point Wallet Card" section. Props: `points`, `tier`, `memberId`.
- [ ] **Step 2: `promo-card.tsx`** — image card with badge + title + 2-line desc. Port from `02-guest-home.html` promo card. Props: `title`, `description`, `badge`, `imageSrc?` (fallback to a token gradient block when absent).
- [ ] **Step 3: `reward-card.tsx`** — product/voucher card with points pill. Port from `04-rewards-catalog.html` "Product Card" / "Voucher Card". Props: `title`, `points`, `availability`, `imageSrc?`.
- [ ] **Step 4: Verify.** Run: `npx tsc --noEmit`. Expected: PASS.
- [ ] **Step 5: Commit.**

```bash
git add frontend/src/components/customer/wallet-card.tsx frontend/src/components/customer/promo-card.tsx frontend/src/components/customer/reward-card.tsx
git commit -m "feat(ui): customer wallet/promo/reward cards"
```

---

## Phase 6 — Customer pages

> Each task: read the mockup file, port markup to JSX inside the relevant shell, wire mock data / existing hooks. Verification per task = `npx tsc --noEmit` + `npm run build` clean + visual check vs mockup (dev server, mobile + desktop).

### Task 9: Login page

**Files:**
- Modify: `frontend/src/app/login/page.tsx`
- Mockup: `docs/superpowers/mockups/01-login.html`

- [ ] **Step 1: Rebuild the markup** to match the mockup (centered card, blurred decorative blobs, brand header with `coffee_maker` icon, Email/Phone + Password inputs via `<Input>`, show/hide toggle, "Login to Dashboard" button, divider, register link, footer links). Use `<Icon>` for all icons.
- [ ] **Step 2: Preserve auth logic** — keep `useAuth().login`, `email`/`password`/`showPassword`/`error`/`loading` state and `onSubmit` from the current file. Wire inputs `value`/`onChange`, the eye toggle to `showPassword`, the submit button `disabled={loading}`, and render `error`.
- [ ] **Step 3: Verify.** Run: `npx tsc --noEmit && npm run build`. Expected: PASS. Dev-check `/login` vs mockup.
- [ ] **Step 4: Commit.**

```bash
git add frontend/src/app/login/page.tsx
git commit -m "feat(ui): redesign login page (M3)"
```

### Task 10: Register page

**Files:**
- Modify: `frontend/src/app/register/page.tsx`
- Mockup: extrapolate from `01-login.html` (no dedicated register mockup) — same card shell, fields Name/Email/Phone/Password.

- [ ] **Step 1: Rebuild markup** mirroring the login card with register fields. Use `<Input>` + `<Icon>`.
- [ ] **Step 2: Preserve auth logic** — keep `useAuth().register` and existing form state/handler; wire fields.
- [ ] **Step 3: Verify.** `npx tsc --noEmit && npm run build`. Dev-check `/register`.
- [ ] **Step 4: Commit.** `git commit -m "feat(ui): redesign register page (M3)"`

### Task 11: Guest home (`/`)

**Files:**
- Modify: `frontend/src/app/page.tsx`
- Mockup: `docs/superpowers/mockups/02-guest-home.html`

- [ ] **Step 1: Rebuild** inside `CustomerShell` (guest drawer footer = Login/Register buttons): navy hero with QR card, Trending Promos grid (`PromoCard`), How It Works bento (4 steps), Outlets list + Join CTA. Use mock `locations`/`promos`.
- [ ] **Step 2: Verify.** `npx tsc --noEmit && npm run build`. Dev-check `/` mobile + desktop.
- [ ] **Step 3: Commit.** `git commit -m "feat(ui): redesign guest home (M3)"`

### Task 12: Member dashboard (`/dashboard`)

**Files:**
- Modify: `frontend/src/app/dashboard/page.tsx`
- Mockup: `docs/superpowers/mockups/03-member-dashboard.html`

- [ ] **Step 1: Rebuild** inside `CustomerShell`: greeting, `WalletCard`, quick actions (View Card / History), Today's Promo bento (`PromoCard`). Use `member` mock data + `useAuth().user` for name/points when available (fallback to mock).

  > NOTE: the mockup's desktop drawer text says "Admin Panel" — that is a copy/paste artifact in the mockup. Use the **customer** drawer (Home/Wallet/Rewards/Profile), NOT an admin panel, on this page.

- [ ] **Step 2: Verify.** `npx tsc --noEmit && npm run build`. Dev-check `/dashboard`.
- [ ] **Step 3: Commit.** `git commit -m "feat(ui): redesign member dashboard (M3)"`

### Task 13: Rewards catalog (`/rewards`)

**Files:**
- Modify: `frontend/src/app/rewards/page.tsx`
- Mockup: `docs/superpowers/mockups/04-rewards-catalog.html`

- [ ] **Step 1: Rebuild** inside `CustomerShell`: header, balance card, category `<Chip>` row (client state for active category, filter `rewards` by category), rewards grid (`RewardCard`), voucher cards. Link cards to `/voucher-success`.
- [ ] **Step 2: Verify.** `npx tsc --noEmit && npm run build`. Dev-check `/rewards`.
- [ ] **Step 3: Commit.** `git commit -m "feat(ui): redesign rewards catalog (M3)"`

### Task 14: Member card (`/member-card`)

**Files:**
- Modify: `frontend/src/app/member-card/page.tsx`
- Mockup: `docs/superpowers/mockups/05-member-card.html`

- [ ] **Step 1: Rebuild** inside `CustomerShell`: top bar, digital card (navy + accent) with large QR area + scan-line effect, member info, action buttons (Refresh / Save). Use `member` mock data. Render QR as the placeholder block from the mockup (`<Icon name="qr_code_2">` in a white square) — no QR lib needed.
- [ ] **Step 2: Verify.** `npx tsc --noEmit && npm run build`. Dev-check `/member-card`.
- [ ] **Step 3: Commit.** `git commit -m "feat(ui): redesign member card (M3)"`

### Task 15: Transaction history (`/history`) — NEW

**Files:**
- Create: `frontend/src/app/history/page.tsx`
- Mockup: `docs/superpowers/mockups/06-transaction-history.html`

- [ ] **Step 1: Create** inside `CustomerShell`: header, point summary bento boxes, transactions list (earn/redeem rows with date/outlet/amount/points, colored point delta). Use mock `transactions`.
- [ ] **Step 2: Verify.** `npx tsc --noEmit && npm run build`. Dev-check `/history`.
- [ ] **Step 3: Commit.** `git commit -m "feat(ui): add transaction history page (M3)"`

### Task 16: Restyle remaining customer pages (verify, verify-account, voucher-success)

**Files:**
- Modify: `frontend/src/app/verify/page.tsx`, `verify-account/page.tsx`, `voucher-success/page.tsx`
- Mockup: none — extrapolate using M3 tokens + card patterns. `voucher-success` follows the existing `VoucherSuccessCard` structure restyled to M3 (centered card, success icon `verified`, voucher code block, CTA).

- [ ] **Step 1: Restyle each page** swapping `polks-*` classes for M3 tokens and lucide→`<Icon>`. Keep any existing logic/handlers. Wrap customer-facing ones in `CustomerShell` if they were full pages, or a centered auth-style card for verify steps.
- [ ] **Step 2: Verify.** `npx tsc --noEmit && npm run build`. Dev-check each route.
- [ ] **Step 3: Commit.** `git commit -m "feat(ui): restyle verify + voucher-success pages (M3)"`

---

## Phase 7 — Admin pages

### Task 17: Admin login (`/admin/login`) — NEW

**Files:**
- Create: `frontend/src/app/admin/login/page.tsx`
- Mockup: `docs/superpowers/mockups/08-admin-login.html`

- [ ] **Step 1: Create** the admin login card per mockup. Wire `useAuth().login` (same hook), on success `router.push("/admin")`. Use `<Input>` + `<Icon>`.
- [ ] **Step 2: Verify.** `npx tsc --noEmit && npm run build`. Dev-check `/admin/login`.
- [ ] **Step 3: Commit.** `git commit -m "feat(ui): add admin login page (M3)"`

### Task 18: Admin dashboard (`/admin`) — NEW

**Files:**
- Create: `frontend/src/app/admin/page.tsx`
- Mockup: `docs/superpowers/mockups/07-admin-dashboard.html`

- [ ] **Step 1: Create** inside `AdminShell`: bento stat grid (`StatCard` — create in this task at `src/components/ui/stat-card.tsx` if not present: title, value, icon, delta), chart area (port the CSS-bar chart markup from the mockup), recent activity. Use `adminStats` mock.
- [ ] **Step 2: Verify.** `npx tsc --noEmit && npm run build`. Dev-check `/admin`.
- [ ] **Step 3: Commit.** `git commit -m "feat(ui): add admin dashboard (M3)"`

### Task 19: Admin POS transactions (`/admin/transactions`) — NEW

**Files:**
- Create: `frontend/src/app/admin/transactions/page.tsx`, `frontend/src/components/ui/data-table.tsx`
- Mockup: `docs/superpowers/mockups/09-admin-pos-transactions.html`

- [ ] **Step 1: Create `data-table.tsx`** — reusable table shell (header row, body rows, hover, responsive) + filters bar + pagination footer, generic over column defs, matching the mockup's table card.
- [ ] **Step 2: Create the page** inside `AdminShell`: header, filters card, `DataTable` of POS transactions, pagination. Use `posTransactions` mock.
- [ ] **Step 3: Verify.** `npx tsc --noEmit && npm run build`. Dev-check `/admin/transactions`.
- [ ] **Step 4: Commit.** `git commit -m "feat(ui): add admin POS transactions page + data table (M3)"`

### Task 20: Admin member management (`/admin/members`) — NEW

**Files:**
- Create: `frontend/src/app/admin/members/page.tsx`
- Mockup: `docs/superpowers/mockups/10-admin-member-management.html`

- [ ] **Step 1: Create** inside `AdminShell`: search/filter bar, member `DataTable` (name, member code, points, tier, status, actions). Use `adminMembers` mock.
- [ ] **Step 2: Verify.** `npx tsc --noEmit && npm run build`. Dev-check `/admin/members`.
- [ ] **Step 3: Commit.** `git commit -m "feat(ui): add admin member management page (M3)"`

### Task 21: Admin loyalty config (`/admin/config`) — NEW

**Files:**
- Create: `frontend/src/app/admin/config/page.tsx`
- Mockup: `docs/superpowers/mockups/11-admin-loyalty-config.html`

- [ ] **Step 1: Create** inside `AdminShell`: settings form sections (points-per-rupiah, expiry, tier thresholds, etc.) using `<Input>` and cards per mockup. Use `loyaltyConfig` mock as defaults (presentational; no save wiring beyond local state).
- [ ] **Step 2: Verify.** `npx tsc --noEmit && npm run build`. Dev-check `/admin/config`.
- [ ] **Step 3: Commit.** `git commit -m "feat(ui): add admin loyalty config page (M3)"`

---

## Phase 8 — Cleanup

### Task 22: Delete dead components + verify no stale tokens

**Files:**
- Delete: `frontend/src/components/member/*`, `frontend/src/components/loyalty/bottom-nav.tsx`, `customer-mobile-shell.tsx`, `admin-layout.tsx`, `loyalty-ui.tsx`, `frontend/src/components/auth/auth-ui.tsx`

- [ ] **Step 1: Confirm no imports remain.** Run: `grep -rn "components/member\|loyalty/bottom-nav\|customer-mobile-shell\|admin-layout\|loyalty-ui\|auth/auth-ui" frontend/src`. Expected: no matches. If any, migrate that importer first.
- [ ] **Step 2: Delete the dead files** (`git rm`).
- [ ] **Step 3: Confirm no `polks-*` token references remain.** Run: `grep -rn "polks-" frontend/src`. Expected: no matches. Fix any stragglers.
- [ ] **Step 4: Verify.** Run: `npx tsc --noEmit && npm run build`. Expected: PASS.
- [ ] **Step 5: Commit.**

```bash
git add -A frontend/src
git commit -m "chore(ui): remove dead components and legacy polks tokens"
```

---

## Self-Review notes

- **Spec coverage:** token layer (T1–2), icon map (T3), shells (T5–6), shared UI (T4, T18/T19 add stat-card/data-table), all 11 mockup pages (T9, T11, T12, T13, T14, T15, T17, T18, T19, T20, T21), extrapolated pages register/verify/voucher (T10, T16), `/admin/*` routing (T17–21), light-only (no dark toggle). Covered.
- **Mock-data dependency:** T7 must run before customer/admin page tasks that read `transactions`/`adminStats`/`adminMembers`/`posTransactions`/`loyaltyConfig`.
- **StatCard/DataTable** are created in their first-consuming task (T18/T19) to avoid an empty-component task.
- **Dashboard mockup "Admin Panel" drawer** is a known mockup artifact — T12 Step 1 NOTE handles it (use customer drawer).
