"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, clearToken, getToken, setToken } from "./api";
import { type Tier, type NextTier } from "./loyalty/tier";

export type AuthUser = {
  id: string;
  email: string;
  role: string;
  name: string;
  memberCode: string | null;
  pointBalance: number | null;
  // Tier dihitung backend dari belanja bulan ini (lihat /member/profile).
  tier?: Tier;
  monthlySpend?: number;
  nextTier?: NextTier;
};

// Bentuk respons /member/profile yang dipakai untuk melengkapi AuthUser.
type MemberProfile = {
  name: string;
  memberCode: string;
  pointBalance: number;
  tier?: Tier;
  monthlySpend?: number;
  nextTier?: NextTier;
};

type AuthResponse = { access_token: string; user: AuthUser };
// Login bisa berhenti di tengah kalau akun pakai 2FA: backend balas tiket,
// bukan access_token. Frontend lanjut minta kode TOTP lalu /auth/2fa/login.
type LoginResponse = AuthResponse | { twoFactorRequired: true; twoFactorToken: string };
export type LoginResult =
  | { status: "ok" }
  | { status: "2fa"; twoFactorToken: string };

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  // Tahap kedua login 2FA: tukar tiket + kode TOTP jadi sesi penuh.
  loginTwoFactor: (twoFactorToken: string, code: string) => Promise<void>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => void;
  // Ambil ulang profil member (mis. setelah redeem agar saldo poin terbaru).
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Saat mount: kalau ada token, ambil identitas dari /auth/me.
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api<{ id: string; email: string; role: string }>("/auth/me")
      .then((me) =>
        // /auth/me hanya kirim id/email/role; lengkapi profil dari /member.
        api<MemberProfile>("/member/profile")
          .then((p) =>
            setUser({
              ...me,
              name: p.name,
              memberCode: p.memberCode,
              pointBalance: p.pointBalance,
              tier: p.tier,
              monthlySpend: p.monthlySpend,
              nextTier: p.nextTier,
            }),
          )
          .catch(() =>
            setUser({ ...me, name: "", memberCode: null, pointBalance: null }),
          ),
      )
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      const res = await api<LoginResponse>("/auth/login", {
        method: "POST",
        auth: false,
        body: { email, password },
      });
      if ("twoFactorRequired" in res) {
        return { status: "2fa", twoFactorToken: res.twoFactorToken };
      }
      setToken(res.access_token);
      setUser(res.user);
      // Lengkapi profil (tier, nextTier, monthlySpend) yang tidak ada di JWT
      api<MemberProfile>("/member/profile")
        .then((p) => setUser((prev) => prev ? { ...prev, name: p.name, memberCode: p.memberCode, pointBalance: p.pointBalance, tier: p.tier, monthlySpend: p.monthlySpend, nextTier: p.nextTier } : prev))
        .catch(() => {});
      return { status: "ok" };
    },
    [],
  );

  const loginTwoFactor = useCallback(
    async (twoFactorToken: string, code: string) => {
      const res = await api<AuthResponse>("/auth/2fa/login", {
        method: "POST",
        auth: false,
        body: { twoFactorToken, code },
      });
      setToken(res.access_token);
      setUser(res.user);
      api<MemberProfile>("/member/profile")
        .then((p) => setUser((prev) => prev ? { ...prev, name: p.name, memberCode: p.memberCode, pointBalance: p.pointBalance, tier: p.tier, monthlySpend: p.monthlySpend, nextTier: p.nextTier } : prev))
        .catch(() => {});
    },
    [],
  );

  const register = useCallback(
    async (input: {
      name: string;
      email: string;
      password: string;
      phone?: string;
    }) => {
      const res = await api<AuthResponse>("/auth/register", {
        method: "POST",
        auth: false,
        body: input,
      });
      setToken(res.access_token);
      setUser(res.user);
      api<MemberProfile>("/member/profile")
        .then((p) => setUser((prev) => prev ? { ...prev, name: p.name, memberCode: p.memberCode, pointBalance: p.pointBalance, tier: p.tier, monthlySpend: p.monthlySpend, nextTier: p.nextTier } : prev))
        .catch(() => {});
    },
    [],
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  // Sinkron ulang profil (name/memberCode/pointBalance) dari /member/profile.
  const refreshProfile = useCallback(async () => {
    if (!getToken()) return;
    try {
      const p = await api<MemberProfile>("/member/profile");
      setUser((prev) =>
        prev
          ? {
              ...prev,
              name: p.name,
              memberCode: p.memberCode,
              pointBalance: p.pointBalance,
              tier: p.tier,
              monthlySpend: p.monthlySpend,
              nextTier: p.nextTier,
            }
          : prev,
      );
    } catch {
      // Diamkan: gagal refresh tidak boleh mengganggu alur halaman.
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, loginTwoFactor, register, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus di dalam <AuthProvider>");
  return ctx;
}
