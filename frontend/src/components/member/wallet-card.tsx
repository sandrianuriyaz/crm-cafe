import { QrCode } from "lucide-react";

type WalletCardProps = {
  tier: string;
  points: number;
  memberId: string;
};

export function WalletCard({ tier, points, memberId }: WalletCardProps) {
  return (
    <section
      aria-label="Kartu loyalty member"
      className="relative overflow-hidden rounded-[20px] bg-primary p-4 text-primary-foreground shadow-[0px_8px_20px_rgba(43,23,18,0.2)]"
    >
      {/* Decorative element */}
      <div className="pointer-events-none absolute -right-6 -top-16 size-32 rounded-full bg-white/5" />

      <div className="relative z-10 flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-cream-text">{tier}</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold tracking-tight">
              {points.toLocaleString("id-ID")}
            </span>
            <span className="text-sm text-cream-text">pts</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="flex size-12 items-center justify-center rounded-lg bg-white p-1">
            <QrCode className="size-8 text-primary" aria-hidden="true" />
          </div>
          <span className="text-xs text-cream-text">Member QR</span>
        </div>
      </div>

      <div className="relative z-10 mt-3 border-t border-cream-text/20 pt-3">
        <span className="text-xs uppercase tracking-widest text-cream-text">
          ID: {memberId}
        </span>
      </div>
    </section>
  );
}
