"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { MarketCard } from "~~/components/markets/market-card";
import { useMarketStore } from "~~/hooks/useMarketStore";
import { usePredictionMarket } from "~~/hooks/usePredictionMarket";
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon, FunnelIcon } from "@heroicons/react/24/outline";

const categories = ["Trending", "Sports", "Crypto", "Politics", "Finance", "Culture", "Others"];

const Home: NextPage = () => {
  // usePredictionMarket seeds the useMarketStore with live Fuji contract data
  usePredictionMarket();
  const { markets } = useMarketStore();
  const [activeCategory, setActiveCategory] = useState("Trending");

  const mappedMarkets = useMemo(() => {
    return markets.map(m => {
      const ys = m.yesTotalSupply - m.yesTokenReserve;
      const ns = m.noTotalSupply - m.noTokenReserve;
      const totalSold = ys + ns;
      const yesProb = totalSold > 0n ? Number(ys) / Number(totalSold) : m.initialProbability / 100;
      const noProb = 1 - yesProb;

      return {
        id: Number(m.id),
        question: m.question,
        yesProb,
        noProb,
        yesPriceCents: Math.round(yesProb * 100),
        noPriceCents: Math.round(noProb * 100),
        liquidity: m.collateral + m.lpTradingRevenue,
        icon: "📊"
      };
    });
  }, [markets]);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Category Pills Section */}
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

        {/* Filter & Search Bar */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-12">
          <div className="relative w-full lg:max-w-md group">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/30 group-focus-within:text-black transition-colors" />
            <input
              type="text"
              placeholder="Search markets..."
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

            <div className="bg-base-100 border border-base-200 rounded-[1.2rem] p-1 flex items-center shadow-sm">
              <button className="px-5 py-2 rounded-[0.8rem] font-black text-xs text-base-content/40 hover:text-black transition-colors flex items-center gap-2">
                <FunnelIcon className="w-4 h-4" />
                Active
              </button>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-[#0e0e0e] to-[#222222] rounded-[2.5rem] p-8 md:p-12 mb-16 relative overflow-hidden text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(circle_at_70%_30%,rgba(60,60,60,0.4),transparent)] -z-0"></div>
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter">The World's Open Prediction Market.</h2>
            <p className="text-lg text-white/60 font-medium mb-8">Trade on current events with Gemini AI settlement and deep liquidity.</p>
            <button className="bg-white text-black px-8 py-3 rounded-full font-black hover:bg-white/90 transition-all active:scale-95 shadow-xl shadow-white/10">
              Start Trading
            </button>
          </div>
          <div className="absolute bottom-[-20%] right-10 text-[10rem] font-black text-white/[0.03] select-none pointer-events-none tracking-tighter">
            PROBABLE
          </div>
        </div>

        {/* Markets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mappedMarkets.map((market) => (
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
          {mappedMarkets.length === 0 && (
            <div className="col-span-full bg-base-100 rounded-[2rem] border-2 border-dashed border-base-200 py-24 text-center">
              <div className="text-5xl mb-6 opacity-20">📊</div>
              <h3 className="text-xl font-black text-black mb-2">No Active Markets</h3>
              <p className="text-base-content/40 font-bold max-w-xs mx-auto italic">Check back later or deploy your own prediction market.</p>
            </div>
          )}
        </div>

        {/* Browse All Markets CTA */}
        {mappedMarkets.length > 0 && (
          <div className="mt-10 text-center">
            <Link
              href="/markets"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-black text-white font-black hover:bg-black/80 transition-all active:scale-95 shadow-lg shadow-black/10"
            >
              Browse All Markets
              <span className="text-white/60 text-xs ml-1">→</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
