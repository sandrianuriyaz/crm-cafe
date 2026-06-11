import { CustomerShell } from "@/components/layout/customer-shell";
import { Icon } from "@/components/ui/icon";
import { pointSummary, transactions } from "@/lib/loyalty/mock-data";

export default function HistoryPage() {
  return (
    <CustomerShell maxWidth="max-w-5xl">
      {/* Header Section */}
      <div className="mb-lg">
        <h1 className="font-page-title text-page-title text-on-surface mb-2">
          Transaction History
        </h1>
        <p className="font-body text-body text-on-surface-variant">
          Review all recent transactions and point allocations.
        </p>
      </div>

      {/* Point Summary Bento Box */}
      <div className="mb-lg grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex flex-col justify-between">
          <div>
            <h3 className="font-card-title text-card-title text-on-surface mb-1">
              {pointSummary.totalEarnedLabel}
            </h3>
            <p className="font-caption text-caption text-on-surface-variant">
              {pointSummary.totalEarnedSubtitle}
            </p>
          </div>
          <div className="mt-6 flex items-end gap-3">
            <span className="text-4xl font-bold tracking-tight text-primary">
              {pointSummary.totalEarned.toLocaleString("id-ID")}
            </span>
            <span className="font-body-semibold text-body-semibold text-primary pb-1">
              pts
            </span>
          </div>
        </div>

        <div className="col-span-1 bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all" />
          <div>
            <h3 className="font-card-title text-card-title text-on-surface mb-1">
              Quick Actions
            </h3>
            <p className="font-caption text-caption text-on-surface-variant mb-4">
              Manage sync status
            </p>
          </div>
          <button className="w-full py-2 px-4 bg-primary text-on-primary rounded-lg font-body-semibold text-body-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
            <Icon name="sync" className="text-[18px] size-[18px]" />
            Sync All Now
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
          <h3 className="font-section-title text-section-title text-on-surface">
            Recent Transactions
          </h3>
          <div className="flex gap-2">
            <button className="p-2 rounded hover:bg-surface-variant transition-colors text-on-surface-variant">
              <Icon name="filter_list" className="text-[20px] size-5" />
            </button>
          </div>
        </div>

        <div className="divide-y divide-outline-variant">
          {transactions.map((trx) => {
            const isEarn = trx.type === "earn";
            const pointsLabel = `${isEarn ? "+" : "-"}${Math.abs(
              trx.points
            ).toLocaleString("id-ID")} pts`;

            const statusStyle =
              trx.status === "success"
                ? "bg-success-container text-on-success-container"
                : trx.status === "failed"
                  ? "bg-error-container text-on-error-container"
                  : "bg-surface-container-high text-on-surface-variant";
            const statusIcon =
              trx.status === "success"
                ? "check_circle"
                : trx.status === "failed"
                  ? "error"
                  : "sync";
            const statusLabel =
              trx.status === "success"
                ? "Success"
                : trx.status === "failed"
                  ? "Failed"
                  : "Pending";

            return (
              <div
                key={trx.id}
                className="p-4 hover:bg-surface-container-low transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary">
                      <Icon name={isEarn ? "storefront" : "card_giftcard"} />
                    </div>
                    <div>
                      <h4 className="font-body-semibold text-body-semibold text-on-surface">
                        {trx.outlet}
                      </h4>
                      <p className="font-caption text-caption text-on-surface-variant">
                        Order #{trx.orderNumber} • {trx.date}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-body-semibold text-body-semibold text-on-surface">
                      {trx.amount}
                    </div>
                    <div
                      className={
                        "font-caption text-caption " +
                        (isEarn ? "text-on-success-container" : "text-error")
                      }
                    >
                      {pointsLabel}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 ml-[52px]">
                  <span
                    className={
                      "inline-flex items-center gap-1 px-2 py-1 rounded font-label-xs text-label-xs " +
                      statusStyle
                    }
                  >
                    <Icon name={statusIcon} className="text-[14px] size-[14px]" />
                    {statusLabel}
                  </span>
                  {trx.synced ? (
                    <span className="font-caption text-caption text-on-surface-variant flex items-center gap-1">
                      <Icon name="cloud_done" className="text-[14px] size-[14px]" />
                      Synced
                    </span>
                  ) : (
                    <span className="font-caption text-caption text-on-surface-variant flex items-center gap-1">
                      <Icon name="sync" className="text-[14px] size-[14px]" />
                      Syncing
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-outline-variant text-center">
          <button className="font-body-semibold text-body-semibold text-primary hover:underline">
            View All Transactions
          </button>
        </div>
      </div>
    </CustomerShell>
  );
}
