# Admin Sidebar Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restruktur sidebar admin dari 15 item flat menjadi accordion group dengan 5 top-level item, hapus Idempotency, dan pisah Settings sebagai standalone.

**Architecture:** Semua perubahan ada di satu file (`admin-shell.tsx`). Refactor NAV dari flat array ke struktur group, tambah accordion state dengan `useState<Set<string>>`, dan render ulang Sidebar component.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Lucide React

## Global Constraints

- Hanya boleh ubah `frontend/src/components/layout/admin-shell.tsx`
- Semua route/href tidak berubah
- Style warna, font, border ikuti token yang sudah ada (`text-white/30`, `bg-white/[0.12]`, dll)
- Tidak ada perubahan di file lain

---

### Task 1: Refactor struktur data NAV

**Files:**
- Modify: `frontend/src/components/layout/admin-shell.tsx`

**Interfaces:**
- Produces: tipe `NavGroup`, konstanta `STANDALONE`, `GROUPS`, `SETTINGS_ITEM` yang dipakai Task 2

- [ ] **Step 1: Buka file dan pahami struktur saat ini**

Baca `frontend/src/components/layout/admin-shell.tsx`. Perhatikan tipe `NavItem` dan array `NAV` di baris 14–38.

- [ ] **Step 2: Tambah tipe `NavGroup` dan ganti data NAV**

Ganti blok tipe + konstanta NAV (baris 14–38) dengan ini:

```typescript
type NavItem = {
  label: string;
  href: string;
  Icon: typeof LayoutDashboard;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const STANDALONE: NavItem = {
  label: "Overview",
  href: "/admin",
  Icon: LayoutDashboard,
};

const GROUPS: NavGroup[] = [
  {
    label: "Manajemen",
    items: [
      { label: "Members", href: "/admin/members", Icon: Users },
      { label: "Group", href: "/admin/group", Icon: Layers },
      { label: "Outlets", href: "/admin/outlets", Icon: Store },
    ],
  },
  {
    label: "Loyalty",
    items: [
      { label: "Promotions", href: "/admin/promos", Icon: Tag },
      { label: "Rewards", href: "/admin/rewards", Icon: Gift },
      { label: "Vouchers", href: "/admin/vouchers", Icon: Ticket },
      { label: "Loyalty Config", href: "/admin/config", Icon: Settings },
    ],
  },
  {
    label: "Aktivitas",
    items: [
      { label: "POS Transactions", href: "/admin/transactions", Icon: Zap },
      { label: "Redeem History", href: "/admin/redeem-history", Icon: History },
    ],
  },
  {
    label: "Sistem",
    items: [
      { label: "Broadcast", href: "/admin/broadcast", Icon: Radio },
      { label: "POS Sync", href: "/admin/pos-sync", Icon: RefreshCw },
      { label: "Webhook Inbox", href: "/admin/webhook", Icon: Webhook },
    ],
  },
];

const SETTINGS_ITEM: NavItem = {
  label: "Settings",
  href: "/admin/settings",
  Icon: Settings,
};
```

- [ ] **Step 3: Update import Lucide**

Ganti baris import lucide-react. Hapus `ShieldCheck` (tidak terpakai), tambah `ChevronRight`:

```typescript
import {
  LayoutDashboard, Users, Store, Tag, Gift, Ticket, Webhook,
  RefreshCw, History, Settings, Radio, LogOut, Bell, Search,
  Menu, X, Layers, Zap, ChevronRight,
} from "lucide-react";
```

- [ ] **Step 4: Verifikasi TypeScript tidak error**

```bash
cd frontend && npx tsc --noEmit
```

Expected: tidak ada error baru.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/layout/admin-shell.tsx
git commit -m "refactor(admin): restruktur data NAV sidebar ke accordion groups"
```

---

### Task 2: Implementasi accordion UI

**Files:**
- Modify: `frontend/src/components/layout/admin-shell.tsx`

**Interfaces:**
- Consumes: `STANDALONE`, `GROUPS`, `SETTINGS_ITEM`, `NavGroup`, `NavItem` dari Task 1
- Consumes: `isActive(pathname, href)` yang sudah ada

- [ ] **Step 1: Tambah accordion state di dalam `AdminShell`**

Tepat di bawah baris `const [drawerOpen, setDrawerOpen] = useState(false);`, tambahkan:

```typescript
const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
  const initial = new Set<string>();
  GROUPS.forEach((g) => {
    if (g.items.some((item) => isActive(pathname, item.href))) {
      initial.add(g.label);
    }
  });
  return initial;
});

function toggleGroup(label: string) {
  setOpenGroups((prev) => {
    const next = new Set(prev);
    if (next.has(label)) next.delete(label);
    else next.add(label);
    return next;
  });
}
```

- [ ] **Step 2: Ganti render `<nav>` di dalam komponen `Sidebar`**

Temukan blok `<nav className="flex-1 overflow-y-auto px-2 py-1">` dan ganti seluruh isinya:

```tsx
<nav className="flex-1 overflow-y-auto px-2 py-1">
  {/* Overview — standalone */}
  <Link
    href={STANDALONE.href}
    onClick={() => setDrawerOpen(false)}
    className={cn(
      "mb-0.5 flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 transition-colors",
      isActive(pathname, STANDALONE.href)
        ? "bg-white/[0.12]"
        : "hover:bg-white/[0.06]",
    )}
  >
    <STANDALONE.Icon
      size={16}
      className={isActive(pathname, STANDALONE.href) ? "text-white" : "text-white/50"}
    />
    <span
      className={cn(
        "whitespace-nowrap text-[13px]",
        isActive(pathname, STANDALONE.href)
          ? "font-bold text-white"
          : "font-medium text-white/55",
      )}
    >
      {STANDALONE.label}
    </span>
  </Link>

  {/* Accordion groups */}
  {GROUPS.map((group) => {
    const isOpen = openGroups.has(group.label);
    return (
      <div key={group.label} className="mb-0.5">
        <button
          type="button"
          onClick={() => toggleGroup(group.label)}
          className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 hover:bg-white/[0.06] transition-colors"
        >
          <span className="flex-1 text-left text-[9px] font-bold uppercase tracking-[0.1em] text-white/30">
            {group.label}
          </span>
          <ChevronRight
            size={12}
            className={cn(
              "text-white/30 transition-transform duration-200",
              isOpen && "rotate-90",
            )}
          />
        </button>
        {isOpen && (
          <div className="mt-0.5">
            {group.items.map(({ label, href, Icon }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setDrawerOpen(false)}
                  className={cn(
                    "mb-0.5 flex items-center gap-2.5 rounded-[10px] pl-5 pr-3 py-2.5 transition-colors",
                    active ? "bg-white/[0.12]" : "hover:bg-white/[0.06]",
                  )}
                >
                  <Icon
                    size={16}
                    className={active ? "text-white" : "text-white/50"}
                  />
                  <span
                    className={cn(
                      "whitespace-nowrap text-[13px]",
                      active ? "font-bold text-white" : "font-medium text-white/55",
                    )}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  })}
</nav>
```

- [ ] **Step 3: Tambah Settings standalone di area bawah sebelum Logout**

Temukan blok `<div className="flex-shrink-0 border-t border-white/[0.07] px-2 py-3">` dan ganti dengan:

```tsx
<div className="flex-shrink-0 border-t border-white/[0.07] px-2 py-3">
  {/* Settings standalone */}
  <Link
    href={SETTINGS_ITEM.href}
    onClick={() => setDrawerOpen(false)}
    className={cn(
      "mb-0.5 flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 transition-colors",
      isActive(pathname, SETTINGS_ITEM.href)
        ? "bg-white/[0.12]"
        : "hover:bg-white/[0.06]",
    )}
  >
    <SETTINGS_ITEM.Icon
      size={16}
      className={isActive(pathname, SETTINGS_ITEM.href) ? "text-white" : "text-white/50"}
    />
    <span
      className={cn(
        "whitespace-nowrap text-[13px]",
        isActive(pathname, SETTINGS_ITEM.href)
          ? "font-bold text-white"
          : "font-medium text-white/55",
      )}
    >
      {SETTINGS_ITEM.label}
    </span>
  </Link>

  {/* Logout */}
  <button
    type="button"
    onClick={handleLogout}
    className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 hover:bg-white/[0.06]"
  >
    <LogOut size={16} className="text-white/40" />
    <span className="text-[13px] font-medium text-white/40">Keluar</span>
  </button>
</div>
```

- [ ] **Step 4: Verifikasi TypeScript tidak error**

```bash
cd frontend && npx tsc --noEmit
```

Expected: tidak ada error.

- [ ] **Step 5: Jalankan dev server dan verifikasi manual**

```bash
cd frontend && npm run dev
```

Cek di browser `http://localhost:3000/admin`:
- [ ] Sidebar tampil Overview + 4 grup (Manajemen, Loyalty, Aktivitas, Sistem) + Settings + Logout
- [ ] Klik grup → expand, klik lagi → collapse
- [ ] Dua grup bisa terbuka bersamaan
- [ ] Navigasi ke `/admin/members` → grup Manajemen auto-expand
- [ ] Navigasi ke `/admin/config` → grup Loyalty auto-expand
- [ ] Settings aktif highlight saat di `/admin/settings`
- [ ] Idempotency tidak muncul di mana pun
- [ ] Mobile drawer berfungsi sama

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/layout/admin-shell.tsx
git commit -m "feat(admin): sidebar accordion grouping, hapus Idempotency, Settings standalone"
```
