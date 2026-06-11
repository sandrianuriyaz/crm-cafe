import { AdminShell } from "@/components/layout/admin-shell";
import { Icon } from "@/components/ui/icon";
import { StatCard } from "@/components/ui/stat-card";
import { adminStats, type AdminActivity } from "@/lib/loyalty/mock-data";
import { cn } from "@/lib/utils";

const ACTIVITY_STYLE: Record<
  AdminActivity["kind"],
  { icon: string; className: string; fill?: boolean }
> = {
  sync: { icon: "sync", className: "bg-blue-50 text-blue-600" },
  webhook: { icon: "webhook", className: "bg-purple-50 text-purple-600" },
  reward: { icon: "stars", className: "bg-soft-gold text-gold", fill: true },
  warning: { icon: "warning", className: "bg-red-50 text-red-600" },
};

export default function AdminDashboardPage() {
  const { cards, pointsFlow, recentActivity } = adminStats;

  // Drive bar heights from the sample data: each day's total (issued + redeemed)
  // as a percentage of the largest day's total.
  const maxTotal = Math.max(
    ...pointsFlow.days.map((d) => d.issued + d.redeemed),
  );

  return (
    <AdminShell title="Overview">
      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {cards.map((card) => (
          <StatCard
            key={card.label}
            title={card.label}
            value={card.value}
            iconName={card.icon}
            accent={card.icon === "stars" ? "gold" : "primary"}
            delta={card.trend}
            deltaTone={
              card.trend === "-" ? "neutral" : card.trendUp ? "up" : "down"
            }
          />
        ))}
      </div>

      {/* Charts & Activity Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Chart Area */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl border border-outline-variant/30 flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-bright">
            <h3 className="font-section-title text-section-title text-on-surface">
              Points Flow
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                className="px-3 py-1 text-xs font-body-semibold rounded-md bg-surface-container-highest text-on-surface-variant hover:bg-surface-dim transition-colors"
              >
                Week
              </button>
              <button
                type="button"
                className="px-3 py-1 text-xs font-body-semibold rounded-md bg-primary text-on-primary"
              >
                Month
              </button>
            </div>
          </div>
          <div className="p-6 flex-1 flex flex-col relative min-h-[300px]">
            {/* Legend / Summary */}
            <div className="flex gap-6 mb-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-primary mr-2" />
                <span className="font-caption text-caption text-on-surface-variant">
                  Issued ({pointsFlow.issuedTotalLabel})
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-gold mr-2" />
                <span className="font-caption text-caption text-on-surface-variant">
                  Redeemed ({pointsFlow.redeemedTotalLabel})
                </span>
              </div>
            </div>

            {/* CSS/HTML bar chart */}
            <div className="flex-1 flex items-end justify-between gap-2 mt-4">
              <div className="w-full flex justify-around items-end h-full relative border-b border-outline-variant/20 pb-2">
                {/* Y-Axis labels */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-on-surface-variant/50 -ml-2 -mt-2">
                  <span>1M</span>
                  <span>500k</span>
                  <span>0</span>
                </div>
                {pointsFlow.days.map((d) => {
                  const total = d.issued + d.redeemed;
                  const colHeight = (total / maxTotal) * 100;
                  const issuedPct = (d.issued / total) * 100;
                  const redeemedPct = (d.redeemed / total) * 100;
                  return (
                    <div
                      key={d.day}
                      className="w-8 flex flex-col justify-end space-y-1 group relative"
                      style={{ height: `${colHeight}%` }}
                    >
                      <div
                        className="w-full bg-gold rounded-sm hover:opacity-80 transition-opacity"
                        style={{ height: `${redeemedPct}%` }}
                      />
                      <div
                        className="w-full bg-primary rounded-sm hover:opacity-80 transition-opacity"
                        style={{ height: `${issuedPct}%` }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-around mt-2 text-xs text-on-surface-variant px-8">
              {pointsFlow.days.map((d) => (
                <span key={d.day}>{d.day}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity / System Status */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 flex flex-col overflow-hidden h-[400px]">
          <div className="px-6 py-4 border-b border-outline-variant/30 bg-surface-bright flex justify-between items-center">
            <h3 className="font-section-title text-section-title text-on-surface">
              System Activity
            </h3>
            <span className="flex items-center text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1 animate-pulse" />
              All Systems Op
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-0">
            <ul className="divide-y divide-outline-variant/20">
              {recentActivity.map((item) => {
                const style = ACTIVITY_STYLE[item.kind];
                return (
                  <li
                    key={item.id}
                    className="p-4 hover:bg-surface-container-low transition-colors flex gap-3"
                  >
                    <div
                      className={cn(
                        "mt-1 p-1.5 rounded-lg h-fit",
                        style.className,
                      )}
                    >
                      <Icon
                        name={style.icon}
                        className="size-4"
                        fill={style.fill}
                      />
                    </div>
                    <div>
                      <p className="font-body-semibold text-body-semibold text-on-surface">
                        {item.title}
                      </p>
                      <p className="font-caption text-caption text-on-surface-variant mt-0.5">
                        {item.description}
                      </p>
                      <p className="font-caption text-xs text-outline mt-1">
                        {item.time}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="p-3 border-t border-outline-variant/30 bg-surface-bright text-center">
            <a
              className="text-sm font-body-semibold text-primary hover:underline"
              href="#"
            >
              View All Logs
            </a>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
