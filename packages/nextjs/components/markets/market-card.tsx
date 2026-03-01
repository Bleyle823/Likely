"use client";

import Link from "next/link";
import { formatEther } from "viem";
import { CalendarIcon, LinkIcon } from "@heroicons/react/24/outline";

export function MarketCard({
    question,
    yesProb,
    noProb,
    yesPriceCents,
    noPriceCents,
    liquidity,
    href = "/markets",
    icon,
}: {
    question: string;
    yesProb: number;
    noProb: number;
    yesPriceCents: number;
    noPriceCents: number;
    liquidity: bigint;
    href?: string;
    icon?: React.ReactNode;
}) {
    const yesPct = Math.round(yesProb * 100);
    const noPct = Math.round(noProb * 100);

    return (
        <div className="card bg-base-100 shadow-md border border-base-200 rounded-[1.5rem] hover:shadow-lg transition-all duration-300 overflow-hidden max-w-[340px]">
            <div className="card-body p-5">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-3 items-center flex-1">
                        {icon ? (
                            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-sm border border-base-200 flex items-center justify-center bg-base-50">
                                {icon}
                            </div>
                        ) : (
                            <div className="w-14 h-14 rounded-xl bg-base-200 flex items-center justify-center shrink-0">
                                <span className="text-xl text-base-content/20">?</span>
                            </div>
                        )}
                        <p className="font-bold text-lg text-black leading-tight line-clamp-2 pr-1">
                            {question}
                        </p>
                    </div>
                    <Link href={href} className="btn btn-circle btn-ghost btn-xs bg-base-200/50 hover:bg-base-200">
                        <LinkIcon className="w-3.5 h-3.5 text-base-content/60" />
                    </Link>
                </div>

                <div className="flex items-center gap-2 mb-5">
                    <span className="text-xs font-black text-blue-600">{yesPct}%</span>
                    <div className="flex-1 h-2 rounded-full bg-base-200 p-0.5 border border-base-300">
                        <div className="flex h-full w-full rounded-full overflow-hidden">
                            <div className="bg-blue-500 transition-all border-r border-white/10" style={{ width: yesPct + "%" }} />
                            <div className="bg-[#d1255d] transition-all" style={{ width: noPct + "%" }} />
                        </div>
                    </div>
                    <span className="text-xs font-black text-[#d1255d]">{noPct}%</span>
                </div>

                <div className="flex gap-3 mb-5">
                    <button
                        className="btn flex-1 h-12 min-h-[3rem] rounded-xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-base flex justify-center items-center gap-1.5 group transition-all px-2"
                        onClick={e => { e.preventDefault(); e.stopPropagation(); }}
                    >
                        <span className="shrink-0">{yesPriceCents}¢</span>
                        <span className="text-blue-900/60 group-hover:text-blue-900">Yes</span>
                    </button>
                    <button
                        className="btn flex-1 h-12 min-h-[3rem] rounded-xl border-2 border-pink-200 bg-pink-50 hover:bg-pink-100 text-[#d1255d] font-bold text-base flex justify-center items-center gap-1.5 group transition-all px-2"
                        onClick={e => { e.preventDefault(); e.stopPropagation(); }}
                    >
                        <span className="shrink-0">{noPriceCents}¢</span>
                        <span className="text-pink-900/60 group-hover:text-[#d1255d]">No</span>
                    </button>
                </div>

                <div className="flex justify-between items-center mt-1 px-0.5">
                    <p className="text-xs font-semibold text-base-content/40">
                        ${(Number(formatEther(liquidity))).toLocaleString()} Liq
                    </p>
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-base-200/50 border border-base-300">
                        <CalendarIcon className="w-3 h-3 text-base-content/60" />
                        <span className="text-[10px] font-black text-base-content/60 uppercase">Mar 1</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
