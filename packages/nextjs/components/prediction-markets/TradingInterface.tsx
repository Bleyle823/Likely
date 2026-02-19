"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { formatTokenAmount, calculateBuyPrice, calculateSellPrice, calculatePriceImpact } from '../../utils/predictionMarkets';
import { parseUnits } from 'viem';

interface TradingInterfaceProps {
    marketAddress: string;
    yesTokenReserve: bigint;
    noTokenReserve: bigint;
    totalSupply: bigint;
    initialTokenValue: bigint;
    userYesBalance?: bigint;
    userNoBalance?: bigint;
    onTrade?: (outcome: 'YES' | 'NO', type: 'BUY' | 'SELL', amount: bigint) => Promise<void>;
}

export const TradingInterface: React.FC<TradingInterfaceProps> = ({
    marketAddress,
    yesTokenReserve,
    noTokenReserve,
    totalSupply,
    initialTokenValue,
    userYesBalance = 0n,
    userNoBalance = 0n,
    onTrade,
}) => {
    const [selectedOutcome, setSelectedOutcome] = useState<'YES' | 'NO'>('YES');
    const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Calculate price and impact
    const amountBigInt = amount ? parseUnits(amount, 18) : 0n;
    const price = tradeType === 'BUY'
        ? calculateBuyPrice(selectedOutcome, amountBigInt, yesTokenReserve, noTokenReserve, totalSupply, initialTokenValue)
        : calculateSellPrice(selectedOutcome, amountBigInt, yesTokenReserve, noTokenReserve, totalSupply, initialTokenValue);

    const priceImpact = calculatePriceImpact(selectedOutcome, amountBigInt, yesTokenReserve, noTokenReserve, totalSupply);

    // Calculate current probability
    const yesSold = totalSupply - yesTokenReserve;
    const noSold = totalSupply - noTokenReserve;
    const totalSold = yesSold + noSold;
    const yesProbability = totalSold > 0n ? (Number(yesSold) / Number(totalSold)) * 100 : 50;
    const noProbability = 100 - yesProbability;

    const currentProbability = selectedOutcome === 'YES' ? yesProbability : noProbability;

    const handleTrade = async () => {
        if (!amount || !onTrade || amountBigInt === 0n) return;

        setIsLoading(true);
        try {
            await onTrade(selectedOutcome, tradeType, amountBigInt);
            setAmount('');
        } catch (error) {
            console.error('Trade failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const maxBalance = tradeType === 'SELL'
        ? (selectedOutcome === 'YES' ? userYesBalance : userNoBalance)
        : 0n;

    return (
        <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
                <h3 className="card-title text-xl mb-4">Trade</h3>

                {/* Buy/Sell Toggle */}
                <div className="tabs tabs-boxed mb-4">
                    <a
                        className={`tab tab-lg flex-1 ${tradeType === 'BUY' ? 'tab-active' : ''}`}
                        onClick={() => setTradeType('BUY')}
                    >
                        Buy
                    </a>
                    <a
                        className={`tab tab-lg flex-1 ${tradeType === 'SELL' ? 'tab-active' : ''}`}
                        onClick={() => setTradeType('SELL')}
                    >
                        Sell
                    </a>
                </div>

                {/* Outcome Selection */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`btn ${selectedOutcome === 'YES' ? 'btn-success' : 'btn-outline btn-success'} h-auto py-4`}
                        onClick={() => setSelectedOutcome('YES')}
                    >
                        <div className="text-left w-full">
                            <div className="text-xs opacity-70 mb-1">YES</div>
                            <div className="text-2xl font-bold">{yesProbability.toFixed(1)}%</div>
                        </div>
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`btn ${selectedOutcome === 'NO' ? 'btn-error' : 'btn-outline btn-error'} h-auto py-4`}
                        onClick={() => setSelectedOutcome('NO')}
                    >
                        <div className="text-left w-full">
                            <div className="text-xs opacity-70 mb-1">NO</div>
                            <div className="text-2xl font-bold">{noProbability.toFixed(1)}%</div>
                        </div>
                    </motion.button>
                </div>

                {/* Amount Input */}
                <div className="form-control mb-4">
                    <label className="label">
                        <span className="label-text">Amount</span>
                        {tradeType === 'SELL' && (
                            <span className="label-text-alt">
                                Balance: {formatTokenAmount(maxBalance, 18, 4)}
                            </span>
                        )}
                    </label>
                    <div className="input-group">
                        <input
                            type="number"
                            placeholder="0.00"
                            className="input input-bordered w-full"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min="0"
                            step="0.01"
                        />
                        <span className="bg-base-300 px-4 flex items-center">
                            {selectedOutcome}
                        </span>
                    </div>
                    {tradeType === 'SELL' && maxBalance > 0n && (
                        <label className="label">
                            <span className="label-text-alt"></span>
                            <button
                                className="label-text-alt link link-primary"
                                onClick={() => setAmount(formatTokenAmount(maxBalance, 18, 18))}
                            >
                                Max
                            </button>
                        </label>
                    )}
                </div>

                {/* Price Display */}
                {amount && amountBigInt > 0n && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-base-300 rounded-lg p-4 mb-4 space-y-2"
                    >
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-base-content/60">
                                {tradeType === 'BUY' ? 'You pay' : 'You receive'}
                            </span>
                            <span className="text-lg font-bold text-base-content">
                                ${formatTokenAmount(price, 18, 4)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-base-content/60">Average price</span>
                            <span className="text-sm font-medium text-base-content">
                                ${formatTokenAmount(price / amountBigInt, 0, 4)} per token
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-base-content/60">Price impact</span>
                            <span className={`text-sm font-medium ${priceImpact > 5 ? 'text-warning' : 'text-base-content'}`}>
                                {priceImpact.toFixed(2)}%
                            </span>
                        </div>
                    </motion.div>
                )}

                {/* Price Impact Warning */}
                {priceImpact > 5 && amount && (
                    <div className="alert alert-warning mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-sm">High price impact! Consider reducing your trade size.</span>
                    </div>
                )}

                {/* Trade Button */}
                <button
                    className={`btn btn-lg w-full ${selectedOutcome === 'YES' ? 'btn-success' : 'btn-error'
                        } ${isLoading ? 'loading' : ''}`}
                    onClick={handleTrade}
                    disabled={!amount || amountBigInt === 0n || isLoading}
                >
                    {isLoading ? 'Processing...' : `${tradeType} ${selectedOutcome}`}
                </button>

                {/* Info */}
                <div className="text-xs text-base-content/60 text-center mt-2">
                    {tradeType === 'BUY'
                        ? 'You will receive outcome tokens that can be redeemed for $1 each if you win'
                        : 'You will receive payment tokens based on current market probability'
                    }
                </div>
            </div>
        </div>
    );
};
