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

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
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

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<AuthResponse>("/auth/login", {
      method: "POST",
      auth: false,
      body: { email, password },
    });
    setToken(res.access_token);
    setUser(res.user);
  }, []);

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
      value={{ user, loading, login, register, logout, refreshProfile }}
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
