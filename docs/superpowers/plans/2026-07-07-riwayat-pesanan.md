# Riwayat Pesanan (Order History) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let members view their POS order history (outlet, items, prices, points earned) at a new `/order-history` page, reachable from Dashboard and Profile.

**Architecture:** Extend the existing `GET /member/transactions` endpoint (backend already reads POS-synced `Transaction`/`TransactionItem` rows) to also resolve outlet name from `storeId`. Build a new Next.js page that paginates through it with infinite scroll, per-outlet filter chips, and expandable line-item detail. Wire up two entry points on Dashboard (consolidate `Kartu Member` big button into `Rewards`, swap the `Rewards` quick action for `Riwayat`) and one on Profile (new menu item).

**Tech Stack:** NestJS + Prisma (backend, existing), Next.js App Router + Tailwind (frontend, existing). No new dependencies, no Prisma migration.

## Global Constraints

- No Prisma schema/migration changes — `Outlet.storeId` is already `@unique`, resolve via a second query, not a new relation.
- All new UI copy is Bahasa Indonesia, matching existing pages (`history/page.tsx`, `profile/page.tsx`).
- Reuse existing design tokens/components: `CustomerShell`, `Icon` (`@/components/ui/icon`), `Button` (`@/components/ui/button`), `cn` (`@/lib/utils`), `formatRupiah` (`@/lib/loyalty/tier`), Tailwind `polks-*` classes.
- Frontend has no test framework (no jest/testing-library configured) — frontend tasks are verified by running the dev server and driving the real page in a browser, not by writing unit tests. Backend has Jest configured — backend task uses TDD.
- `GET /member/transactions` currently has no other consumers — safe to extend its `select`/response shape without a compat shim.

---

### Task 1: Backend — resolve outlet name in `getTransactions`

**Files:**
- Modify: `backend/src/member/member.service.ts:110-134` (`getTransactions` method)
- Test: `backend/src/member/member.service.spec.ts` (append new `describe` block at end of file)

**Interfaces:**
- Produces: `MemberService.getTransactions(userId: string, skip = 0, take = 20)` now resolves to
  `{ total: number; skip: number; take: number; items: Array<{ id: string; posOrderNumber: string | null; status: string | null; grandTotal: number; paymentMethod: string | null; pointsAwarded: number; occurredAt: Date | null; createdAt: Date; outletName: string | null; items: Array<{ name: string; qty: number; lineTotal: number; isReward: boolean }> }> }`.
  This is consumed unchanged by the existing `GET /member/transactions` route (`backend/src/member/member.controller.ts:44-48`) and by Task 2's frontend fetch (after JSON serialization, `Date` fields arrive as ISO strings).

- [ ] **Step 1: Write the failing tests**

Append to `backend/src/member/member.service.spec.ts`:

```ts
describe('MemberService.getTransactions', () => {
  let service: MemberService;
  let prisma: {
    member: { findUnique: jest.Mock };
    transaction: { findMany: jest.Mock; count: jest.Mock };
    outlet: { findMany: jest.Mock };
    $transaction: jest.Mock;
  };

  const member = {
    id: 'm1',
    userId: 'u1',
    memberCode: 'MBR-1',
    name: 'Zia',
    phone: '081111',
    pointBalance: 100,
    createdAt: new Date(),
    user: { email: null },
    tier: null,
  };

  beforeEach(async () => {
    prisma = {
      member: { findUnique: jest.fn().mockResolvedValue(member) },
      transaction: {
        findMany: jest.fn(),
        count: jest.fn().mockResolvedValue(1),
      },
      outlet: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ storeId: 'store-1', name: 'Cafe A' }]),
      },
      $transaction: jest
        .fn()
        .mockImplementation((arr: Promise<unknown>[]) => Promise.all(arr)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemberService,
        { provide: PrismaService, useValue: prisma },
        { provide: TierService, useValue: { statusForMember: jest.fn() } },
      ],
    }).compile();
    service = module.get(MemberService);
  });

  it('resolves outletName from the matching outlet storeId', async () => {
    prisma.transaction.findMany.mockResolvedValue([
      {
        id: 't1',
        posOrderNumber: 'ORD-1',
        storeId: 'store-1',
        status: 'selesai',
        grandTotal: 55000,
        paymentMethod: 'QRIS',
        pointsAwarded: 55,
        occurredAt: new Date('2026-06-12'),
        createdAt: new Date('2026-06-12'),
        items: [
          { name: 'Cookies & Cream', qty: 1, lineTotal: 55000, isReward: false },
        ],
      },
    ]);

    const result = await service.getTransactions('u1', 0, 20);

    expect(prisma.outlet.findMany).toHaveBeenCalledWith({
      where: { storeId: { in: ['store-1'] } },
      select: { storeId: true, name: true },
    });
    expect(result.items[0]).toMatchObject({
      id: 't1',
      outletName: 'Cafe A',
      status: 'selesai',
    });
    expect(result.items[0]).not.toHaveProperty('storeId');
  });

  it('falls back to null outletName when storeId has no matching outlet', async () => {
    prisma.transaction.findMany.mockResolvedValue([
      {
        id: 't2',
        posOrderNumber: 'ORD-2',
        storeId: 'store-unknown',
        status: 'selesai',
        grandTotal: 10000,
        paymentMethod: 'Cash',
        pointsAwarded: 10,
        occurredAt: null,
        createdAt: new Date('2026-06-01'),
        items: [],
      },
    ]);
    prisma.outlet.findMany.mockResolvedValue([]);

    const result = await service.getTransactions('u1', 0, 20);
    expect(result.items[0].outletName).toBeNull();
  });

  it('skips the outlet lookup entirely when no transaction has a storeId', async () => {
    prisma.transaction.findMany.mockResolvedValue([
      {
        id: 't3',
        posOrderNumber: null,
        storeId: null,
        status: null,
        grandTotal: 20000,
        paymentMethod: null,
        pointsAwarded: 0,
        occurredAt: null,
        createdAt: new Date('2026-05-01'),
        items: [],
      },
    ]);

    const result = await service.getTransactions('u1', 0, 20);
    expect(prisma.outlet.findMany).not.toHaveBeenCalled();
    expect(result.items[0].outletName).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && npx jest member.service.spec.ts -t getTransactions`
Expected: FAIL — `prisma.outlet.findMany` was not called (current implementation doesn't select `storeId`/`status` or query `outlet`), and `result.items[0].outletName` is `undefined`, not `'Cafe A'`/`null`.

- [ ] **Step 3: Implement the outlet-name resolution**

Replace `getTransactions` in `backend/src/member/member.service.ts:110-134`:

```ts
  async getTransactions(userId: string, skip = 0, take = 20) {
    const m = await this.getMemberOrThrow(userId);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where: { memberId: m.id },
        orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
        select: {
          id: true,
          posOrderNumber: true,
          storeId: true,
          status: true,
          grandTotal: true,
          paymentMethod: true,
          pointsAwarded: true,
          occurredAt: true,
          createdAt: true,
          items: {
            select: { name: true, qty: true, lineTotal: true, isReward: true },
          },
        },
      }),
      this.prisma.transaction.count({ where: { memberId: m.id } }),
    ]);

    // storeId mentah dari POS; Outlet.storeId unik jadi lookup manual (bukan FK).
    const storeIds = [
      ...new Set(
        items
          .map((t) => t.storeId)
          .filter((id): id is string => typeof id === 'string'),
      ),
    ];
    const outlets = storeIds.length
      ? await this.prisma.outlet.findMany({
          where: { storeId: { in: storeIds } },
          select: { storeId: true, name: true },
        })
      : [];
    const outletNameByStoreId = new Map(
      outlets.map((o) => [o.storeId as string, o.name]),
    );

    return {
      total,
      skip,
      take,
      items: items.map(({ storeId, ...t }) => ({
        ...t,
        outletName: storeId ? (outletNameByStoreId.get(storeId) ?? null) : null,
      })),
    };
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && npx jest member.service.spec.ts`
Expected: PASS (all `MemberService.updateProfile` and `MemberService.getTransactions` tests green).

- [ ] **Step 5: Commit**

```bash
git add backend/src/member/member.service.ts backend/src/member/member.service.spec.ts
git commit -m "feat(member): resolve outlet name in transaction history"
```

---

### Task 2: Frontend — `Transaction` type + base `/order-history` page

**Files:**
- Modify: `frontend/src/lib/loyalty/types.ts` (append `Transaction` type)
- Create: `frontend/src/app/order-history/page.tsx`

**Interfaces:**
- Consumes: `GET /member/transactions?take=N` response from Task 1 (`{ total, skip, take, items }`, items shaped per Task 1's `Produces`, dates as ISO strings after JSON transport).
- Produces: `Transaction` type (exported from `frontend/src/lib/loyalty/types.ts`) and the `/order-history` route, rendering a collapsed list (no filter/expand/infinite-scroll yet — added in Task 3). Consumed by Task 3 (same file), Task 4 and Task 5 (link targets).

- [ ] **Step 1: Add the `Transaction` type**

Append to `frontend/src/lib/loyalty/types.ts`:

```ts
// Transaksi POS milik member — GET /member/transactions
export type Transaction = {
  id: string;
  posOrderNumber: string | null;
  outletName: string | null;
  status: string | null;
  grandTotal: number;
  paymentMethod: string | null;
  pointsAwarded: number;
  occurredAt: string | null;
  createdAt: string;
  items: { name: string; qty: number; lineTotal: number; isReward: boolean }[];
};
```

- [ ] **Step 2: Create the base page**

Create `frontend/src/app/order-history/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Store } from "lucide-react";
import { CustomerShell } from "@/components/layout/customer-shell";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { api, ApiError } from "@/lib/api";
import { formatRupiah } from "@/lib/loyalty/tier";
import { type Paginated, type Transaction } from "@/lib/loyalty/types";

function formatDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const PAGE_SIZE = 20;

export default function OrderHistoryPage() {
  const router = useRouter();

  const [entries, setEntries] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api<Paginated<Transaction>>(
        `/member/transactions?take=${PAGE_SIZE}`,
      );
      setEntries(data.items);
      setTotal(data.total);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Gagal memuat riwayat pesanan");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalSpend = entries.reduce((s, t) => s + t.grandTotal, 0);

  return (
    <CustomerShell showHeader={false} topbarRight={null}>
      <div className="bg-polks-brand px-5 pb-4 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Kembali"
          className="mb-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors active:bg-white/20"
        >
          <Icon name="arrow_back" className="size-[18px]" />
        </button>
        <h1 className="text-[22px] font-bold tracking-[-0.02em] text-white">Riwayat Pesanan</h1>
        <p className="mt-1 text-[13px] text-white/50">Semua pesanan kamu di POLKS.</p>

        <div className="mt-4 flex gap-3">
          <div className="flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.08] px-4 py-2.5">
            <p className="text-[10px] text-white/40">Jumlah Pesanan</p>
            <p className="text-[17px] font-bold tracking-[-0.02em] text-white">
              {total.toLocaleString("id-ID")}
            </p>
          </div>
          <div
            className="flex-1 rounded-2xl border border-[rgba(246,184,75,0.2)] px-4 py-2.5"
            style={{ background: "linear-gradient(135deg,#1A2830 0%,#2A3D4D 45%,#2D3A28 100%)" }}
          >
            <p className="text-[10px] text-white/45">Total Belanja</p>
            <p className="text-[17px] font-bold tracking-[-0.02em] text-[#F6B84B]">
              {formatRupiah(totalSpend)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-polks-brand leading-none">
        <svg viewBox="0 0 390 28" preserveAspectRatio="none" className="block h-7 w-full">
          <path d="M0,0 Q195,28 390,0 L390,28 L0,28 Z" fill="#F6F8FA" />
        </svg>
      </div>

      <div className="flex flex-col gap-5 bg-polks-bg px-5 pb-28">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-polks-border bg-polks-card p-4">
                <div className="mb-2 h-4 w-1/2 rounded bg-polks-surface" />
                <div className="h-3 w-1/3 rounded bg-polks-surface" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-polks-border bg-polks-card p-5 text-center">
            <Icon name="error" className="size-10 text-polks-error" />
            <p className="text-sm text-polks-muted">{error}</p>
            <Button variant="outline" onClick={load}>
              <Icon name="refresh" className="size-5" />
              Coba lagi
            </Button>
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border border-polks-border bg-polks-card p-5 text-center">
            <p className="text-sm text-polks-muted">Belum ada riwayat pesanan.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map((t) => (
              <div key={t.id} className="overflow-hidden rounded-2xl border border-polks-border bg-polks-card">
                <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-polks-surface">
                      <Store size={16} className="text-polks-text" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-polks-text">
                        {t.outletName ?? "Outlet tidak diketahui"}
                      </p>
                      <p className="text-[11px] text-polks-muted">
                        {formatDate(t.occurredAt ?? t.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-polks-success">
                    +{t.pointsAwarded.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-polks-border bg-polks-bg px-4 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    {t.posOrderNumber ? (
                      <span className="truncate text-[11px] text-polks-muted">{t.posOrderNumber}</span>
                    ) : null}
                    {t.paymentMethod ? (
                      <span className="rounded-md bg-polks-surface px-1.5 py-0.5 text-[10px] font-semibold text-polks-muted">
                        {t.paymentMethod}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-[12px] font-semibold text-polks-text">
                      {formatRupiah(t.grandTotal)}
                    </span>
                    {t.status ? (
                      <span className="rounded-md bg-polks-point-soft px-1.5 py-0.5 text-[10px] font-semibold text-polks-success">
                        {t.status}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CustomerShell>
  );
}
```

- [ ] **Step 3: Verify in the browser**

Run: `cd backend && npm run start:dev` (leave running)
Run: `cd frontend && npm run dev` (leave running)
Log in as an existing member in the browser at `http://localhost:3001/login`, then navigate to `http://localhost:3001/order-history` directly.
Expected: navy header "Riwayat Pesanan" renders, stat chips show a number (0 or more), and either the empty state ("Belum ada riwayat pesanan.") or a list of order cards renders depending on whether the logged-in member has any `Transaction` rows. No console errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/loyalty/types.ts frontend/src/app/order-history/page.tsx
git commit -m "feat(order-history): add base riwayat pesanan page"
```

---

### Task 3: Frontend — outlet filter, expandable items, infinite scroll

**Files:**
- Modify: `frontend/src/app/order-history/page.tsx` (full rewrite of the component built in Task 2)

**Interfaces:**
- Consumes: same `Transaction`/`Paginated<Transaction>` types and `/member/transactions` endpoint as Task 2.
- Produces: the finished `/order-history` route that Task 4 and Task 5 link to.

- [ ] **Step 1: Replace the page with filter + expand + infinite scroll**

Replace the entire contents of `frontend/src/app/order-history/page.tsx`:

```tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Store } from "lucide-react";
import { CustomerShell } from "@/components/layout/customer-shell";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/loyalty/tier";
import { type Paginated, type Transaction } from "@/lib/loyalty/types";

function formatDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const PAGE_SIZE = 20;

export default function OrderHistoryPage() {
  const router = useRouter();

  const [entries, setEntries] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreFailed, setLoadMoreFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterOutlet, setFilterOutlet] = useState("Semua");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    setLoadMoreFailed(false);
    try {
      const data = await api<Paginated<Transaction>>(
        `/member/transactions?take=${PAGE_SIZE}`,
      );
      setEntries(data.items);
      setTotal(data.total);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Gagal memuat riwayat pesanan");
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (loading || loadingMore || loadMoreFailed || entries.length >= total) return;
    setLoadingMore(true);
    try {
      const data = await api<Paginated<Transaction>>(
        `/member/transactions?skip=${entries.length}&take=${PAGE_SIZE}`,
      );
      setEntries((prev) => [...prev, ...data.items]);
      setTotal(data.total);
    } catch {
      // Diamkan di list: gagal muat halaman berikutnya tidak boleh menghapus
      // data yang sudah tampil. Tandai gagal supaya sentinel berhenti auto-retry.
      setLoadMoreFailed(true);
    } finally {
      setLoadingMore(false);
    }
  }

  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Infinite scroll: muat halaman berikutnya saat sentinel di bawah list terlihat.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || loading || error || entries.length >= total) return;
    const observer = new IntersectionObserver(
      (observed) => {
        if (observed[0]?.isIntersecting) loadMoreRef.current();
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, error, entries.length, total]);

  const outletNames = useMemo(
    () => [...new Set(entries.map((t) => t.outletName).filter((n): n is string => !!n))],
    [entries],
  );
  const filters = ["Semua", ...outletNames];

  const visible = useMemo(
    () =>
      filterOutlet === "Semua"
        ? entries
        : entries.filter((t) => t.outletName === filterOutlet),
    [entries, filterOutlet],
  );

  const totalSpend = entries.reduce((s, t) => s + t.grandTotal, 0);

  return (
    <CustomerShell showHeader={false} topbarRight={null}>
      <div className="bg-polks-brand px-5 pb-4 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Kembali"
          className="mb-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors active:bg-white/20"
        >
          <Icon name="arrow_back" className="size-[18px]" />
        </button>
        <h1 className="text-[22px] font-bold tracking-[-0.02em] text-white">Riwayat Pesanan</h1>
        <p className="mt-1 text-[13px] text-white/50">Semua pesanan kamu di POLKS.</p>

        <div className="mt-4 flex gap-3">
          <div className="flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.08] px-4 py-2.5">
            <p className="text-[10px] text-white/40">Jumlah Pesanan</p>
            <p className="text-[17px] font-bold tracking-[-0.02em] text-white">
              {total.toLocaleString("id-ID")}
            </p>
          </div>
          <div
            className="flex-1 rounded-2xl border border-[rgba(246,184,75,0.2)] px-4 py-2.5"
            style={{ background: "linear-gradient(135deg,#1A2830 0%,#2A3D4D 45%,#2D3A28 100%)" }}
          >
            <p className="text-[10px] text-white/45">Total Belanja</p>
            <p className="text-[17px] font-bold tracking-[-0.02em] text-[#F6B84B]">
              {formatRupiah(totalSpend)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-polks-brand leading-none">
        <svg viewBox="0 0 390 28" preserveAspectRatio="none" className="block h-7 w-full">
          <path d="M0,0 Q195,28 390,0 L390,28 L0,28 Z" fill="#F6F8FA" />
        </svg>
      </div>

      <div className="flex flex-col gap-5 bg-polks-bg px-5 pb-28">
        {!loading && !error && entries.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilterOutlet(f)}
                className={cn(
                  "h-8 shrink-0 whitespace-nowrap rounded-full px-3 text-xs font-semibold transition-colors",
                  filterOutlet === f
                    ? "bg-polks-brand text-white"
                    : "border border-polks-border bg-polks-card text-polks-muted",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        ) : null}

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-polks-border bg-polks-card p-4">
                <div className="mb-2 h-4 w-1/2 rounded bg-polks-surface" />
                <div className="h-3 w-1/3 rounded bg-polks-surface" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-polks-border bg-polks-card p-5 text-center">
            <Icon name="error" className="size-10 text-polks-error" />
            <p className="text-sm text-polks-muted">{error}</p>
            <Button variant="outline" onClick={load}>
              <Icon name="refresh" className="size-5" />
              Coba lagi
            </Button>
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border border-polks-border bg-polks-card p-5 text-center">
            <p className="text-sm text-polks-muted">Belum ada riwayat pesanan.</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-polks-border bg-polks-card p-5 text-center">
            <p className="text-sm text-polks-muted">Tidak ada pesanan di outlet ini.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {visible.map((t) => {
              const expanded = expandedId === t.id;
              return (
                <div
                  key={t.id}
                  className="overflow-hidden rounded-2xl border border-polks-border bg-polks-card"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : t.id)}
                    className="flex w-full items-center justify-between gap-3 px-4 pb-3 pt-4 text-left"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-polks-surface">
                        <Store size={16} className="text-polks-text" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-polks-text">
                          {t.outletName ?? "Outlet tidak diketahui"}
                        </p>
                        <p className="text-[11px] text-polks-muted">
                          {formatDate(t.occurredAt ?? t.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-polks-success">
                      +{t.pointsAwarded.toLocaleString("id-ID")}
                    </span>
                  </button>

                  <div className="flex items-center justify-between border-t border-polks-border bg-polks-bg px-4 py-2.5">
                    <div className="flex min-w-0 items-center gap-2">
                      {t.posOrderNumber ? (
                        <span className="truncate text-[11px] text-polks-muted">{t.posOrderNumber}</span>
                      ) : null}
                      {t.paymentMethod ? (
                        <span className="rounded-md bg-polks-surface px-1.5 py-0.5 text-[10px] font-semibold text-polks-muted">
                          {t.paymentMethod}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-[12px] font-semibold text-polks-text">
                        {formatRupiah(t.grandTotal)}
                      </span>
                      {t.status ? (
                        <span className="rounded-md bg-polks-point-soft px-1.5 py-0.5 text-[10px] font-semibold text-polks-success">
                          {t.status}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {expanded && t.items.length > 0 ? (
                    <div className="flex flex-col gap-1.5 border-t border-polks-border px-4 py-3">
                      {t.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-[12px]">
                          <span className="text-polks-muted">
                            {item.qty}x {item.name}
                          </span>
                          <span className="font-semibold text-polks-text">
                            {item.isReward ? "Gratis" : formatRupiah(item.lineTotal)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && entries.length < total ? (
          <div ref={sentinelRef} className="flex justify-center py-2">
            {loadingMore ? (
              <Icon name="refresh" className="size-5 animate-spin text-polks-muted" />
            ) : loadMoreFailed ? (
              <button
                type="button"
                onClick={() => {
                  setLoadMoreFailed(false);
                  loadMore();
                }}
                className="text-xs font-semibold text-polks-brand"
              >
                Gagal memuat, coba lagi
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </CustomerShell>
  );
}
```

- [ ] **Step 2: Verify filter + expand in the browser**

With `backend`/`frontend` dev servers running and logged in, open `http://localhost:3001/order-history`.
- If the member has orders from more than one outlet, click each filter chip and confirm the list narrows to matching orders only, and switching back to "Semua" restores the full list.
- Click an order card and confirm it expands to show its `items[]` (name, qty, price; reward items show "Gratis"). Click again to collapse.
- If the member has only orders from one (or zero) outlets, note this in your verification report instead of forcing a fake multi-outlet scenario.

- [ ] **Step 3: Verify infinite scroll (or document the limitation)**

Check how many `Transaction` rows the test member actually has:
Run: `cd backend && npx prisma studio` (or query via `psql`/Prisma Client) and count rows in `Transaction` for the test member.
- If there are more than 20 (`PAGE_SIZE`), scroll the `/order-history` list to the bottom in the browser and confirm more orders load automatically (network tab shows a second `GET /member/transactions?skip=20&take=20` call).
- If there are 20 or fewer, infinite scroll cannot be exercised with real data — state this explicitly in your verification report rather than fabricating a pass. Do not lower `PAGE_SIZE` in committed code just to force a demo.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/order-history/page.tsx
git commit -m "feat(order-history): add outlet filter, item expand, infinite scroll"
```

---

### Task 4: Dashboard — consolidate Kartu Member into Rewards, add Riwayat quick action

**Files:**
- Modify: `frontend/src/app/dashboard/page.tsx:6-8` (imports), `:141-156` (2 big action buttons), `:159-171` (4 quick actions)

**Interfaces:**
- Consumes: `/rewards` (existing route) and `/order-history` (from Task 2/3).
- Produces: no new exports; UI-only change.

- [ ] **Step 1: Update the icon imports**

In `frontend/src/app/dashboard/page.tsx`, replace lines 6-8:

```tsx
import {
  Bell, ChevronRight, Gift, Headphones, MapPin, QrCode, Star, Tag, Ticket,
} from "lucide-react";
```

with:

```tsx
import {
  Bell, ChevronRight, Gift, Headphones, History, MapPin, Star, Tag, Ticket,
} from "lucide-react";
```

- [ ] **Step 2: Replace the "Kartu Member" big button with "Rewards"**

Replace lines 141-156 (the "2 Big action buttons" block):

```tsx
          <div className="grid grid-cols-2 gap-2.5 px-4 pb-3">
            <Link
              href="/member-card"
              className="flex flex-col items-center gap-2 rounded-2xl bg-polks-brand px-3 py-4"
            >
              <QrCode size={22} className="text-white" strokeWidth={1.8} />
              <p className="text-[12px] font-bold text-white">Kartu Member</p>
            </Link>
            <Link
              href="/redeem-history"
              className="flex flex-col items-center gap-2 rounded-2xl bg-polks-surface px-3 py-4"
            >
              <Ticket size={22} className="text-polks-text" strokeWidth={1.8} />
              <p className="text-[12px] font-bold text-polks-text">Voucher Saya</p>
            </Link>
          </div>
```

with:

```tsx
          <div className="grid grid-cols-2 gap-2.5 px-4 pb-3">
            <Link
              href="/rewards"
              className="flex flex-col items-center gap-2 rounded-2xl bg-polks-brand px-3 py-4"
            >
              <Gift size={22} className="text-white" strokeWidth={1.8} />
              <p className="text-[12px] font-bold text-white">Rewards</p>
            </Link>
            <Link
              href="/redeem-history"
              className="flex flex-col items-center gap-2 rounded-2xl bg-polks-surface px-3 py-4"
            >
              <Ticket size={22} className="text-polks-text" strokeWidth={1.8} />
              <p className="text-[12px] font-bold text-polks-text">Voucher Saya</p>
            </Link>
          </div>
```

- [ ] **Step 3: Replace the "Rewards" quick action with "Riwayat"**

Replace lines 159-171 (the "4 Quick actions" block):

```tsx
          <div className="grid grid-cols-4 divide-x divide-polks-border border-y border-polks-border">
            {([
              { href: "/promos",  Icon: Tag,        label: "Promo"   },
              { href: "/rewards", Icon: Gift,       label: "Rewards" },
              { href: "/outlets", Icon: MapPin,     label: "Outlet"  },
              { href: "/help",    Icon: Headphones, label: "Bantuan" },
            ] as const).map(({ href, Icon, label }) => (
              <Link key={label} href={href} className="flex flex-col items-center gap-1.5 py-3">
                <Icon size={18} className="text-polks-text" strokeWidth={1.8} />
                <p className="text-[10px] font-semibold text-polks-text">{label}</p>
              </Link>
            ))}
          </div>
```

with:

```tsx
          <div className="grid grid-cols-4 divide-x divide-polks-border border-y border-polks-border">
            {([
              { href: "/promos",        Icon: Tag,        label: "Promo"   },
              { href: "/order-history", Icon: History,    label: "Riwayat" },
              { href: "/outlets",       Icon: MapPin,     label: "Outlet"  },
              { href: "/help",          Icon: Headphones, label: "Bantuan" },
            ] as const).map(({ href, Icon, label }) => (
              <Link key={label} href={href} className="flex flex-col items-center gap-1.5 py-3">
                <Icon size={18} className="text-polks-text" strokeWidth={1.8} />
                <p className="text-[10px] font-semibold text-polks-text">{label}</p>
              </Link>
            ))}
          </div>
```

- [ ] **Step 4: Verify in the browser**

Open `http://localhost:3001/dashboard` logged in.
Expected: the left big button now reads "Rewards" (Gift icon) and links to `/rewards` (hover/click to confirm); "Voucher Saya" unchanged. The quick-action grid reads Promo / Riwayat / Outlet / Bantuan, and clicking "Riwayat" navigates to `/order-history`. Confirm the bottom navbar's own "Card" tab still opens `/member-card` (unchanged) — this is how Kartu Member stays reachable.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/dashboard/page.tsx
git commit -m "feat(dashboard): consolidate Kartu Member into Rewards, add Riwayat quick action"
```

---

### Task 5: Profile — add "Riwayat Pesanan" menu item

**Files:**
- Modify: `frontend/src/app/profile/page.tsx:7-15` (imports), `:46-49` (Bantuan menu section)

**Interfaces:**
- Consumes: `/order-history` (from Task 2/3).
- Produces: no new exports; UI-only change.

- [ ] **Step 1: Add the `Receipt` icon import**

Replace lines 7-15:

```tsx
import {
  ChevronRight,
  User,
  Store,
  Bell,
  HelpCircle,
  LogOut,
  Shield,
} from "lucide-react";
```

with:

```tsx
import {
  ChevronRight,
  User,
  Store,
  Bell,
  HelpCircle,
  LogOut,
  Receipt,
  Shield,
} from "lucide-react";
```

- [ ] **Step 2: Add the menu item**

Replace lines 46-49:

```tsx
  {
    title: "Bantuan",
    items: [{ label: "Pusat Bantuan", Icon: HelpCircle, href: "/help" }],
  },
```

with:

```tsx
  {
    title: "Bantuan",
    items: [
      { label: "Riwayat Pesanan", Icon: Receipt, href: "/order-history" },
      { label: "Pusat Bantuan", Icon: HelpCircle, href: "/help" },
    ],
  },
```

- [ ] **Step 3: Verify in the browser**

Open `http://localhost:3001/profile` logged in.
Expected: the "Bantuan" section now shows "Riwayat Pesanan" (Receipt icon) above "Pusat Bantuan". Click it and confirm it navigates to `/order-history`.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/profile/page.tsx
git commit -m "feat(profile): add riwayat pesanan menu item"
```

---

### Task 6: End-to-end verification

**Files:** none (verification only)

**Interfaces:** none — this task confirms Tasks 1-5 work together.

- [ ] **Step 1: Full backend test suite**

Run: `cd backend && npx jest`
Expected: all suites pass, including the new `MemberService.getTransactions` tests from Task 1.

- [ ] **Step 2: Drive the full flow in a browser**

With both dev servers running and logged in as a member with at least one POS transaction:
1. From `/dashboard`, click the "Riwayat" quick action → lands on `/order-history` with real data (outlet name, price, payment method, points).
2. Click back → returns to `/dashboard` (not some other page — reuses the `router.back()` pattern already fixed on `/help`).
3. From `/profile`, click "Riwayat Pesanan" → lands on `/order-history`.
4. Click back → returns to `/profile`.
5. Expand one order card → item list with prices renders; reward items show "Gratis".
6. Confirm the dashboard's "Rewards" big button and bottom navbar's "Card" tab both still work as expected.

- [ ] **Step 3: Report results**

Summarize pass/fail for each of the above, plus anything unexpected (per the `verify` skill's reporting format) — including whether infinite scroll and multi-outlet filtering were actually exercised or only structurally verified due to limited test data.
