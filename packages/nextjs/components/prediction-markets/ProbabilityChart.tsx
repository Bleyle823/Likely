"use client";

import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';

interface DataPoint {
    timestamp: number;
    yes: number;
    no: number;
}

interface ProbabilityChartProps {
    data: DataPoint[];
    height?: number;
}

type TimeRange = '1H' | '24H' | '7D' | 'ALL';

export const ProbabilityChart: React.FC<ProbabilityChartProps> = ({ data, height = 400 }) => {
    const [timeRange, setTimeRange] = useState<TimeRange>('7D');
    const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);

    // Filter data based on time range
    const getFilteredData = () => {
        const now = Date.now();
        const ranges = {
            '1H': 60 * 60 * 1000,
            '24H': 24 * 60 * 60 * 1000,
            '7D': 7 * 24 * 60 * 60 * 1000,
            'ALL': Infinity,
        };

        const cutoff = now - ranges[timeRange];
        return data.filter(d => d.timestamp >= cutoff);
    };

    const filteredData = getFilteredData();
    const latestData = filteredData[filteredData.length - 1] || { yes: 50, no: 50 };

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
                            <span className="text-sm font-medium text-success">YES</span>
                            <span className="text-sm font-bold text-success">{data.yes.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-sm font-medium text-error">NO</span>
                            <span className="text-sm font-bold text-error">{data.no.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold text-base-content">Probability Timeline</h3>
                    <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-success"></div>
                            <span className="text-2xl font-bold text-success">{latestData.yes.toFixed(1)}%</span>
                            <span className="text-sm text-base-content/60">YES</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-error"></div>
                            <span className="text-2xl font-bold text-error">{latestData.no.toFixed(1)}%</span>
                            <span className="text-sm text-base-content/60">NO</span>
                        </div>
                    </div>
                </div>

                {/* Time Range Selector */}
                <div className="btn-group">
                    {(['1H', '24H', '7D', 'ALL'] as TimeRange[]).map((range) => (
                        <button
                            key={range}
                            className={`btn btn-sm ${timeRange === range ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setTimeRange(range)}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={height}>
                <LineChart
                    data={filteredData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    onMouseMove={(e: any) => {
                        if (e && e.activePayload) {
                            setHoveredPoint(e.activePayload[0].payload);
                        }
                    }}
                    onMouseLeave={() => setHoveredPoint(null)}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis
                        dataKey="timestamp"
                        tickFormatter={(timestamp) => {
                            if (timeRange === '1H') return format(new Date(timestamp), 'h:mm a');
                            if (timeRange === '24H') return format(new Date(timestamp), 'h a');
                            return format(new Date(timestamp), 'MMM d');
                        }}
                        stroke="#9CA3AF"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                        stroke="#9CA3AF"
                        style={{ fontSize: '12px' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                        type="monotone"
                        dataKey="yes"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 6, fill: '#10b981' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="no"
                        stroke="#ef4444"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 6, fill: '#ef4444' }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};
