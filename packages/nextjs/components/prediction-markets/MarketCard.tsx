"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Sparklines, SparklinesLine } from 'react-sparklines';
import { formatTokenAmount, formatPercentage } from '../../utils/predictionMarkets';
import type { Market } from '../../hooks/useMarketStore';

interface MarketCardProps {
    market: Market;
    onClick?: () => void;
    historicalData?: number[];
}

export const MarketCard: React.FC<MarketCardProps> = ({
    market,
    onClick,
    historicalData = [45, 47, 46, 48, 50, 52, 51, 53, 55, 54]
}) => {
    // Calculate current probability
    const totalSupply = market.yesTokenReserve + market.noTokenReserve;
    const yesSold = totalSupply - market.yesTokenReserve;
    const noSold = totalSupply - market.noTokenReserve;
    const totalSold = yesSold + noSold;

    const yesProbability = totalSold > 0n
        ? (Number(yesSold) / Number(totalSold)) * 100
        : market.initialProbability;

    const noProbability = 100 - yesProbability;

    // Calculate total volume (simplified)
    const totalVolume = market.lpTradingRevenue;

    // Determine trend
    const isUpTrend = historicalData[historicalData.length - 1] > historicalData[0];

    return (
        <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className="card bg-base-200 hover:bg-base-300 shadow-lg hover:shadow-xl transition-all cursor-pointer border border-base-300"
            onClick={onClick}
        >
            <div className="card-body p-5">
                {/* Question */}
                <h3 className="card-title text-base font-bold text-base-content line-clamp-2 mb-3">
                    {market.question}
                </h3>

                {/* Probability Display */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-success">
                                {yesProbability.toFixed(0)}%
                            </span>
                            <span className="text-sm text-base-content/60">YES</span>
                        </div>
                    </div>
                    <div className="flex-1 text-right">
                        <div className="flex items-baseline gap-2 justify-end">
                            <span className="text-3xl font-bold text-error">
                                {noProbability.toFixed(0)}%
                            </span>
                            <span className="text-sm text-base-content/60">NO</span>
                        </div>
                    </div>
                </div>

                {/* Sparkline Chart */}
                <div className="mb-4 h-12">
                    <Sparklines data={historicalData} width={100} height={40}>
                        <SparklinesLine
                            color={isUpTrend ? "#10b981" : "#ef4444"}
                            style={{ strokeWidth: 2, fill: "none" }}
                        />
                    </Sparklines>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-base-300">
                    <div>
                        <p className="text-xs text-base-content/60 mb-1">Volume</p>
                        <p className="text-sm font-semibold text-base-content">
                            ${formatTokenAmount(totalVolume, 18, 2)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-base-content/60 mb-1">Liquidity</p>
                        <p className="text-sm font-semibold text-base-content">
                            ${formatTokenAmount(market.collateral, 18, 2)}
                        </p>
                    </div>
                </div>

                {/* Status Badge */}
                {market.isReported && (
                    <div className="absolute top-3 right-3">
                        <div className="badge badge-info badge-sm">Settled</div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
