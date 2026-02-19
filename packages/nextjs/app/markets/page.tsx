"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { MarketCard } from '../../components/prediction-markets';
import { useMarketStore } from '../../hooks/useMarketStore';
import { useRouter } from 'next/navigation';

type FilterType = 'ALL' | 'ACTIVE' | 'SETTLED';

export default function MarketsPage() {
    const router = useRouter();
    const { markets } = useMarketStore();
    const [filter, setFilter] = useState<FilterType>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Filter markets
    const filteredMarkets = markets.filter(market => {
        // Filter by status
        if (filter === 'ACTIVE' && market.isReported) return false;
        if (filter === 'SETTLED' && !market.isReported) return false;

        // Filter by search query
        if (searchQuery && !market.question.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }

        return true;
    });

    // Mock data for demonstration (remove when real data is available)
    const mockMarkets = filteredMarkets.length === 0 ? [
        {
            id: '1',
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
        },
        {
            id: '2',
            address: '0x2345678901234567890123456789012345678901',
            question: 'Will Ethereum merge to Proof of Stake succeed in 2026?',
            yesToken: '0x5555555555555555555555555555555555555555',
            noToken: '0x6666666666666666666666666666666666666666',
            yesTokenReserve: BigInt('300000000000000000000'),
            noTokenReserve: BigInt('700000000000000000000'),
            collateral: BigInt('800000000000000000000'),
            lpTradingRevenue: BigInt('30000000000000000000'),
            isReported: false,
            winningToken: '0x0000000000000000000000000000000000000000',
            oracle: '0x7777777777777777777777777777777777777777',
            owner: '0x8888888888888888888888888888888888888888',
            initialProbability: 70,
            percentageLocked: 15,
            initialTokenValue: BigInt('1000000000000000000'),
        },
        {
            id: '3',
            address: '0x3456789012345678901234567890123456789012',
            question: 'Will AI surpass human intelligence by 2030?',
            yesToken: '0x9999999999999999999999999999999999999999',
            noToken: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
            yesTokenReserve: BigInt('600000000000000000000'),
            noTokenReserve: BigInt('400000000000000000000'),
            collateral: BigInt('1200000000000000000000'),
            lpTradingRevenue: BigInt('80000000000000000000'),
            isReported: true,
            winningToken: '0x9999999999999999999999999999999999999999',
            oracle: '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
            owner: '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
            initialProbability: 40,
            percentageLocked: 20,
            initialTokenValue: BigInt('1000000000000000000'),
        },
    ] : filteredMarkets;

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-base-content mb-2">
                    Prediction Markets
                </h1>
                <p className="text-base-content/60">
                    Trade on the outcome of future events powered by Google Gemini AI
                </p>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                {/* Search */}
                <div className="flex-1">
                    <div className="form-control">
                        <div className="input-group">
                            <span className="bg-base-300">
                                <MagnifyingGlassIcon className="w-5 h-5" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search markets..."
                                className="input input-bordered w-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Filter Buttons */}
                <div className="btn-group">
                    {(['ALL', 'ACTIVE', 'SETTLED'] as FilterType[]).map((f) => (
                        <button
                            key={f}
                            className={`btn ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setFilter(f)}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* View Mode Toggle */}
                <div className="btn-group">
                    <button
                        className={`btn ${viewMode === 'grid' ? 'btn-active' : ''}`}
                        onClick={() => setViewMode('grid')}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                    </button>
                    <button
                        className={`btn ${viewMode === 'list' ? 'btn-active' : ''}`}
                        onClick={() => setViewMode('list')}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="stats stats-vertical md:stats-horizontal shadow mb-8 w-full">
                <div className="stat">
                    <div className="stat-title">Total Markets</div>
                    <div className="stat-value text-primary">{mockMarkets.length}</div>
                    <div className="stat-desc">Across all categories</div>
                </div>
                <div className="stat">
                    <div className="stat-title">Active Markets</div>
                    <div className="stat-value text-success">
                        {mockMarkets.filter(m => !m.isReported).length}
                    </div>
                    <div className="stat-desc">Currently trading</div>
                </div>
                <div className="stat">
                    <div className="stat-title">Total Volume</div>
                    <div className="stat-value text-secondary">$2.4M</div>
                    <div className="stat-desc">Last 30 days</div>
                </div>
            </div>

            {/* Markets Grid/List */}
            {mockMarkets.length === 0 ? (
                <div className="text-center py-16">
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-2xl font-bold text-base-content mb-2">
                        No markets found
                    </h3>
                    <p className="text-base-content/60 mb-6">
                        Try adjusting your filters or search query
                    </p>
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            setFilter('ALL');
                            setSearchQuery('');
                        }}
                    >
                        Clear Filters
                    </button>
                </div>
            ) : (
                <motion.div
                    layout
                    className={
                        viewMode === 'grid'
                            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                            : 'space-y-4'
                    }
                >
                    {mockMarkets.map((market, index) => (
                        <motion.div
                            key={market.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <MarketCard
                                market={market}
                                onClick={() => router.push(`/markets/${market.id}`)}
                                historicalData={[45, 47, 46, 48, 50, 52, 51, 53, 55, 54]}
                            />
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    );
}
