"use client";

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, ShareIcon, InformationCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { TradingInterface } from '~~/components/prediction-markets/TradingInterface';
import { ProbabilityChart } from '~~/components/markets/probability-chart';
import { usePredictionMarket } from '~~/hooks/usePredictionMarket';
import { useMarketStore } from '~~/hooks/useMarketStore';
import { useScaffoldEventHistory } from '~~/hooks/scaffold-eth';
import { useAccount } from 'wagmi';
import { formatUnits, parseEther } from 'viem';

export default function MarketDetailPage() {
    const params = useParams();
    const router = useRouter();
    const marketId = params.id as string;
    const { isConnected } = useAccount();
    const { markets } = useMarketStore();
    const {
        buyTokens,
        sellTokens,
        requestSettlement,
        redeemWinningTokens,
        isLoading: isActionLoading,
        yesBalance,
        noBalance,
    } = usePredictionMarket();

    const storeMarket = markets.find(m => m.id === marketId) || (markets.length > 0 ? markets[0] : null);

    const { data: purchaseEvents } = useScaffoldEventHistory({
        contractName: "PredictionMarket",
        eventName: "TokensPurchased",
        fromBlock: 0n,
        blockData: true,
    });

    const { data: saleEvents } = useScaffoldEventHistory({
        contractName: "PredictionMarket",
        eventName: "TokensSold",
        fromBlock: 0n,
        blockData: true,
    });

    // Reconstruct historical probability data
    const chartData = useMemo(() => {
        if (!storeMarket) return [];

        const allEvents: any[] = [
            ...(purchaseEvents || []).map(e => ({ ...e, type: 'BUY' })),
            ...(saleEvents || []).map(e => ({ ...e, type: 'SELL' })),
        ];

        const sortedEvents = allEvents.sort((a, b) => {
            if (a.blockNumber !== b.blockNumber) {
                return Number(a.blockNumber - b.blockNumber);
            }
            return Number(a.transactionIndex - b.transactionIndex);
        });

        const initialYesTokens = storeMarket.initialTokenValue * BigInt(storeMarket.initialProbability) / 100n;
        const initialTotalTokens = storeMarket.initialTokenValue;

        let currentYesTokens = initialYesTokens;
        let currentTotalTokens = initialTotalTokens;

        const history: { timestamp: number, value: number }[] = [];

        // Add initial point (7 days ago)
        const startTime = Math.floor(Date.now() / 1000) - 7 * 24 * 3600;
        history.push({
            timestamp: startTime,
            value: Number(initialYesTokens) / Number(initialTotalTokens)
        });

        sortedEvents.forEach(event => {
            const outcome = Number(event.args.outcome);
            const amount = event.args.amount as bigint;
            const isBuy = event.type === 'BUY';

            if (outcome === 0) { // YES
                currentYesTokens = isBuy ? currentYesTokens + amount : currentYesTokens - amount;
            }
            currentTotalTokens = isBuy ? currentTotalTokens + amount : currentTotalTokens - amount;

            const timestamp = Number(event.blockData?.timestamp || 0n);
            if (timestamp > 0) {
                history.push({
                    timestamp,
                    value: currentTotalTokens > 0n ? Number(currentYesTokens) / Number(currentTotalTokens) : 0.5 // Fallback to 0.5 if total tokens become 0
                });
            }
        });

        // Add current point
        history.push({
            timestamp: Math.floor(Date.now() / 1000),
            value: currentTotalTokens > 0n ? Number(currentYesTokens) / Number(currentTotalTokens) : Number(initialYesTokens) / Number(initialTotalTokens)
        });

        return history;
    }, [purchaseEvents, saleEvents, storeMarket]);

    if (!storeMarket) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <span className="loading loading-spinner loading-lg text-blue-600"></span>
            </div>
        );
    }

    const handleTrade = async (outcome: 'YES' | 'NO', type: 'BUY' | 'SELL', amount: bigint) => {
        if (type === 'BUY') {
            await buyTokens(outcome, amount);
        } else {
            await sellTokens(outcome, amount);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Navigation & Header Actions */}
                <div className="flex justify-between items-center mb-8">
                    <button
                        className="flex items-center text-sm font-black text-black/40 hover:text-black transition-colors group"
                        onClick={() => router.push('/')}
                    >
                        <ArrowLeftIcon className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1 stroke-[3]" />
                        Markets
                    </button>
                    <div className="flex gap-3">
                        <button className="p-2.5 rounded-xl border border-base-200 bg-base-100/50 hover:bg-base-200 transition-colors shadow-sm">
                            <ShareIcon className="w-4 h-4 text-black/60" />
                        </button>
                        <button className="p-2.5 rounded-xl border border-base-200 bg-base-100/50 hover:bg-base-200 transition-colors shadow-sm">
                            <InformationCircleIcon className="w-4 h-4 text-black/60" />
                        </button>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Left Column: Question, Chart, and Info */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="bg-base-50/50 rounded-[2.5rem] p-8 border border-base-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="bg-blue-600/10 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Prediction Market</span>
                                <span className="text-black/20 text-xs font-black">•</span>
                                <div className="flex items-center gap-1 text-black/40 text-xs font-black">
                                    <ClockIcon className="w-3.5 h-3.5" />
                                    Ends in 7 Days
                                </div>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-black tracking-tight leading-tight mb-6">
                                {storeMarket.question}
                            </h1>

                            <div className="flex flex-wrap gap-8 items-center border-t border-base-200 pt-6">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-black text-black/30 uppercase tracking-widest">Total Liquidity</span>
                                    <span className="text-xl font-black text-black">${formatUnits(storeMarket.collateral + storeMarket.lpTradingRevenue, 18)}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-black text-black/30 uppercase tracking-widest">24h Volume</span>
                                    <span className="text-xl font-black text-black">$0.00</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-black text-black/30 uppercase tracking-widest">Resolved by</span>
                                    <span className="text-xl font-black text-blue-600">Google Gemini</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2rem] border border-base-200 h-[400px] flex items-center justify-center shadow-sm relative group overflow-hidden">
                            <ProbabilityChart data={chartData} />
                        </div>

                        {/* Market Details / Description */}
                        <div className="bg-base-50/50 rounded-[2rem] p-8 border border-base-100">
                            <h3 className="text-xl font-black text-black mb-4">Market Details</h3>
                            <div className="prose font-medium text-black/60 max-w-none text-sm leading-relaxed">
                                <p>
                                    This is a trustless prediction market powered by Google Gemini AI. The outcome will be automatically reported and verified using Chainlink CRE once the market expires.
                                    All trades are executed against a concentrated liquidity pool, ensuring minimal slippage for traders.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Trading Interface & Actions */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="sticky top-8 space-y-6">
                            <TradingInterface
                                marketAddress={storeMarket.id}
                                yesTokenReserve={storeMarket.yesTokenReserve}
                                noTokenReserve={storeMarket.noTokenReserve}
                                yesTotalSupply={storeMarket.yesTotalSupply}
                                noTotalSupply={storeMarket.noTotalSupply}
                                initialTokenValue={storeMarket.initialTokenValue}
                                paymentTokenAddress={storeMarket.paymentToken}
                                yesTokenAddress={storeMarket.yesToken}
                                noTokenAddress={storeMarket.noToken}
                                userYesBalance={yesBalance}
                                userNoBalance={noBalance}
                                onTrade={handleTrade}
                                isOwner={false}
                            />

                            {/* Resolution Card */}
                            <div className="bg-black rounded-[1.8rem] p-6 text-white shadow-xl shadow-black/10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl">🤖</div>
                                    <div>
                                        <h4 className="font-black text-sm">AI Settlement</h4>
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Gemini Grounded Search</p>
                                    </div>
                                </div>

                                {!storeMarket.isReported ? (
                                    <>
                                        <p className="text-xs font-medium text-white/60 mb-6 leading-relaxed">
                                            Market settlement can be requested after expiration. The AI will verify current news and events to determine the outcome.
                                        </p>
                                        <button
                                            className={`w-full py-4 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 
                          ${isActionLoading ? "bg-white/5 text-white/20 cursor-not-allowed" : "bg-white text-black hover:bg-white/90"}`}
                                            onClick={requestSettlement}
                                            disabled={isActionLoading}
                                        >
                                            {isActionLoading ? "Requesting..." : "Trigger AI Resolution"}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/5">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Winning Outcome</span>
                                                <span className="px-2 py-0.5 bg-blue-600 text-[10px] font-black rounded-md uppercase tracking-widest">Official</span>
                                            </div>
                                            <p className="text-xl font-black">
                                                {storeMarket.winningToken.toLowerCase() === storeMarket.yesToken.toLowerCase() ? "YES" : "NO"}
                                            </p>
                                        </div>
                                        <button
                                            className="w-full py-4 rounded-xl bg-blue-600 text-white font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                                            onClick={() => redeemWinningTokens(parseEther("100"))} // Need to calculate actual winning amount
                                        >
                                            Redeem Winnings
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
