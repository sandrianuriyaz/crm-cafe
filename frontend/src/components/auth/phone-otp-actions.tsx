"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Smartphone } from "lucide-react";
import { requestOtp } from "@/lib/api";
import { saveOtpSession } from "@/lib/otp-session";

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function PhoneOtpActions({
  mode,
}: {
  mode: "login" | "register";
}) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const waLabel =
    mode === "register" ? "Daftar dengan WhatsApp" : "Lanjut dengan WhatsApp";
  const smsLabel = mode === "register" ? "Daftar dengan SMS" : "Lanjut dengan SMS";

  async function onWhatsApp() {
    const trimmed = phone.trim();
    if (!trimmed) {
      setError("Masukkan nomor HP terlebih dahulu.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await requestOtp(trimmed, "whatsapp");
      saveOtpSession(trimmed, "whatsapp");
      router.push("/verify-account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim OTP.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Input nomor HP */}
      <div>
        <label
          htmlFor="phone"
          className="mb-2 block text-[13px] font-semibold text-polks-text"
        >
          Nomor HP
        </label>
        <input
          id="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="0812 3456 7890"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) onWhatsApp();
          }}
          disabled={loading}
          className="h-14 w-full rounded-2xl border-[1.5px] border-polks-border bg-polks-bg px-4 text-[15px] font-medium text-polks-text outline-none transition-colors focus:border-polks-brand disabled:opacity-60"
        />
        {error && (
          <p className="mt-2 text-[12px] font-medium text-red-600">{error}</p>
        )}
      </div>

      {/* WhatsApp (aktif) */}
      <button
        type="button"
        onClick={onWhatsApp}
        disabled={loading}
        className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] text-[15px] font-bold text-white shadow-[0_4px_16px_rgba(37,211,102,0.35)] disabled:opacity-60"
      >
        <WhatsAppIcon />
        {loading ? "Mengirim kode…" : waLabel}
      </button>

      {/* SMS (sementara dinonaktifkan — backend belum punya nomor SMS) */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          disabled
          aria-disabled
          className="flex h-14 w-full cursor-not-allowed items-center justify-center gap-2.5 rounded-2xl border-[1.5px] border-polks-border bg-polks-bg text-[15px] font-semibold text-polks-muted opacity-60"
        >
          <Smartphone size={18} color="#66737D" />
          {smsLabel}
        </button>
        <span className="mt-1.5 text-[11px] text-[#C0CBD3]">
          SMS segera hadir
        </span>
      </div>
    </div>
  );
}
