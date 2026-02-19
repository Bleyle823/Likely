"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import {
    ProbabilityChart,
    VolumeChart,
    ActivityFeed,
    TradingInterface,
    MarketStats,
    type ActivityItem,
} from '../../../components/prediction-markets';
import { generateMockHistoricalData, generateMockVolumeData } from '../../../utils/predictionMarkets';
import toast from 'react-hot-toast';

export default function MarketDetailPage() {
    const params = useParams();
    const router = useRouter();
    const marketId = params.id as string;

    // Mock market data (replace with real data from contract)
    const mockMarket = {
        id: marketId,
        address: '0x1234567890123456789012345678901234567890',
        question: 'Will Bitcoin reach $100,000 by end of 2026?',
        yesToken: '0x1111111111111111111111111111111111111111',
        noToken: '0x2222222222222222222222222222222222222222',
        yesTokenReserve: BigInt('450000000000000000000'),
        noTokenReserve: BigInt('550000000000000000000'),
        collateral: BigInt('1000000000000000000000'),
        lpTradingRevenue: BigInt('50000000000000000000'),
        isReported: false,
        winningToken: '0x0000000000000000000000000000000000000000',
        oracle: '0x3333333333333333333333333333333333333333',
        owner: '0x4444444444444444444444444444444444444444',
        initialProbability: 50,
        percentageLocked: 10,
        initialTokenValue: BigInt('1000000000000000000'),
    };

    const totalSupply = mockMarket.yesTokenReserve + mockMarket.noTokenReserve;
    const yesSold = totalSupply - mockMarket.yesTokenReserve;
    const noSold = totalSupply - mockMarket.noTokenReserve;
    const totalSold = yesSold + noSold;
    const yesProbability = totalSold > 0n
        ? (Number(yesSold) / Number(totalSold)) * 100
        : mockMarket.initialProbability;

    // Mock data
    const historicalData = generateMockHistoricalData(yesProbability, 7);
    const volumeData = generateMockVolumeData(7);

    // Mock activities
    const mockActivities: ActivityItem[] = [
        {
            id: '1',
            type: 'BUY',
            user: '0x1234567890123456789012345678901234567890',
            outcome: 'YES',
            amount: BigInt('100000000000000000000'),
            price: BigInt('55000000000000000000'),
            timestamp: Date.now() - 300000,
            txHash: '0xabc123',
        },
        {
            id: '2',
            type: 'SELL',
            user: '0x2345678901234567890123456789012345678901',
            outcome: 'NO',
            amount: BigInt('50000000000000000000'),
            price: BigInt('22000000000000000000'),
            timestamp: Date.now() - 600000,
            txHash: '0xdef456',
        },
        {
            id: '3',
            type: 'BUY',
            user: '0x3456789012345678901234567890123456789012',
            outcome: 'YES',
            amount: BigInt('200000000000000000000'),
            price: BigInt('110000000000000000000'),
            timestamp: Date.now() - 900000,
            txHash: '0xghi789',
        },
    ];

    const handleTrade = async (outcome: 'YES' | 'NO', type: 'BUY' | 'SELL', amount: bigint) => {
        // Simulate trade
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 2000)),
            {
                loading: `${type === 'BUY' ? 'Buying' : 'Selling'} ${outcome} tokens...`,
                success: `Successfully ${type === 'BUY' ? 'bought' : 'sold'} ${outcome} tokens!`,
                error: 'Transaction failed',
            }
        );
    };

    const handleRequestSettlement = async () => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 2000)),
            {
                loading: 'Requesting settlement...',
                success: 'Settlement requested! CRE workflow will process this shortly.',
                error: 'Failed to request settlement',
            }
        );
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Back Button */}
            <button
                className="btn btn-ghost btn-sm mb-6"
                onClick={() => router.push('/markets')}
            >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Markets
            </button>

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-base-content mb-4">
                    {mockMarket.question}
                </h1>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="badge badge-lg badge-primary">Active</div>
                    <div className="text-sm text-base-content/60">
                        Market ID: {marketId}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Charts and Activity */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Probability Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card bg-base-200 shadow-xl"
                    >
                        <div className="card-body">
                            <ProbabilityChart data={historicalData} height={400} />
                        </div>
                    </motion.div>

                    {/* Volume Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="card bg-base-200 shadow-xl"
                    >
                        <div className="card-body">
                            <VolumeChart data={volumeData} height={300} />
                        </div>
                    </motion.div>

                    {/* Activity Feed */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="card bg-base-200 shadow-xl"
                    >
                        <div className="card-body">
                            <ActivityFeed activities={mockActivities} maxItems={10} />
                        </div>
                    </motion.div>
                </div>

                {/* Right Column - Trading and Stats */}
                <div className="space-y-6">
                    {/* Trading Interface */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <TradingInterface
                            marketAddress={mockMarket.address}
                            yesTokenReserve={mockMarket.yesTokenReserve}
                            noTokenReserve={mockMarket.noTokenReserve}
                            totalSupply={totalSupply}
                            initialTokenValue={mockMarket.initialTokenValue}
                            userYesBalance={BigInt('0')}
                            userNoBalance={BigInt('0')}
                            onTrade={handleTrade}
                        />
                    </motion.div>

                    {/* Settlement Button */}
                    {!mockMarket.isReported && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <button
                                className="btn btn-info btn-lg w-full"
                                onClick={handleRequestSettlement}
                            >
                                🤖 Request AI Settlement
                            </button>
                            <p className="text-xs text-center text-base-content/60 mt-2">
                                Powered by Google Gemini via Chainlink CRE
                            </p>
                        </motion.div>
                    )}

                    {/* Market Stats */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <MarketStats market={mockMarket} />
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
