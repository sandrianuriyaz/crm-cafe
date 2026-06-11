import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type WalletCardProps = {
  points: number;
  tier: string;
  memberId: string;
  className?: string;
};

export function WalletCard({ points, tier, memberId, className }: WalletCardProps) {
  return (
    <div
      className={cn(
        "bg-deep-navy rounded-3xl p-6 relative overflow-hidden shadow-2xl",
        className
      )}
    >
      {/* Decorative subtle circle */}
      <div className="absolute -top-16 -right-16 w-64 h-64 bg-white opacity-5 rounded-full blur-2xl" />
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="font-caption text-caption text-secondary-fixed-dim mb-1 uppercase tracking-wider">
            Available Balance
          </p>
          <h3 className="text-[36px] leading-[40px] font-bold text-gold tracking-tight mb-4 flex items-center gap-2">
            {points.toLocaleString("id-ID")}{" "}
            <span className="text-[18px] font-medium text-soft-gold opacity-80 mt-2">pts</span>
          </h3>
          <div className="inline-flex items-center bg-soft-gold/10 px-3 py-1.5 rounded-full border border-soft-gold/20">
            <Icon name="stars" fill className="text-[16px] text-gold mr-2 size-4" />
            <span className="font-caption text-caption text-soft-gold">{tier}</span>
          </div>
        </div>
        {/* Mini QR Preview */}
        <div className="bg-white p-2 rounded-xl flex items-center justify-center shadow-lg border border-white/20">
          <Icon name="qr_code_2" className="text-[40px] text-on-background size-10" />
        </div>
      </div>
      <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center relative z-10">
        <div>
          <p className="font-caption text-caption text-secondary-fixed-dim mb-0.5">Member ID</p>
          <p className="font-body-semibold text-body-semibold text-white tracking-widest">
            {memberId}
          </p>
        </div>
        <button
          type="button"
          aria-label="Salin Member ID"
          className="text-white hover:text-gold transition-colors"
        >
          <Icon name="content_copy" className="size-6" />
        </button>
      </div>
    </div>
  );
}
