"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { formatTokenAmount } from '../../utils/predictionMarkets';

interface PositionCardProps {
    marketQuestion: string;
    yesBalance: bigint;
    noBalance: bigint;
    invested: bigint;
    currentValue: bigint;
    isSettled: boolean;
    winningOutcome?: 'YES' | 'NO';
    onRedeem?: () => Promise<void>;
}

export const PositionCard: React.FC<PositionCardProps> = ({
    marketQuestion,
    yesBalance,
    noBalance,
    invested,
    currentValue,
    isSettled,
    winningOutcome,
    onRedeem,
}) => {
    const totalBalance = yesBalance + noBalance;
    const pnl = currentValue - invested;
    const pnlPercentage = invested > 0n
        ? (Number(pnl) / Number(invested)) * 100
        : 0;

    const isProfitable = pnl > 0n;
    const hasWinningTokens = isSettled && (
        (winningOutcome === 'YES' && yesBalance > 0n) ||
        (winningOutcome === 'NO' && noBalance > 0n)
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card bg-base-200 shadow-lg hover:shadow-xl transition-shadow"
        >
            <div className="card-body">
                {/* Question */}
                <h3 className="text-sm font-semibold text-base-content line-clamp-2 mb-3">
                    {marketQuestion}
                </h3>

                {/* Holdings */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-success/10 rounded-lg p-3 border border-success/20">
                        <div className="text-xs text-success/70 mb-1">YES Tokens</div>
                        <div className="text-lg font-bold text-success">
                            {formatTokenAmount(yesBalance, 18, 2)}
                        </div>
                    </div>
                    <div className="bg-error/10 rounded-lg p-3 border border-error/20">
                        <div className="text-xs text-error/70 mb-1">NO Tokens</div>
                        <div className="text-lg font-bold text-error">
                            {formatTokenAmount(noBalance, 18, 2)}
                        </div>
                    </div>
                </div>

                {/* P&L */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-base-content/60">Invested</span>
                        <span className="text-sm font-medium text-base-content">
                            ${formatTokenAmount(invested, 18, 2)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-base-content/60">Current Value</span>
                        <span className="text-sm font-medium text-base-content">
                            ${formatTokenAmount(currentValue, 18, 2)}
                        </span>
                    </div>
                    <div className="divider my-2"></div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-base-content">P&L</span>
                        <div className="text-right">
                            <div className={`text-sm font-bold ${isProfitable ? 'text-success' : 'text-error'}`}>
                                {isProfitable ? '+' : ''}${formatTokenAmount(pnl, 18, 2)}
                            </div>
                            <div className={`text-xs ${isProfitable ? 'text-success' : 'text-error'}`}>
                                {isProfitable ? '+' : ''}{pnlPercentage.toFixed(2)}%
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                {hasWinningTokens && onRedeem && (
                    <button
                        className="btn btn-success btn-sm w-full mt-4"
                        onClick={onRedeem}
                    >
                        Redeem Winning Tokens
                    </button>
                )}

                {isSettled && !hasWinningTokens && totalBalance > 0n && (
                    <div className="alert alert-warning mt-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-xs">You hold losing tokens</span>
                    </div>
                )}

                {isSettled && (
                    <div className="badge badge-info badge-sm mt-2">
                        Settled: {winningOutcome} wins
                    </div>
                )}
            </div>
        </motion.div>
    );
};
