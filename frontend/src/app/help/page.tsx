"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, MessageCircle, Mail } from "lucide-react";
import { CustomerShell } from "@/components/layout/customer-shell";

const faqs = [
  {
    q: "Bagaimana cara mengumpulkan poin?",
    a: "Tunjukkan QR member kamu ke kasir saat transaksi. Poin otomatis ditambahkan setelah kasir memindai QR melalui POS.",
  },
  {
    q: "Bagaimana cara menukar poin?",
    a: "Buka menu Reward, pilih reward yang diinginkan, lalu tukar. Voucher akan muncul dan bisa ditunjukkan ke kasir.",
  },
  {
    q: "Apakah poin bisa kedaluwarsa?",
    a: "Poin mengikuti kebijakan loyalty POLKS yang berlaku. Cek riwayat poin untuk detail mutasi kamu.",
  },
  {
    q: "Voucher saya tidak muncul, kenapa?",
    a: "Pastikan koneksi internet aktif lalu buka Riwayat Penukaran. Jika tetap tidak muncul, hubungi kami.",
  },
];

export default function HelpPage() {
  const router = useRouter();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <CustomerShell showHeader={false} showBottomNav={false} topbarRight={null}>
      <div className="bg-polks-brand px-5 pb-7 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Kembali"
          className="mb-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors active:bg-white/20"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-[22px] font-bold tracking-[-0.02em] text-white">Pusat Bantuan</h1>
        <p className="mt-1 text-[13px] text-white/50">Pertanyaan umum & cara menghubungi kami.</p>
      </div>

      <div className="bg-polks-brand leading-none">
        <svg viewBox="0 0 390 28" preserveAspectRatio="none" className="block h-7 w-full">
          <path d="M0,0 Q195,28 390,0 L390,28 L0,28 Z" fill="#F6F8FA" />
        </svg>
      </div>

      <div className="flex flex-col gap-5 bg-polks-bg px-5 pb-10">
        {/* FAQ */}
        <div>
          <p className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-[#8A959D]">
            Pertanyaan Umum
          </p>
          <div className="flex flex-col gap-2.5">
            {faqs.map((f, i) => {
              const isOpen = open === i;
              return (
                <div key={f.q} className="overflow-hidden rounded-2xl border border-polks-border bg-polks-card">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
                  >
                    <span className="text-[13px] font-semibold text-polks-text">{f.q}</span>
                    <ChevronDown
                      size={16}
                      className={"shrink-0 text-polks-muted transition-transform " + (isOpen ? "rotate-180" : "")}
                    />
                  </button>
                  {isOpen ? (
                    <p className="border-t border-polks-surface px-4 py-3 text-xs leading-relaxed text-polks-muted">
                      {f.a}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Kontak */}
        <div>
          <p className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-[#8A959D]">
            Hubungi Kami
          </p>
          <div className="flex flex-col gap-2.5">
            <a
              href="https://wa.me/6281200000000"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-polks-border bg-polks-card px-4 py-3.5"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#25D366]/10">
                <MessageCircle size={18} className="text-[#25D366]" />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-polks-text">WhatsApp</p>
                <p className="text-[11px] text-polks-muted">Balasan cepat di jam operasional</p>
              </div>
            </a>
            <a
              href="mailto:support@polksgroup.com"
              className="flex items-center gap-3 rounded-2xl border border-polks-border bg-polks-card px-4 py-3.5"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-polks-surface">
                <Mail size={18} className="text-polks-brand" />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-polks-text">Email</p>
                <p className="text-[11px] text-polks-muted">support@polksgroup.com</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </CustomerShell>
  );
}
