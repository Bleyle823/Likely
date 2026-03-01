"use client";

import React, { useState, useMemo } from 'react';
import { Line, LineChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import { Tabs, TabsList, TabsTrigger } from "~~/components/ui/tabs";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "~~/components/ui/chart";
import { getOutcomeColor } from "~~/lib/outcome-colors";
import { formatPricePercent } from "~~/lib/formatters";

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

const YES_COLOR = "#00a3ff";
const NO_COLOR = "#ff4467";

export const ProbabilityChart: React.FC<ProbabilityChartProps> = ({ data, height = 400 }) => {
    const [timeRange, setTimeRange] = useState<TimeRange>('7D');

    // Chart configuration
    const chartConfig = useMemo<ChartConfig>(() => ({
        yes: {
            label: "YES",
            color: YES_COLOR,
        },
        no: {
            label: "NO",
            color: NO_COLOR,
        },
    }), []);

    // Filter data based on time range
    const getFilteredData = () => {
        // Round current time to nearest minute to avoid flickering on every render
        const now = Math.floor(Date.now() / 60000) * 60000;
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

    // Convert percentages to decimals for the chart
    const chartData = filteredData.map(d => ({
        ...d,
        yes: d.yes / 100,
        no: d.no / 100,
    }));

    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold">Probability Timeline</h3>
                    <div className="flex items-center gap-6 mt-2">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: YES_COLOR }}></div>
                            <span className="text-2xl font-bold" style={{ color: YES_COLOR }}>{latestData.yes.toFixed(1)}%</span>
                            <span className="text-sm text-base-content/60 font-medium">YES</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: NO_COLOR }}></div>
                            <span className="text-2xl font-bold" style={{ color: NO_COLOR }}>{latestData.no.toFixed(1)}%</span>
                            <span className="text-sm text-base-content/60 font-medium">NO</span>
                        </div>
                    </div>
                </div>

                {/* Time Range Selector */}
                <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
                    <TabsList className="bg-base-300">
                        <TabsTrigger value="1H" className="text-xs uppercase font-bold">1H</TabsTrigger>
                        <TabsTrigger value="24H" className="text-xs uppercase font-bold">24H</TabsTrigger>
                        <TabsTrigger value="7D" className="text-xs uppercase font-bold">7D</TabsTrigger>
                        <TabsTrigger value="ALL" className="text-xs uppercase font-bold">ALL</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Chart */}
            <ChartContainer config={chartConfig} className={`h-[${height}px] w-full`}>
                <LineChart
                    data={chartData}
                    margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                >
                    <defs>
                        <filter id="glow-prob" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="2.5" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>
                    <CartesianGrid
                        strokeDasharray="2 4"
                        vertical={false}
                        stroke="rgba(128,128,128,0.15)"
                    />
                    <XAxis
                        dataKey="timestamp"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={12}
                        minTickGap={60}
                        tickFormatter={(timestamp) => {
                            if (timeRange === '1H') return format(new Date(timestamp), 'h:mm a');
                            if (timeRange === '24H') return format(new Date(timestamp), 'h a');
                            return format(new Date(timestamp), 'MMM d');
                        }}
                        stroke="rgba(128,128,128,0.5)"
                        fontSize={10}
                        fontWeight={500}
                    />
                    <YAxis
                        orientation="right"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => `${Math.round(value * 100)}%`}
                        domain={[0, 1]}
                        stroke="rgba(128,128,128,0.5)"
                        fontSize={10}
                        fontWeight={500}
                        width={40}
                        ticks={[0, 0.2, 0.4, 0.6, 0.8, 1]}
                    />
                    <ChartTooltip
                        cursor={{
                            stroke: "rgba(128,128,128,0.3)",
                            strokeDasharray: "4 4",
                        }}
                        content={
                            <ChartTooltipContent
                                labelFormatter={(_, payload) => {
                                    const items = payload as Array<{
                                        payload?: { timestamp?: number };
                                    }>;
                                    if (items?.[0]?.payload?.timestamp) {
                                        return format(new Date(items[0].payload.timestamp), 'MMM d, h:mm a');
                                    }
                                    return "";
                                }}
                                indicator="dot"
                                sort="desc"
                                className="bg-base-100 border-base-300 shadow-2xl"
                            />
                        }
                    />
                    <Line
                        type="monotone"
                        dataKey="yes"
                        name="YES"
                        stroke={YES_COLOR}
                        strokeWidth={3}
                        strokeLinecap="round"
                        filter="url(#glow-prob)"
                        dot={(props) => {
                            const { cx, cy, index } = props;
                            if (index === chartData.length - 1 && cx != null && cy != null) {
                                return (
                                    <g>
                                        <circle cx={cx} cy={cy} r={8} fill={YES_COLOR} opacity={0.3} />
                                        <circle
                                            cx={cx}
                                            cy={cy}
                                            r={5}
                                            fill={YES_COLOR}
                                            stroke="#fff"
                                            strokeWidth={2}
                                        />
                                    </g>
                                );
                            }
                            return null;
                        }}
                        activeDot={{
                            r: 6,
                            strokeWidth: 2,
                            stroke: YES_COLOR,
                            fill: "#fff",
                        }}
                        connectNulls
                    />
                    <Line
                        type="monotone"
                        dataKey="no"
                        name="NO"
                        stroke={NO_COLOR}
                        strokeWidth={3}
                        strokeLinecap="round"
                        filter="url(#glow-prob)"
                        dot={(props) => {
                            const { cx, cy, index } = props;
                            if (index === chartData.length - 1 && cx != null && cy != null) {
                                return (
                                    <g>
                                        <circle cx={cx} cy={cy} r={8} fill={NO_COLOR} opacity={0.3} />
                                        <circle
                                            cx={cx}
                                            cy={cy}
                                            r={5}
                                            fill={NO_COLOR}
                                            stroke="#fff"
                                            strokeWidth={2}
                                        />
                                    </g>
                                );
                            }
                            return null;
                        }}
                        activeDot={{
                            r: 6,
                            strokeWidth: 2,
                            stroke: NO_COLOR,
                            fill: "#fff",
                        }}
                        connectNulls
                    />
                </LineChart>
            </ChartContainer>
        </div>
    );
};
