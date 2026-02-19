"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { formatTokenAmount, formatPercentage, shortenAddress } from '../../utils/predictionMarkets';
import type { Market } from '../../hooks/useMarketStore';

interface MarketStatsProps {
    market: Market;
}

export const MarketStats: React.FC<MarketStatsProps> = ({ market }) => {
    // Calculate stats
    const totalSupply = market.yesTokenReserve + market.noTokenReserve;
    const yesSold = totalSupply - market.yesTokenReserve;
    const noSold = totalSupply - market.noTokenReserve;
    const totalSold = yesSold + noSold;

    const yesProbability = totalSold > 0n
        ? (Number(yesSold) / Number(totalSold)) * 100
        : market.initialProbability;

    const stats = [
        {
            label: 'Total Volume',
            value: `$${formatTokenAmount(market.lpTradingRevenue, 18, 2)}`,
            icon: '📊',
        },
        {
            label: 'Liquidity',
            value: `$${formatTokenAmount(market.collateral, 18, 2)}`,
            icon: '💧',
        },
        {
            label: 'YES Tokens Sold',
            value: formatTokenAmount(yesSold, 18, 2),
            icon: '✅',
        },
        {
            label: 'NO Tokens Sold',
            value: formatTokenAmount(noSold, 18, 2),
            icon: '❌',
        },
        {
            label: 'YES Reserve',
            value: formatTokenAmount(market.yesTokenReserve, 18, 2),
            icon: '🟢',
        },
        {
            label: 'NO Reserve',
            value: formatTokenAmount(market.noTokenReserve, 18, 2),
            icon: '🔴',
        },
        {
            label: 'Initial Probability',
            value: formatPercentage(market.initialProbability),
            icon: '🎯',
        },
        {
            label: 'Locked Percentage',
            value: formatPercentage(market.percentageLocked),
            icon: '🔒',
        },
    ];

    return (
        <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
                <h3 className="card-title text-xl mb-4">Market Statistics</h3>

                <div className="grid grid-cols-2 gap-4">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-base-300 rounded-lg p-4"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">{stat.icon}</span>
                                <span className="text-xs text-base-content/60">{stat.label}</span>
                            </div>
                            <div className="text-lg font-bold text-base-content">{stat.value}</div>
                        </motion.div>
                    ))}
                </div>

                <div className="divider"></div>

                {/* Contract Info */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-base-content/60">Market Address</span>
                        <a
                            href={`https://etherscan.io/address/${market.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-mono link link-primary"
                        >
                            {shortenAddress(market.address)}
                        </a>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-base-content/60">YES Token</span>
                        <a
                            href={`https://etherscan.io/token/${market.yesToken}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-mono link link-success"
                        >
                            {shortenAddress(market.yesToken)}
                        </a>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-base-content/60">NO Token</span>
                        <a
                            href={`https://etherscan.io/token/${market.noToken}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-mono link link-error"
                        >
                            {shortenAddress(market.noToken)}
                        </a>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-base-content/60">Oracle</span>
                        <span className="text-sm font-mono text-base-content">
                            {shortenAddress(market.oracle)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-base-content/60">Owner</span>
                        <span className="text-sm font-mono text-base-content">
                            {shortenAddress(market.owner)}
                        </span>
                    </div>
                </div>

                {/* Status */}
                {market.isReported && (
                    <>
                        <div className="divider"></div>
                        <div className="alert alert-info">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <div>
                                <div className="font-bold">Market Settled</div>
                                <div className="text-sm">
                                    Winning token: {market.winningToken === market.yesToken ? 'YES' : 'NO'}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
