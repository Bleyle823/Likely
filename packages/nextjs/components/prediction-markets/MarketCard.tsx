"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparklines, SparklinesLine } from "react-sparklines";
import { formatTokenAmount } from "../../utils/predictionMarkets";
import type { Market } from "../../hooks/useMarketStore";

// Gradient colors for market card images - varied palette for visual appeal
const CARD_GRADIENTS = [
  "from-violet-500/80 via-purple-600/70 to-indigo-700/80",
  "from-emerald-500/80 via-teal-600/70 to-cyan-700/80",
  "from-amber-500/80 via-orange-600/70 to-rose-600/80",
  "from-blue-500/80 via-indigo-600/70 to-violet-700/80",
  "from-rose-500/80 via-pink-600/70 to-fuchsia-700/80",
  "from-cyan-500/80 via-sky-600/70 to-blue-700/80",
];

// Stable image per market using id hash
function getCardStyle(marketId: string) {
  const hash = marketId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const gradientIndex = Math.abs(hash) % CARD_GRADIENTS.length;
  return CARD_GRADIENTS[gradientIndex];
}

interface MarketCardProps {
  market: Market;
  onClick?: () => void;
  historicalData?: number[];
}

export const MarketCard: React.FC<MarketCardProps> = ({
  market,
  onClick,
  historicalData = [45, 47, 46, 48, 50, 52, 51, 53, 55, 54],
}) => {
  const totalSupply = market.yesTokenReserve + market.noTokenReserve;
  const yesSold = totalSupply - market.yesTokenReserve;
  const noSold = totalSupply - market.noTokenReserve;
  const totalSold = yesSold + noSold;

  const yesProbability =
    totalSold > 0n ? (Number(yesSold) / Number(totalSold)) * 100 : market.initialProbability;
  const noProbability = 100 - yesProbability;

  const totalVolume = market.lpTradingRevenue;
  const isUpTrend = historicalData[historicalData.length - 1] > historicalData[0];
  const gradientClass = getCardStyle(market.id);

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -6 }}
      whileTap={{ scale: 0.98 }}
      className="card bg-base-100 border border-base-300 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden group"
      onClick={onClick}
    >
      {/* Image / Hero Section */}
      <div
        className={`relative h-32 sm:h-36 w-full bg-gradient-to-br ${gradientClass} overflow-hidden`}
      >
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors" />
        {/* Decorative pattern overlay */}
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: "24px 24px",
            }}
          />
        </div>
        {/* Market icon/text overlay */}
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
          <span className="text-white/90 text-xs font-medium uppercase tracking-wider drop-shadow-sm">
            Prediction Market
          </span>
          {market.isReported && (
            <span className="badge badge-sm bg-white/20 text-white border-0 backdrop-blur-sm">
              Settled
            </span>
          )}
        </div>
      </div>

      <div className="card-body p-5">
        {/* Question */}
        <h3 className="card-title text-base font-bold text-base-content line-clamp-2 mb-4 min-h-10">
          {market.question}
        </h3>

        {/* Probability Display - prominent */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-success shrink-0" />
            <div>
              <p className="text-2xl font-bold text-success">{yesProbability.toFixed(0)}%</p>
              <p className="text-xs text-base-content/60">YES</p>
            </div>
          </div>
          <div className="divider divider-horizontal m-0 px-0 text-base-content/30">vs</div>
          <div className="flex-1 flex items-center gap-2 justify-end">
            <div className="w-2.5 h-2.5 rounded-full bg-error shrink-0" />
            <div className="text-right">
              <p className="text-2xl font-bold text-error">{noProbability.toFixed(0)}%</p>
              <p className="text-xs text-base-content/60">NO</p>
            </div>
          </div>
        </div>

        {/* Sparkline Chart */}
        <div className="mb-4 h-10 -mx-1">
          <Sparklines data={historicalData} width={100} height={36}>
            <SparklinesLine
              color={isUpTrend ? "#34eeb6" : "#ff8863"}
              style={{ strokeWidth: 2, fill: "none" }}
            />
          </Sparklines>
        </div>

        {/* Stats Row */}
        <div className="flex justify-between items-center pt-3 border-t border-base-300">
          <div>
            <p className="text-xs text-base-content/60 mb-0.5">Volume</p>
            <p className="text-sm font-semibold text-base-content">
              ${formatTokenAmount(totalVolume, 18, 2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-base-content/60 mb-0.5">Liquidity</p>
            <p className="text-sm font-semibold text-base-content">
              ${formatTokenAmount(market.collateral, 18, 2)}
            </p>
          </div>
        </div>

        {/* Trade CTA hint */}
        <div className="mt-3">
          <span className="text-xs text-primary font-medium">View & Trade →</span>
        </div>
      </div>
    </motion.div>
  );
};
