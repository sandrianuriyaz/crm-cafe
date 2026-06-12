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
