"use client";

import React, { useMemo, useState } from "react";
import {
    Area,
    AreaChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts";
import { format } from "date-fns";

interface DataPoint {
    timestamp: number;
    value: number;
}

interface ProbabilityChartProps {
    data: DataPoint[];
    color?: string;
}

const timeRanges = ["1H", "1D", "1W", "1M", "ALL"];

export function ProbabilityChart({
    data = [],
    color = "#2563eb",
}: ProbabilityChartProps) {
    const [activeRange, setActiveRange] = useState("1W");

    const chartData = useMemo(() => {
        if (data.length === 0) return [];
        return data.map(d => ({
            ...d,
            formattedDate: format(new Date(d.timestamp * 1000), "MMM d, h:mm a"),
            percent: (d.value * 100).toFixed(1),
        }));
    }, [data]);

    const latestValue = data.length > 0 ? (data[data.length - 1].value * 100).toFixed(1) : "50.0";

    return (
        <div className="w-full h-full flex flex-col p-6 bg-white rounded-[2rem]">
            {/* Chart Header */}
            <div className="flex justify-between items-end mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                        <span className="text-[10px] font-black text-black/30 uppercase tracking-widest leading-none">Live Probability</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-black tracking-tighter">{latestValue}%</span>
                        <span className="text-sm font-bold text-green-500">+2.4%</span>
                    </div>
                </div>

                <div className="flex gap-1 bg-base-100 p-1 rounded-xl border border-base-200 shadow-inner">
                    {timeRanges.map(range => (
                        <button
                            key={range}
                            onClick={() => setActiveRange(range)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${activeRange === range ? "bg-white text-black shadow-sm scale-105" : "text-black/30 hover:text-black/60"}`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart Canvas */}
            <div className="flex-1 w-full min-h-[250px] -ml-6 -mr-6">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                        <XAxis
                            dataKey="timestamp"
                            hide
                        />
                        <YAxis
                            domain={[0, 100]}
                            hide
                        />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-black text-white p-3 rounded-xl shadow-2xl border border-white/10 backdrop-blur-md">
                                            <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-1">{payload[0].payload.formattedDate}</p>
                                            <p className="text-lg font-black">{payload[0].payload.percent}% Chance</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={color}
                            strokeWidth={4}
                            fillOpacity={1}
                            fill="url(#colorProb)"
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Legend / Stats Footer */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-base-100">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                        <span className="text-[10px] font-black text-black/40 uppercase">Yes</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#d1255d]"></div>
                        <span className="text-[10px] font-black text-black/40 uppercase">No</span>
                    </div>
                </div>
                <div className="text-[10px] font-black text-black/30 flex items-center gap-1">
                    <span>Powered by</span>
                    <span className="text-blue-600/60">Chainlink Lab</span>
                </div>
            </div>
        </div>
    );
}
