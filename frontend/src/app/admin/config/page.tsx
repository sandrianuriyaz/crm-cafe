"use client";

import { useState } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { loyaltyConfig, type PointExpiryRule } from "@/lib/loyalty/mock-data";

export default function AdminLoyaltyConfigPage() {
  const [rupiahPerPoint, setRupiahPerPoint] = useState(
    loyaltyConfig.baseConversion.rupiahPerPoint.toLocaleString("id-ID"),
  );
  const [pointsPerUnit, setPointsPerUnit] = useState(
    String(loyaltyConfig.baseConversion.pointsPerUnit),
  );
  const [pointExpiry, setPointExpiry] = useState<PointExpiryRule>(
    loyaltyConfig.pointExpiry,
  );
  const [webhookUrl, setWebhookUrl] = useState<string>(
    loyaltyConfig.developerApi.webhookUrl,
  );
  const [hmacSecret] = useState<string>(loyaltyConfig.developerApi.hmacSecret);
  const [requireIdempotencyKeys, setRequireIdempotencyKeys] = useState<boolean>(
    loyaltyConfig.developerApi.requireIdempotencyKeys,
  );

  return (
    <AdminShell title="Loyalty Config">
      <p className="font-body text-body text-on-surface-variant -mt-2">
        Manage global point rules, tier thresholds, and developer API settings.
      </p>

      {/* Main Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Left Column: Business Logic */}
        <div className="lg:col-span-2 flex flex-col gap-lg">
          {/* Point Calculation Rules */}
          <section className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl overflow-hidden">
            <div className="px-lg py-md border-b border-outline-variant/50 flex justify-between items-center bg-surface-bright">
              <h2 className="font-card-title text-card-title text-on-surface flex items-center gap-2">
                <Icon name="stars" className="size-5 text-primary" fill />
                Point Calculation
              </h2>
              <span className="bg-soft-gold text-gold font-caption text-caption px-2 py-1 rounded-full font-bold">
                Active
              </span>
            </div>
            <div className="p-lg space-y-6">
              {/* Base Rate */}
              <div>
                <label className="block font-caption text-caption text-on-surface-variant mb-2">
                  Base Conversion Rate
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                      <span className="text-on-surface-variant font-body">
                        Rp
                      </span>
                    </div>
                    <Input
                      value={rupiahPerPoint}
                      onChange={(e) => setRupiahPerPoint(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <span className="font-body-semibold text-body-semibold text-on-surface-variant">
                    =
                  </span>
                  <div className="flex-1 relative">
                    <Input
                      value={pointsPerUnit}
                      onChange={(e) => setPointsPerUnit(e.target.value)}
                      className="text-right pr-8"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-on-surface-variant font-body text-sm">
                        pt
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mt-2 font-caption text-caption text-on-surface-variant">
                  Rp {rupiahPerPoint} spent = {pointsPerUnit} point(s).
                </p>
              </div>

              {/* Expiry */}
              <div>
                <label
                  htmlFor="point-expiry"
                  className="block font-caption text-caption text-on-surface-variant mb-2"
                >
                  Point Expiry Rule
                </label>
                <div className="relative">
                  <select
                    id="point-expiry"
                    value={pointExpiry}
                    onChange={(e) =>
                      setPointExpiry(e.target.value as PointExpiryRule)
                    }
                    className="h-12 w-full pl-3 pr-10 border border-outline-variant/50 rounded-lg bg-surface-container-lowest text-on-surface font-body text-body outline-none appearance-none transition-all"
                  >
                    {loyaltyConfig.pointExpiryOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <Icon
                    name="expand_more"
                    className="absolute right-3 top-1/2 size-5 -translate-y-1/2 text-outline pointer-events-none"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Tier Thresholds */}
          <section className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl overflow-hidden">
            <div className="px-lg py-md border-b border-outline-variant/50 bg-surface-bright">
              <h2 className="font-card-title text-card-title text-on-surface flex items-center gap-2">
                <Icon name="military_tech" className="size-5 text-primary" fill />
                Tier Thresholds
              </h2>
            </div>
            <div className="p-0">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/50">
                    <th className="px-lg py-3 font-caption text-caption text-on-surface-variant uppercase tracking-wider">
                      Tier Level
                    </th>
                    <th className="px-lg py-3 font-caption text-caption text-on-surface-variant uppercase tracking-wider">
                      Points Required
                    </th>
                    <th className="px-lg py-3 font-caption text-caption text-on-surface-variant uppercase tracking-wider text-right">
                      Multiplier
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {loyaltyConfig.tierThresholds.map((tier) => (
                    <tr
                      key={tier.level}
                      className="hover:bg-surface-bright transition-colors"
                    >
                      <td className="px-lg py-4 font-body-semibold text-body-semibold text-on-surface">
                        {tier.level}
                      </td>
                      <td className="px-lg py-4 font-body text-body text-on-surface-variant">
                        {tier.pointsRequired.toLocaleString("en-US")}
                      </td>
                      <td className="px-lg py-4 font-body text-body text-on-surface text-right">
                        {tier.multiplier.toFixed(1)}x
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-lg py-3 bg-surface-bright border-t border-outline-variant/50">
              <button
                type="button"
                className="text-primary font-body-semibold text-body-semibold hover:text-primary-fixed transition-colors flex items-center gap-1"
              >
                <Icon name="add" className="size-[18px]" />
                Add Tier
              </button>
            </div>
          </section>
        </div>

        {/* Right Column: Developer / Technical */}
        <div className="flex flex-col gap-lg">
          {/* Webhooks & API */}
          <section className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl overflow-hidden shadow-sm">
            <div className="px-lg py-md border-b border-outline-variant/50 bg-deep-navy text-white">
              <h2 className="font-card-title text-card-title flex items-center gap-2">
                <Icon name="terminal" className="size-5" />
                Developer API
              </h2>
            </div>
            <div className="p-lg space-y-6">
              {/* Webhook URL */}
              <div>
                <label
                  htmlFor="webhook-url"
                  className="block font-caption text-caption text-on-surface-variant mb-2"
                >
                  POS Webhook URL
                </label>
                <div className="flex rounded-lg shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-outline-variant bg-surface-container-low text-on-surface-variant font-body text-sm">
                    POST
                  </span>
                  <input
                    id="webhook-url"
                    type="text"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="flex-1 block w-full px-3 py-2 border border-outline-variant rounded-none rounded-r-lg bg-surface-container-lowest text-on-surface outline-none transition-all font-body text-sm font-mono"
                  />
                </div>
              </div>

              {/* HMAC Secret */}
              <div>
                <div className="flex justify-between mb-2">
                  <label
                    htmlFor="hmac-secret"
                    className="block font-caption text-caption text-on-surface-variant"
                  >
                    HMAC Secret
                  </label>
                  <button
                    type="button"
                    className="text-primary hover:underline font-caption text-caption"
                  >
                    Rotate
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="hmac-secret"
                    type="text"
                    readOnly
                    value={hmacSecret}
                    className="block w-full px-3 py-2 pr-10 border border-outline-variant rounded-lg bg-surface-container-low text-on-surface-variant outline-none transition-all font-mono text-sm"
                  />
                  <button
                    type="button"
                    aria-label="Copy secret"
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-on-surface-variant hover:text-on-surface"
                  >
                    <Icon name="content_copy" className="size-[18px]" />
                  </button>
                </div>
                <p className="mt-2 font-caption text-caption text-on-surface-variant">
                  Used to verify webhook payloads.
                </p>
              </div>

              <hr className="border-outline-variant/50" />

              {/* Idempotency */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="idempotency-toggle"
                    className="font-body-semibold text-body-semibold text-on-surface"
                  >
                    Require Idempotency Keys
                  </label>
                  <button
                    id="idempotency-toggle"
                    type="button"
                    role="switch"
                    aria-checked={requireIdempotencyKeys}
                    onClick={() => setRequireIdempotencyKeys((v) => !v)}
                    className={`${
                      requireIdempotencyKeys
                        ? "bg-primary"
                        : "bg-surface-container-highest"
                    } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
                  >
                    <span
                      className={`${
                        requireIdempotencyKeys
                          ? "translate-x-5"
                          : "translate-x-0"
                      } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>
                <p className="font-caption text-caption text-on-surface-variant">
                  Enforce `Idempotency-Key` headers on all point creation
                  requests to prevent double-crediting.
                </p>
              </div>
            </div>
          </section>

          {/* Save Actions */}
          <div className="flex gap-4 justify-end mt-4">
            <button
              type="button"
              className="px-6 py-2 rounded-lg font-body-semibold text-body-semibold bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors border border-outline-variant"
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-6 py-2 rounded-lg font-body-semibold text-body-semibold bg-primary text-white hover:bg-primary-container transition-colors shadow-sm"
            >
              Save Config
            </button>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
