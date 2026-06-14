import Link from "next/link";
import Image from "next/image";
import { CustomerShell } from "@/components/layout/customer-shell";
import { Icon } from "@/components/ui/icon";
import { locations, promos, rewards } from "@/lib/loyalty/mock-data";

const steps = [
  { icon: "shopping_bag", text: "Pesan di kasir / POS" },
  { icon: "qr_code_2", text: "Tunjukkan QR member" },
  { icon: "document_scanner", text: "Kasir scan QR" },
  { icon: "sync_alt", text: "POS kirim transaksi ke CRM" },
  { icon: "stars", text: "POLKS tambahkan poin resmi" },
  { icon: "redeem", text: "Tukar poin dengan reward" },
] as const;

export default function GuestHomePage() {
  return (
    <CustomerShell
      showHeader={false}
      showBottomNav={false}
      topbarRight={null}
    >
      <section className="bg-polks-brand px-5 pb-2 pt-4 text-white md:px-8 md:pb-10 lg:px-12">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Image
            src="/polks/logo.png"
            alt="POLKS"
            width={96}
            height={44}
            className="h-9 w-auto"
            priority
          />
          <div className="flex gap-2">
            <Link
              href="/login"
              className="inline-flex h-8 items-center rounded-lg border border-white/30 px-3 text-xs font-semibold text-white"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="inline-flex h-8 items-center rounded-lg bg-polks-smile px-3 text-xs font-semibold text-white"
            >
              Register
            </Link>
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl gap-8 pb-2 pt-7 md:grid-cols-[1.05fr_0.95fr] md:items-center md:pb-8 md:pt-14">
          <div className="flex flex-col gap-5">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-polks-smile/40 bg-polks-smile/15 px-3 py-1.5">
            <Icon name="group" className="size-3 text-polks-smile" />
            <span className="text-[11px] font-bold text-polks-smile">
              POLKS Loyalty Program
            </span>
          </div>

          <div>
            <h1 className="text-[30px] font-black leading-[1.15] text-white md:text-5xl lg:text-6xl">
              Kumpulkan poin
              <br />
              <span className="text-polks-point">dari setiap</span>
              <br />
              kunjungan.
            </h1>
            <p className="mt-3 max-w-xl text-[13px] leading-6 text-white/60 md:text-base md:leading-8">
              Tunjukkan QR member ke kasir, dapatkan poin resmi, dan tukarkan
              dengan reward di semua outlet POLKS.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-polks-smile px-5 text-sm font-semibold text-white"
            >
              Daftar Gratis
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-[13px] font-semibold text-white"
            >
              <Icon name="qr_code_2" className="size-4" />
              Member Card
            </Link>
          </div>

          <div className="flex gap-3">
            {[
              { value: "3", label: "Outlet", icon: "storefront" },
              { value: "5K+", label: "Member", icon: "group" },
              { value: "100K+", label: "Poin Terbit", icon: "stars" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl border border-white/10 bg-white/[0.07] py-3"
              >
                <Icon name={stat.icon} className="size-3 text-white/35" />
                <span className="text-[17px] font-black text-polks-point">
                  {stat.value}
                </span>
                <span className="text-[9px] font-semibold text-white/45">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
          </div>

          <div className="hidden md:block">
            <div className="relative overflow-hidden rounded-[28px] border border-white/12 bg-white/8 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
              <div className="absolute -right-12 -top-12 size-40 rounded-full bg-polks-smile/15" />
              <div className="relative rounded-2xl bg-white p-5 text-polks-text">
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-polks-muted">Saldo Poin</p>
                    <p className="mt-1 text-4xl font-black text-polks-brand">1.250</p>
                  </div>
                  <span className="rounded-full bg-polks-point-soft px-3 py-1 text-xs font-bold text-amber-800">
                    Gold
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {rewards.slice(0, 2).map((reward) => (
                    <div key={reward.id} className="rounded-2xl border border-polks-border p-4">
                      <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-polks-point-soft">
                        <Icon name="redeem" className="size-5 text-polks-point" />
                      </div>
                      <h3 className="text-sm font-bold">{reward.title}</h3>
                      <p className="mt-2 text-xs font-semibold text-amber-800">
                        {reward.points} pts
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-polks-brand leading-none">
        <svg viewBox="0 0 390 28" preserveAspectRatio="none" className="polks-wave">
          <path d="M0,0 Q195,28 390,0 L390,28 L0,28 Z" fill="#F6F8FA" />
        </svg>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 bg-polks-bg px-5 pb-10 md:grid md:grid-cols-2 md:gap-6 md:px-8 md:py-10 lg:grid-cols-3 lg:px-0">
        <section className="md:col-span-2 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-polks-text">Promo Aktif</h2>
            <Link href="/login" className="flex items-center text-xs font-semibold text-polks-smile">
              Lihat Semua <Icon name="chevron_right" className="size-3" />
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {promos.map((promo) => (
              <article
                key={promo.id}
                className="rounded-2xl border border-polks-border bg-white p-4"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h3 className="text-sm font-bold text-polks-text">{promo.title}</h3>
                  <span className="rounded-full bg-polks-smile-soft px-2.5 py-1 text-[10px] font-bold text-polks-smile">
                    Aktif
                  </span>
                </div>
                <p className="mb-3 text-xs leading-5 text-polks-muted">
                  {promo.description}
                </p>
                <div className="flex items-center justify-between text-[11px] text-polks-muted">
                  <span className="flex items-center gap-1">
                    <Icon name="location_on" className="size-3" />
                    All Outlets
                  </span>
                  <span>{promo.endsAt}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-polks-text">Reward Catalog</h2>
            <Link href="/login" className="flex items-center text-xs font-semibold text-polks-smile">
              Lihat Semua <Icon name="chevron_right" className="size-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {rewards.slice(0, 2).map((reward) => (
              <Link
                href="/login"
                key={reward.id}
                className="flex-1 rounded-2xl border border-polks-border bg-white p-4"
              >
                <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-polks-point-soft">
                  <Icon name="redeem" className="size-5 text-polks-point" />
                </div>
                <h3 className="mb-2 text-[13px] font-bold text-polks-text">
                  {reward.title}
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-polks-point-soft px-2.5 py-1 text-xs font-bold text-amber-800">
                  <Icon name="stars" fill className="size-3 text-polks-point" />
                  {reward.points} pts
                </span>
                <p className="mt-2 text-[10px] text-polks-muted">
                  {reward.availability}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-polks-border bg-white p-5 lg:col-span-2">
          <h2 className="mb-4 text-[15px] font-bold text-polks-text">Cara Kerjanya</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {steps.map((step, index) => (
              <div key={step.text} className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-polks-surface">
                  <Icon
                    name={step.icon}
                    className={index === 4 ? "size-4 text-polks-point" : "size-4 text-polks-brand"}
                  />
                </div>
                <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-polks-brand text-[9px] font-bold text-white">
                  {index + 1}
                </span>
                <p className="text-[13px] font-medium text-polks-text">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-[15px] font-bold text-polks-text">Lokasi Outlet</h2>
          <div className="flex flex-col gap-2">
            {locations.map((location) => (
              <div
                key={location.id}
                className="flex items-center justify-between rounded-2xl border border-polks-border bg-white p-4"
              >
                <div>
                  <h3 className="text-sm font-bold text-polks-text">{location.name}</h3>
                  <p className="text-xs text-polks-muted">{location.address}</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600">
                  Open
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </CustomerShell>
  );
}
