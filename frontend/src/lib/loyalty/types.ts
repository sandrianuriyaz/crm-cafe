// Bentuk response asli dari backend NestJS (lihat backend/src/rewards).
// Dipisah dari mock-data agar halaman yang sudah real tidak ikut mock.

export type Reward = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  pointCost: number;
  stock: number;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
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
