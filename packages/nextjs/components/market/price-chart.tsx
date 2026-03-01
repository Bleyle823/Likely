"use client";

/**
 * Price Chart Component (Polymarket-style)
 *
 * Two-line chart showing Yes and No probabilities over time.
 * - Blue line for Yes, Red line for No
 * - Legend at top left with current percentages
 * - Prominent end dots on each line
 * - 0–100% Y-axis
 */

import { useMemo, useState } from "react";
import { Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~~/components/ui/chart";
import { cn } from "~~/lib/utils";
import { formatChartDate, formatTooltipDate, formatPricePercent } from "~~/lib/formatters";
import type { Outcome } from "~~/lib/types";

type TimeFrame = "24h" | "7d" | "30d" | "all";

interface PriceChartProps {
  outcomes: Outcome[];
  selectedOutcomeId?: number;
  showLegend?: boolean;
  marketState?: "open" | "resolved" | "closed";
  resolvedOutcomeId?: number | null;
}

const YES_COLOR = "#00a3ff";
const NO_COLOR = "#ff4467";

export function PriceChart({
  outcomes,
  selectedOutcomeId = 0,
  showLegend = true,
  marketState = "open",
  resolvedOutcomeId,
}: PriceChartProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("all");

  const yesOutcomeIdx = outcomes.findIndex((o) => o.title.toUpperCase() === "YES" || o.id === 0);
  const noOutcomeIdx = outcomes.findIndex((o) => o.title.toUpperCase() === "NO" || o.id === 1);

  const yesOutcome = yesOutcomeIdx !== -1 ? outcomes[yesOutcomeIdx] : outcomes[0];
  const noOutcome = noOutcomeIdx !== -1 ? outcomes[noOutcomeIdx] : outcomes[1];

  const chartConfig = useMemo<ChartConfig>(
    () => ({
      yes: { label: yesOutcome?.title || "Yes", color: YES_COLOR },
      no: { label: noOutcome?.title || "No", color: NO_COLOR },
    }),
    [yesOutcome, noOutcome]
  );

  const chartData = useMemo(() => {
    const priceCharts = yesOutcome?.priceCharts ?? (yesOutcome as any)?.priceCharts;
    if (!priceCharts || !Array.isArray(priceCharts)) return [];

    const timeframeData = priceCharts.find((c: any) => c.timeframe === timeFrame);
    if (!timeframeData?.prices) return [];

    return timeframeData.prices.map((p: any) => ({
      timestamp: p.timestamp,
      yes: p.value,
      no: 1 - p.value,
    }));
  }, [yesOutcome, timeFrame]);

  const hasData = chartData.length > 0;

  const formatLegendPercent = (p: number) =>
    p >= 0.995 ? "100.0%" : p <= 0.005 ? "<1%" : formatPricePercent(p);

  return (
    <div className="space-y-4">
      {/* Legend and Logo Section (Polymarket-style) */}
      <div className="flex flex-wrap items-start justify-between">
        {showLegend && outcomes.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: YES_COLOR }}
              />
              <span className="text-sm font-semibold text-base-content/90">
                {yesOutcome?.title || "Yes"} {formatLegendPercent(yesOutcome?.price ?? 0)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: NO_COLOR }}
              />
              <span className="text-sm font-semibold text-base-content/90">
                {noOutcome?.title || "No"} {formatLegendPercent(noOutcome?.price ?? 0)}
              </span>
            </div>
          </div>
        )}
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-1 opacity-40 select-none hidden sm:flex">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-base-content">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="font-bold text-lg tracking-tight text-base-content">Likely</span>
          </div>
          <div className="flex rounded-lg bg-base-300 p-0.5">
            {(["24h", "7d", "30d", "all"] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeFrame(tf)}
                className={cn(
                  "px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all",
                  timeFrame === tf
                    ? "bg-base-100 text-base-content shadow-sm"
                    : "text-base-content/40 hover:text-base-content/60"
                )}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {hasData ? (
        <ChartContainer
          config={chartConfig}
          className="h-[280px] w-full"
        >
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <CartesianGrid
              strokeDasharray="2 4"
              vertical={false}
              stroke="rgba(128,128,128,0.15)"
            />
            <XAxis
              dataKey="timestamp"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              minTickGap={60}
              tickFormatter={(v) => formatChartDate(v, timeFrame)}
              stroke="rgba(128,128,128,0.5)"
              fontSize={10}
              fontWeight={500}
            />
            <YAxis
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v) => `${Math.round(v * 100)}%`}
              domain={[0, 1]}
              stroke="rgba(128,128,128,0.5)"
              fontSize={10}
              fontWeight={500}
              width={40}
              ticks={[0, 0.2, 0.4, 0.6, 0.8, 1]}
            />
            <ChartTooltip
              cursor={{ stroke: "rgba(128,128,128,0.3)", strokeDasharray: "4 4" }}
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    const items = payload as Array<{ payload?: { timestamp?: number } }>;
                    const ts = items?.[0]?.payload?.timestamp;
                    return ts ? formatTooltipDate(ts) : "";
                  }}
                  indicator="dot"
                  formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                  className="bg-base-100 border-base-300 shadow-2xl"
                />
              }
            />
            <Line
              type="monotone"
              dataKey="yes"
              name={yesOutcome?.title || "Yes"}
              stroke={YES_COLOR}
              strokeWidth={3}
              strokeLinecap="round"
              filter="url(#glow)"
              dot={(props) => {
                const { cx, cy, index } = props;
                if (index === chartData.length - 1 && cx != null && cy != null) {
                  return (
                    <g>
                      <circle cx={cx} cy={cy} r={8} fill={YES_COLOR} opacity={0.3} />
                      <circle
                        cx={cx}
                        cy={cy}
                        r={5}
                        fill={YES_COLOR}
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    </g>
                  );
                }
                return null;
              }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: YES_COLOR, fill: "#fff" }}
              connectNulls
              isAnimationActive={true}
            />
            <Line
              type="monotone"
              dataKey="no"
              name={noOutcome?.title || "No"}
              stroke={NO_COLOR}
              strokeWidth={3}
              strokeLinecap="round"
              filter="url(#glow)"
              dot={(props) => {
                const { cx, cy, index } = props;
                if (index === chartData.length - 1 && cx != null && cy != null) {
                  return (
                    <g>
                      <circle cx={cx} cy={cy} r={8} fill={NO_COLOR} opacity={0.3} />
                      <circle
                        cx={cx}
                        cy={cy}
                        r={5}
                        fill={NO_COLOR}
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    </g>
                  );
                }
                return null;
              }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: NO_COLOR, fill: "#fff" }}
              connectNulls
              isAnimationActive={true}
            />
          </LineChart>
        </ChartContainer>
      ) : (
        <div className="flex h-[280px] items-center justify-center rounded-xl border border-dashed border-base-300 bg-base-200/30 text-base-content/40 text-sm font-medium">
          No price data available for this timeframe
        </div>
      )}
    </div>
  );
}