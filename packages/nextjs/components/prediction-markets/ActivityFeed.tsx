"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { shortenAddress, timeAgo, formatTokenAmount } from '../../utils/predictionMarkets';

export interface ActivityItem {
    id: string;
    type: 'BUY' | 'SELL' | 'SETTLEMENT' | 'LIQUIDITY_ADD' | 'LIQUIDITY_REMOVE';
    user: string;
    outcome?: 'YES' | 'NO';
    amount?: bigint;
    price?: bigint;
    timestamp: number;
    txHash: string;
}

interface ActivityFeedProps {
    activities: ActivityItem[];
    maxItems?: number;
    showHeader?: boolean;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
    activities,
    maxItems = 10,
    showHeader = true
}) => {
    const displayedActivities = activities.slice(0, maxItems);

    const getActivityIcon = (type: ActivityItem['type']) => {
        switch (type) {
            case 'BUY':
                return <ArrowTrendingUpIcon className="w-5 h-5 text-success" />;
            case 'SELL':
                return <ArrowTrendingDownIcon className="w-5 h-5 text-error" />;
            case 'SETTLEMENT':
                return <CheckCircleIcon className="w-5 h-5 text-info" />;
            default:
                return <div className="w-5 h-5 rounded-full bg-base-300" />;
        }
    };

    const getActivityText = (activity: ActivityItem) => {
        const user = shortenAddress(activity.user);

        switch (activity.type) {
            case 'BUY':
                return (
                    <span>
                        <span className="font-medium text-base-content">{user}</span>
                        {' '}bought{' '}
                        <span className="font-bold text-success">
                            {formatTokenAmount(activity.amount || 0n, 18, 2)} {activity.outcome}
                        </span>
                        {' '}for{' '}
                        <span className="font-medium">
                            ${formatTokenAmount(activity.price || 0n, 18, 2)}
                        </span>
                    </span>
                );
            case 'SELL':
                return (
                    <span>
                        <span className="font-medium text-base-content">{user}</span>
                        {' '}sold{' '}
                        <span className="font-bold text-error">
                            {formatTokenAmount(activity.amount || 0n, 18, 2)} {activity.outcome}
                        </span>
                        {' '}for{' '}
                        <span className="font-medium">
                            ${formatTokenAmount(activity.price || 0n, 18, 2)}
                        </span>
                    </span>
                );
            case 'SETTLEMENT':
                return (
                    <span>
                        Market settled by{' '}
                        <span className="font-medium text-base-content">{user}</span>
                    </span>
                );
            case 'LIQUIDITY_ADD':
                return (
                    <span>
                        <span className="font-medium text-base-content">{user}</span>
                        {' '}added{' '}
                        <span className="font-medium">
                            ${formatTokenAmount(activity.amount || 0n, 18, 2)}
                        </span>
                        {' '}liquidity
                    </span>
                );
            case 'LIQUIDITY_REMOVE':
                return (
                    <span>
                        <span className="font-medium text-base-content">{user}</span>
                        {' '}removed{' '}
                        <span className="font-medium">
                            ${formatTokenAmount(activity.amount || 0n, 18, 2)}
                        </span>
                        {' '}liquidity
                    </span>
                );
            default:
                return <span>Unknown activity</span>;
        }
    };

    return (
        <div className="w-full">
            {showHeader && (
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-base-content">Activity Feed</h3>
                    <p className="text-sm text-base-content/60 mt-1">
                        Recent market activity
                    </p>
                </div>
            )}

            <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                    {displayedActivities.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center py-8 text-base-content/60"
                        >
                            No activity yet
                        </motion.div>
                    ) : (
                        displayedActivities.map((activity, index) => (
                            <motion.div
                                key={activity.id}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-start gap-3 p-3 bg-base-200 hover:bg-base-300 rounded-lg transition-colors cursor-pointer group"
                                onClick={() => {
                                    if (activity.txHash) {
                                        window.open(`https://etherscan.io/tx/${activity.txHash}`, '_blank');
                                    }
                                }}
                            >
                                <div className="flex-shrink-0 mt-0.5">
                                    {getActivityIcon(activity.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-base-content/80 leading-relaxed">
                                        {getActivityText(activity)}
                                    </p>
                                    <p className="text-xs text-base-content/50 mt-1">
                                        {timeAgo(activity.timestamp)}
                                    </p>
                                </div>
                                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg
                                        className="w-4 h-4 text-base-content/40"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                        />
                                    </svg>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {activities.length > maxItems && (
                <button className="btn btn-ghost btn-sm w-full mt-4">
                    View all activity ({activities.length})
                </button>
            )}
        </div>
    );
};
