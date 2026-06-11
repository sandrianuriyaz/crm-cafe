export type RewardCategory = "all" | "drinks" | "pastry" | "voucher";

export const member = {
  name: "Sandria",
  tier: "Gold Tier Member",
  memberId: "POLKS-8492-331",
  points: 1250,
  validAt: "Valid at all POLKS GROUP outlets",
};

export const promos = [
  {
    id: "kopi-susu",
    label: "Promo",
    title: "Diskon Kopi Susu 20%",
    description: "Enjoy our signature Kopi Susu at a special price today.",
    endsAt: "Ends today at 23:59",
  },
];

export const locations = [
  { id: "senopati", name: "POLKS Cafe A", address: "Senopati, Jakarta Selatan" },
  { id: "kemang", name: "POLKS Cafe B", address: "Kemang, Jakarta Selatan" },
  { id: "menteng", name: "POLKS Cafe C", address: "Menteng, Jakarta Pusat" },
];

export const rewards = [
  {
    id: "americano",
    title: "Free Americano",
    points: 500,
    category: "drinks" as RewardCategory,
    availability: "All Outlets",
    visual: "coffee",
  },
  {
    id: "croissant",
    title: "Free Croissant",
    points: 650,
    category: "pastry" as RewardCategory,
    availability: "Selected Only",
    visual: "pastry",
  },
];

export const vouchers = [
  {
    id: "voucher-25",
    title: "Discount Voucher",
    value: "Rp25k",
    points: 1000,
    validUntil: "Valid until 31 Jul 2026",
  },
  {
    id: "voucher-50",
    title: "Discount Voucher",
    value: "Rp50k",
    points: 1800,
    validUntil: "Valid until 31 Aug 2026",
  },
];

/* ===========================================================================
 * Customer: Transaction History (mockup 06-transaction-history.html)
 * ======================================================================== */

export type TransactionType = "earn" | "redeem";

export type Transaction = {
  id: string;
  /** POS order number, e.g. "TRX-001" */
  orderNumber: string;
  /** Outlet / venue name shown as the row title */
  outlet: string;
  /** Human-readable date label, e.g. "Today, 14:30" */
  date: string;
  /** Formatted amount, e.g. "Rp55.000" */
  amount: string;
  /** Points earned (+) or redeemed (-) */
  points: number;
  type: TransactionType;
  /** Sync/processing status of the transaction */
  status: "success" | "pending" | "failed";
  synced: boolean;
};

export const transactions: Transaction[] = [
  {
    id: "trx-001",
    orderNumber: "TRX-001",
    outlet: "Cafe A",
    date: "Today, 14:30",
    amount: "Rp55.000",
    points: 55,
    type: "earn",
    status: "success",
    synced: true,
  },
  {
    id: "trx-002",
    orderNumber: "TRX-002",
    outlet: "Cafe B",
    date: "Yesterday, 09:15",
    amount: "Rp38.000",
    points: 38,
    type: "earn",
    status: "success",
    synced: true,
  },
];

/** Point summary numbers shown on the history page (mockup 06). */
export const pointSummary = {
  totalEarnedLabel: "Total Points Earned",
  totalEarnedSubtitle: "Lifetime accumulation across all venues",
  totalEarned: 1250,
} as const;

/* ===========================================================================
 * Admin: Overview Dashboard (mockup 07-admin-dashboard.html)
 * ======================================================================== */

export type AdminStatCard = {
  label: string;
  value: string;
  /** Trend delta label, e.g. "12%", "2", or "-" when no trend */
  trend: string;
  trendUp: boolean;
  icon: string;
};

export type AdminActivity = {
  id: string;
  title: string;
  description: string;
  time: string;
  /** Visual kind, drives icon/accent color in the UI */
  kind: "sync" | "webhook" | "reward" | "warning";
};

export const adminStats = {
  cards: [
    {
      label: "Total Members",
      value: "124,592",
      trend: "12%",
      trendUp: true,
      icon: "group",
    },
    {
      label: "Active Outlets",
      value: "84",
      trend: "2",
      trendUp: true,
      icon: "storefront",
    },
    {
      label: "Total Points (Circ)",
      value: "8.4M",
      trend: "-",
      trendUp: false,
      icon: "stars",
    },
    {
      label: "Transactions (24h)",
      value: "3,204",
      trend: "5%",
      trendUp: true,
      icon: "receipt_long",
    },
  ] as AdminStatCard[],
  /** "Points Flow" chart sample data (Issued vs Redeemed, per day). */
  pointsFlow: {
    issuedTotalLabel: "4.2M",
    redeemedTotalLabel: "1.1M",
    days: [
      { day: "Mon", issued: 75, redeemed: 25 },
      { day: "Tue", issued: 80, redeemed: 20 },
      { day: "Wed", issued: 67, redeemed: 33 },
      { day: "Thu", issued: 85, redeemed: 15 },
      { day: "Fri", issued: 75, redeemed: 25 },
      { day: "Sat", issued: 80, redeemed: 20 },
      { day: "Sun", issued: 80, redeemed: 20 },
    ],
  },
  recentActivity: [
    {
      id: "act-1",
      title: "POS Sync Completed",
      description: "Outlet #42 (Downtown) synced 142 transactions.",
      time: "Just now",
      kind: "sync",
    },
    {
      id: "act-2",
      title: "Webhook: member.created",
      description: "New registration via App.",
      time: "2 mins ago",
      kind: "webhook",
    },
    {
      id: "act-3",
      title: "Reward Redeemed",
      description: "Free Coffee claimed at Outlet #12.",
      time: "15 mins ago",
      kind: "reward",
    },
    {
      id: "act-4",
      title: "Webhook Delivery Failed",
      description: "Endpoint timeout on transaction.updated.",
      time: "1 hr ago",
      kind: "warning",
    },
  ] as AdminActivity[],
};

/* ===========================================================================
 * Admin: Member Management (mockup 10-admin-member-management.html)
 * ======================================================================== */

export type MemberTier = "Gold" | "Silver" | "Base";
export type MemberStatus = "active" | "inactive";

export type AdminMember = {
  id: string;
  name: string;
  email: string;
  /** Initials shown in the avatar bubble */
  initials: string;
  memberCode: string;
  points: number;
  tier: MemberTier;
  lastVisit: string;
  status: MemberStatus;
};

export const adminMembers: AdminMember[] = [
  {
    id: "mem-sarah",
    name: "Sarah Jenkins",
    email: "sarah.j@example.com",
    initials: "SJ",
    memberCode: "PG-8472-A",
    points: 12450,
    tier: "Gold",
    lastVisit: "Oct 12, 2023",
    status: "active",
  },
  {
    id: "mem-michael",
    name: "Michael Ross",
    email: "m.ross@company.com",
    initials: "MR",
    memberCode: "PG-3921-B",
    points: 3200,
    tier: "Silver",
    lastVisit: "Sep 28, 2023",
    status: "active",
  },
  {
    id: "mem-emily",
    name: "Emily Chen",
    email: "emily.c@example.com",
    initials: "EL",
    memberCode: "PG-1055-C",
    points: 450,
    tier: "Base",
    lastVisit: "Oct 14, 2023",
    status: "inactive",
  },
];

/* ===========================================================================
 * Admin: POS Transactions (mockup 09-admin-pos-transactions.html)
 * ======================================================================== */

export type PosTransactionStatus = "synced" | "pending" | "failed";

export type PosTransaction = {
  id: string;
  /** Transaction ID, e.g. "TXN-88219" */
  transactionId: string;
  outlet: string;
  /** Member ID, or "Guest" for non-members */
  memberId: string;
  /** Formatted amount, e.g. "Rp145.000" */
  amount: string;
  /** Points awarded, or null when N/A (e.g. guest checkout) */
  points: number | null;
  status: PosTransactionStatus;
  /** Whether the HMAC signature was verified */
  hmacVerified: boolean;
  date: string;
};

export const posTransactions: PosTransaction[] = [
  {
    id: "pos-88219",
    transactionId: "TXN-88219",
    outlet: "Downtown Flagship",
    memberId: "MEM-4091",
    amount: "Rp145.000",
    points: 145,
    status: "synced",
    hmacVerified: true,
    date: "Oct 24, 14:30",
  },
  {
    id: "pos-88218",
    transactionId: "TXN-88218",
    outlet: "Westside Mall",
    memberId: "MEM-1102",
    amount: "Rp89.000",
    points: 89,
    status: "synced",
    hmacVerified: true,
    date: "Oct 24, 14:15",
  },
  {
    id: "pos-88217",
    transactionId: "TXN-88217",
    outlet: "Downtown Flagship",
    memberId: "Guest",
    amount: "Rp32.000",
    points: null,
    status: "pending",
    hmacVerified: false,
    date: "Oct 24, 13:50",
  },
  {
    id: "pos-88216",
    transactionId: "TXN-88216",
    outlet: "Airport Terminal B",
    memberId: "MEM-9921",
    amount: "Rp210.750",
    points: 210,
    status: "failed",
    hmacVerified: false,
    date: "Oct 24, 12:05",
  },
];

/* ===========================================================================
 * Admin: Loyalty Config defaults (mockup 11-admin-loyalty-config.html)
 * ======================================================================== */

export type PointExpiryRule = "12m" | "6m" | "end_of_year" | "never";

export type TierThreshold = {
  level: string;
  pointsRequired: number;
  multiplier: number;
};

export const loyaltyConfig = {
  /** Base conversion: Rp <rupiahPerPoint> = <pointsPerUnit> pt */
  baseConversion: {
    rupiahPerPoint: 1000,
    pointsPerUnit: 1,
  },
  pointExpiry: "12m" as PointExpiryRule,
  pointExpiryOptions: [
    { value: "12m", label: "12 Months from earning date" },
    { value: "6m", label: "6 Months from earning date" },
    { value: "end_of_year", label: "End of Calendar Year" },
    { value: "never", label: "Never Expire" },
  ] as { value: PointExpiryRule; label: string }[],
  tierThresholds: [
    { level: "Member", pointsRequired: 0, multiplier: 1.0 },
    { level: "Silver", pointsRequired: 10000, multiplier: 1.2 },
    { level: "Gold", pointsRequired: 50000, multiplier: 1.5 },
  ] as TierThreshold[],
  developerApi: {
    webhookUrl: "https://api.polksgroup.com/v1/pos/events",
    hmacSecret: "set-in-environment",
    requireIdempotencyKeys: true,
  },
} as const;
