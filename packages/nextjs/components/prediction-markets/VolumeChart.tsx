"use client";

import React, { useMemo } from 'react';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~~/components/ui/chart";
import { formatTokenAmount } from "~~/lib/formatters";

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
    // Chart configuration
    const chartConfig = useMemo<ChartConfig>(() => ({
      buy: {
        label: "Buy",
        color: "hsl(142, 76%, 36%)", // Green
      },
      sell: {
        label: "Sell",
        color: "hsl(0, 84%, 60%)", // Red
      },
    }), []);

    // Calculate total volume
    const totalVolume = data.reduce((sum, d) => sum + d.buy + d.sell, 0);

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
                    <h3 className="text-lg font-bold">Trading Volume</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Total: ${formatTokenAmount(BigInt(Math.floor(totalVolume * 1e18)), 18, 2)}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-green-500"></div>
                        <span className="text-xs text-muted-foreground">Buy</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-red-500"></div>
                        <span className="text-xs text-muted-foreground">Sell</span>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <ChartContainer config={chartConfig} className={`h-[${height}px] w-full`}>
                <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="var(--border)"
                        strokeOpacity={0.2}
                    />
                    <XAxis
                        dataKey="timestamp"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        minTickGap={50}
                        tickFormatter={(timestamp) => format(new Date(timestamp), 'MMM d')}
                        stroke="var(--muted-foreground)"
                        fontSize={11}
                    />
                    <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => `$${value > 1000 ? (value / 1000).toFixed(1) + 'K' : value}`}
                        stroke="var(--muted-foreground)"
                        fontSize={11}
                        width={45}
                    />
                    <ChartTooltip
                        cursor={{
                            fill: "var(--muted)",
                            fillOpacity: 0.1,
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
                                formatter={(value, name) => {
                                    const numValue = typeof value === 'number' ? value : 0;
                                    return [`$${formatTokenAmount(BigInt(Math.floor(numValue * 1e18)), 18, 2)}`, name];
                                }}
                                indicator="dot"
                                sort="desc"
                            />
                        }
                    />
                    <Bar 
                        dataKey="buy" 
                        stackId="a" 
                        fill="hsl(142, 76%, 36%)" 
                        radius={[0, 0, 0, 0]}
                        name="Buy"
                    />
                    <Bar 
                        dataKey="sell" 
                        stackId="a" 
                        fill="hsl(0, 84%, 60%)" 
                        radius={[4, 4, 0, 0]}
                        name="Sell"
                    />
                </BarChart>
            </ChartContainer>
        </div>
    );
};
