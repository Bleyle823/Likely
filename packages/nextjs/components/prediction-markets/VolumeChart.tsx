"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format } from 'date-fns';
import { formatTokenAmount } from '../../utils/predictionMarkets';

interface VolumeDataPoint {
    timestamp: number;
    buy: number;
    sell: number;
}

interface VolumeChartProps {
    data: VolumeDataPoint[];
    height?: number;
}

export const VolumeChart: React.FC<VolumeChartProps> = ({ data, height = 300 }) => {
    // Calculate total volume
    const totalVolume = data.reduce((sum, d) => sum + d.buy + d.sell, 0);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-base-100 border border-base-300 rounded-lg p-3 shadow-lg">
                    <p className="text-xs text-base-content/60 mb-2">
                        {format(new Date(data.timestamp), 'MMM d, h:mm a')}
                    </p>
                    <div className="space-y-1">
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-sm font-medium text-success">Buy</span>
                            <span className="text-sm font-bold text-success">
                                ${formatTokenAmount(BigInt(Math.floor(data.buy * 1e18)), 18, 2)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-sm font-medium text-error">Sell</span>
                            <span className="text-sm font-bold text-error">
                                ${formatTokenAmount(BigInt(Math.floor(data.sell * 1e18)), 18, 2)}
                            </span>
                        </div>
                        <div className="border-t border-base-300 pt-1 mt-1">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-sm font-medium text-base-content">Total</span>
                                <span className="text-sm font-bold text-base-content">
                                    ${formatTokenAmount(BigInt(Math.floor((data.buy + data.sell) * 1e18)), 18, 2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    // Transform data for stacked bar chart
    const chartData = data.map(d => ({
        ...d,
        total: d.buy + d.sell,
    }));

    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold text-base-content">Trading Volume</h3>
                    <p className="text-sm text-base-content/60 mt-1">
                        Total: ${formatTokenAmount(BigInt(Math.floor(totalVolume * 1e18)), 18, 2)}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-success"></div>
                        <span className="text-xs text-base-content/60">Buy</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-error"></div>
                        <span className="text-xs text-base-content/60">Sell</span>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={height}>
                <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis
                        dataKey="timestamp"
                        tickFormatter={(timestamp) => format(new Date(timestamp), 'MMM d')}
                        stroke="#9CA3AF"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        tickFormatter={(value) => `$${value > 1000 ? (value / 1000).toFixed(1) + 'K' : value}`}
                        stroke="#9CA3AF"
                        style={{ fontSize: '12px' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="buy" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="sell" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
