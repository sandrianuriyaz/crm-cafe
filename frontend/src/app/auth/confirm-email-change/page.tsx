"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { api } from "@/lib/api";

type State = "loading" | "success" | "error";

function ConfirmEmailChangeContent() {
  const params = useSearchParams();
  const token  = params.get("token") ?? "";
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    if (!token) { setState("error"); return; }
    api("/auth/email-change/confirm", {
      method: "POST",
      body: { token },
    })
      .then(() => setState("success"))
      .catch(() => setState("error"));
  }, [token]);

  if (state === "loading") {
    return (
      <div className="flex flex-col items-center gap-3 px-8 pt-10 text-center">
        <div className="skeleton size-16 rounded-full" />
        <p className="text-[14px] text-polks-muted">Mengonfirmasi email baru…</p>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="flex flex-col items-center gap-5 px-8 pt-10 text-center">
        <CheckCircle2 size={64} className="text-green-500" strokeWidth={1.5} />
        <div>
          <p className="text-[20px] font-bold text-polks-text">Email berhasil diperbarui!</p>
          <p className="mt-2 text-[13px] leading-relaxed text-polks-muted">
            Login berikutnya pakai email baru ini.
          </p>
        </div>
        <Link
          href="/profile/account"
          className="flex h-14 w-full items-center justify-center rounded-2xl bg-polks-brand text-[15px] font-bold text-white"
        >
          Ke Informasi Akun
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 px-8 pt-10 text-center">
      <XCircle size={64} className="text-polks-error" strokeWidth={1.5} />
      <div>
        <p className="text-[20px] font-bold text-polks-text">Konfirmasi gagal</p>
        <p className="mt-2 text-[13px] leading-relaxed text-polks-muted">
          Tautan sudah kedaluwarsa, tidak valid, atau perubahan sudah dibatalkan. Minta ulang dari halaman Informasi Akun.
        </p>
      </div>
      <Link
        href="/profile/account"
        className="flex h-14 w-full items-center justify-center rounded-2xl bg-polks-brand text-[15px] font-bold text-white"
      >
        Ke Informasi Akun
      </Link>
    </div>
  );
}

export default function ConfirmEmailChangePage() {
  return (
    <main className="flex min-h-screen justify-center bg-polks-card font-body text-polks-text md:bg-transparent">
      <div className="polks-phone flex min-h-screen w-full flex-col bg-polks-card">
        <Suspense>
          <ConfirmEmailChangeContent />
        </Suspense>
      </div>
    </main>
  );
}
