// Bentuk response asli dari backend NestJS (lihat backend/src/rewards).
// Dipisah dari mock-data agar halaman yang sudah real tidak ikut mock.

export type RewardType =
  | "DISCOUNT_AMOUNT"
  | "DISCOUNT_PERCENT"
  | "FREE_ITEM"
  | "MANUAL";

// Tag outlet — kosong/tidak ada berarti berlaku di semua outlet (informasi
// admin saja, belum ada filter otomatis di customer/POS).
export type OutletTag = { outlet: { id: string; name: string } };

export type Reward = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  pointCost: number;
  stock: number;
  status: "ACTIVE" | "INACTIVE";
  type: RewardType;
  value: number | null;
  freeItemName: string | null;
  createdAt: string;
  updatedAt: string;
  outlets?: OutletTag[];
};

// Hasil POST /rewards/:id/redeem
export type RedeemResult = {
  voucher: {
    id: string;
    code: string;
    status: string;
    expiredAt: string;
    reward: { id: string; name: string };
  };
  pointsSpent: number;
  pointBalance: number;
};

// Kunci sessionStorage untuk mengoper voucher hasil redeem ke /voucher-success.
export const LAST_REDEEM_KEY = "crm_last_redeem";

// Respons paginated standar backend (lihat member/admin service).
export type Paginated<T> = {
  total: number;
  skip: number;
  take: number;
  items: T[];
};

// Promo — GET /promos & /promos/:id
export type Promo = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  startAt: string | null;
  endAt: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
  outlets?: OutletTag[];
};

// Voucher milik member — GET /vouchers
export type Voucher = {
  id: string;
  code: string;
  status: "ACTIVE" | "USED" | "EXPIRED";
  expiredAt: string | null;
  usedAt?: string | null;
  createdAt: string;
  reward: { name: string; imageUrl: string | null };
};

// Entri ledger poin — GET /member/point-histories
export type PointHistory = {
  id: string;
  type: string; // earn | redeem | adjust | reverse
  points: number; // bertanda: + masuk, - keluar
  balanceAfter: number;
  referenceType: string | null;
  referenceId: string | null;
  note: string | null;
  createdAt: string;
};
