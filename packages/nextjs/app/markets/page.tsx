"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { NextPage } from "next";
import { formatUnits } from "viem";
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon, FunnelIcon } from "@heroicons/react/24/outline";
import { MarketCard } from "~~/components/markets/market-card";
import { useMarketStore } from "~~/hooks/useMarketStore";
import { usePredictionMarket } from "~~/hooks/usePredictionMarket";

type FilterType = "ALL" | "ACTIVE" | "SETTLED";

const categories = ["Trending", "Sports", "Crypto", "Politics", "Finance", "Culture", "Others"];

const MarketsPage: NextPage = () => {
    const router = useRouter();
    const { markets } = useMarketStore();
    const { isDetailsLoading } = usePredictionMarket();
    const [activeCategory, setActiveCategory] = useState("Trending");
    const [filter, setFilter] = useState<FilterType>("ALL");
    const [searchQuery, setSearchQuery] = useState("");

    const mappedMarkets = useMemo(() => {
        return markets
            .filter(market => {
                if (filter === "ACTIVE" && market.isReported) return false;
                if (filter === "SETTLED" && !market.isReported) return false;
                if (searchQuery && !market.question.toLowerCase().includes(searchQuery.toLowerCase())) return false;
                return true;
            })
            .map(m => {
                const ys = m.yesTotalSupply - m.yesTokenReserve;
                const ns = m.noTotalSupply - m.noTokenReserve;
                const totalSold = ys + ns;
                const yesProb = totalSold > 0n ? Number(ys) / Number(totalSold) : m.initialProbability / 100;
                const noProb = 1 - yesProb;

                return {
                    id: m.id,
                    question: m.question,
                    yesProb,
                    noProb,
                    yesPriceCents: Math.round(yesProb * 100),
                    noPriceCents: Math.round(noProb * 100),
                    liquidity: m.collateral + m.lpTradingRevenue,
                    icon: "📊",
                    isReported: m.isReported,
                };
            });
    }, [markets, filter, searchQuery]);

    const totalLiquidity = markets.reduce((acc, m) => acc + Number(formatUnits(m.collateral + m.lpTradingRevenue, 18)), 0);
    const activeCount = markets.filter(m => !m.isReported).length;

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-6 py-10">

                {/* Category Pills */}
                <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar mb-10 border-b border-base-100">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-5 py-2 rounded-full font-black text-sm whitespace-nowrap transition-all
                ${activeCategory === cat
                                    ? "bg-black text-white shadow-lg shadow-black/10 scale-105"
                                    : "bg-base-100 text-base-content/40 hover:text-black/60"}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Search + Filters */}
                <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-12">
                    <div className="relative w-full lg:max-w-md group">
                        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/30 group-focus-within:text-black transition-colors" />
                        <input
                            type="text"
                            placeholder="Search markets..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-base-100 border border-base-200 rounded-[1.2rem] py-4 pl-12 pr-4 font-bold text-black focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto no-scrollbar">
                        <div className="bg-base-100 border border-base-200 rounded-[1.2rem] p-1 flex items-center shadow-sm">
                            <button className="px-5 py-2 rounded-[0.8rem] bg-white shadow-sm font-black text-xs text-black flex items-center gap-2">
                                <AdjustmentsHorizontalIcon className="w-4 h-4" />
                                Sort by Volume
                            </button>
                        </div>

                        {/* Status Filter */}
                        <div className="bg-base-100 border border-base-200 rounded-[1.2rem] p-1 flex items-center shadow-sm gap-1">
                            {(["ALL", "ACTIVE", "SETTLED"] as FilterType[]).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-2 rounded-[0.8rem] font-black text-xs transition-colors flex items-center gap-2
                    ${filter === f ? "bg-white shadow-sm text-black" : "text-base-content/40 hover:text-black"}`}
                                >
                                    {f === "ALL" ? <><FunnelIcon className="w-4 h-4" />All</> : f.charAt(0) + f.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Hero Banner */}
                <div className="bg-gradient-to-br from-[#0e0e0e] to-[#222222] rounded-[2.5rem] p-8 md:p-12 mb-16 relative overflow-hidden text-white shadow-2xl">
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(circle_at_70%_30%,rgba(60,60,60,0.4),transparent)] -z-0"></div>
                    <div className="relative z-10 max-w-2xl">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="bg-white/10 text-white/70 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Avalanche Fuji</span>
                            <span className="flex items-center gap-1.5 text-white/40 text-[10px] font-black uppercase tracking-widest">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                                {activeCount} Active {activeCount === 1 ? "Market" : "Markets"}
                            </span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter">The World&apos;s Open Prediction Market.</h2>
                        <p className="text-lg text-white/60 font-medium mb-8">Trade on current events with Gemini AI settlement and deep liquidity on Avalanche.</p>
                        <div className="flex items-center gap-4">
                            <button
                                className="bg-white text-black px-8 py-3 rounded-full font-black hover:bg-white/90 transition-all active:scale-95 shadow-xl shadow-white/10"
                                onClick={() => window.scrollTo({ top: 600, behavior: "smooth" })}
                            >
                                Browse Markets
                            </button>
                            <div className="text-sm font-black text-white/40">
                                ${totalLiquidity.toFixed(2)} <span className="text-white/20">Total Liq.</span>
                            </div>
                        </div>
                    </div>
                    <div className="absolute bottom-[-20%] right-10 text-[10rem] font-black text-white/[0.03] select-none pointer-events-none tracking-tighter">
                        LIKELY
                    </div>
                </div>

                {/* Markets Grid */}
                {isDetailsLoading && markets.length === 0 ? (
                    <div className="col-span-full bg-base-100 rounded-[2rem] border-2 border-dashed border-base-200 py-24 text-center">
                        <div className="flex justify-center">
                            <span className="loading loading-spinner loading-lg text-black/20"></span>
                        </div>
                        <p className="mt-4 text-base-content/40 font-bold">Loading markets from Fuji...</p>
                    </div>
                ) : mappedMarkets.length === 0 ? (
                    <div className="col-span-full bg-base-100 rounded-[2rem] border-2 border-dashed border-base-200 py-24 text-center">
                        <div className="text-5xl mb-6 opacity-20">📊</div>
                        <h3 className="text-xl font-black text-black mb-2">
                            {searchQuery || filter !== "ALL" ? "No markets match your filters" : "No Active Markets"}
                        </h3>
                        <p className="text-base-content/40 font-bold max-w-xs mx-auto italic mb-6">
                            {searchQuery || filter !== "ALL"
                                ? "Try adjusting your search or filter."
                                : "Check back later or deploy your own prediction market."}
                        </p>
                        {(searchQuery || filter !== "ALL") && (
                            <button
                                className="px-6 py-2.5 rounded-full bg-black text-white font-black text-sm hover:bg-black/80 transition-all"
                                onClick={() => { setSearchQuery(""); setFilter("ALL"); }}
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {mappedMarkets.map(market => (
                            <MarketCard
                                key={market.id}
                                question={market.question}
                                yesProb={market.yesProb}
                                noProb={market.noProb}
                                yesPriceCents={market.yesPriceCents}
                                noPriceCents={market.noPriceCents}
                                liquidity={market.liquidity}
                                href={`/markets/${market.id}`}
                                icon={<span className="text-2xl">{market.icon}</span>}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MarketsPage;
