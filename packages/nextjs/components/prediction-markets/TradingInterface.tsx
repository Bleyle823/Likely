"use client";

import { useState } from "react";
import { formatEther, parseEther } from "viem";
import { useReadContract, useAccount } from "wagmi";
import { GiveAllowance } from "./GiveAllowance";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { ChevronDownIcon, Cog6ToothIcon, ArrowsUpDownIcon, WalletIcon } from "@heroicons/react/24/outline";

const erc20Abi = [{ inputs: [], name: "totalSupply", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" }] as const;

interface TradingInterfaceProps {
    marketAddress: string;
    yesTokenReserve: bigint;
    noTokenReserve: bigint;
    yesTotalSupply: bigint;
    noTotalSupply: bigint;
    initialTokenValue: bigint;
    paymentTokenAddress: string;
    yesTokenAddress: string;
    noTokenAddress: string;
    userYesBalance?: bigint;
    userNoBalance?: bigint;
    onTrade?: (outcome: 'YES' | 'NO', type: 'BUY' | 'SELL', amount: bigint) => Promise<void>;
    isOwner?: boolean;
}

export const TradingInterface: React.FC<TradingInterfaceProps> = ({
    marketAddress,
    yesTokenReserve,
    noTokenReserve,
    yesTotalSupply,
    noTotalSupply,
    paymentTokenAddress,
    yesTokenAddress,
    noTokenAddress,
    userYesBalance = 0n,
    userNoBalance = 0n,
    onTrade,
    isOwner = false,
}) => {
    const { isConnected } = useAccount();
    const [mode, setMode] = useState<"buy" | "sell">("buy");
    const [selectedOutcome, setSelectedOutcome] = useState<0 | 1>(0); // 0 = YES, 1 = NO
    const [amount, setAmount] = useState("");
    const tokenAmount = parseEther(amount || "0");

    const { data: totalSupply } = useReadContract({
        abi: erc20Abi,
        address: yesTokenAddress as `0x${string}`, // Total supply is same for both YES/NO tokens in this architecture
        functionName: "totalSupply",
    });

    const { data: totalPriceInUSDC } = useScaffoldReadContract({
        contractName: "PredictionMarket",
        functionName: mode === "buy" ? "getBuyPriceInUSDC" : "getSellPriceInUSDC",
        args: [BigInt(selectedOutcome), tokenAmount],
        watch: true,
    });

    if (isOwner) return <div className="text-center p-4 text-base-content/70 font-bold italic">Liquidity providers cannot trade.</div>;

    const totalSold = totalSupply ? (totalSupply - yesTokenReserve) + (totalSupply - noTokenReserve) : 1n;
    const yesSold = totalSupply ? totalSupply - yesTokenReserve : 0n;
    const yesProb = totalSold > 0n ? Number((yesSold * BigInt(1e18)) / totalSold) / 1e18 : 0.5;
    const noProb = 1 - yesProb;
    const yesCents = Math.round(yesProb * 100);
    const noCents = Math.round(noProb * 100);

    const currentTokenAddress = mode === 'buy'
        ? paymentTokenAddress
        : (selectedOutcome === 0 ? yesTokenAddress : noTokenAddress);

    return (
        <div className="card bg-white shadow-sm border border-base-200 rounded-[1.5rem] overflow-hidden w-full">
            <div className="card-body p-5">
                {/* Action Tabs & Settings Row */}
                <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-4">
                        <button
                            className={`pb-1 px-1 font-black text-base transition-all border-b-[3px] ${mode === "buy" ? "text-blue-600 border-blue-600" : "text-base-content/20 border-transparent hover:text-black/40"}`}
                            onClick={() => setMode("buy")}
                        >
                            Buy
                        </button>
                        <button
                            className={`pb-1 px-1 font-black text-base transition-all border-b-[3px] ${mode === "sell" ? "text-blue-600 border-blue-600" : "text-base-content/20 border-transparent hover:text-black/40"}`}
                            onClick={() => setMode("sell")}
                        >
                            Sell
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-1 font-black text-blue-600 text-[11px] cursor-pointer hover:opacity-80">
                            Market <ChevronDownIcon className="w-3 h-3 stroke-[3]" />
                        </button>
                        <button className="w-7 h-7 rounded-lg bg-base-100 border border-base-200 flex items-center justify-center shadow-sm hover:bg-base-200 transition-colors">
                            <Cog6ToothIcon className="w-3.5 h-3.5 text-base-content/60" />
                        </button>
                    </div>
                </div>

                <div className="divider -mx-5 my-0 opacity-50 mb-4"></div>

                {/* Outcome Toggle Buttons */}
                <div className="bg-base-100 rounded-[1rem] p-1 flex gap-1 mb-4 border border-base-200 shadow-inner">
                    <button
                        className={`flex-1 py-2.5 px-3 rounded-[0.8rem] font-black text-sm transition-all flex items-center justify-center gap-2 ${selectedOutcome === 0 ? "bg-blue-600 text-white shadow-md scale-[1.01]" : "text-base-content/40 hover:text-black"}`}
                        onClick={() => setSelectedOutcome(0)}
                    >
                        YES {yesCents}¢
                    </button>
                    <button
                        className={`flex-1 py-2.5 px-3 rounded-[0.8rem] font-black text-sm transition-all flex items-center justify-center gap-2 ${selectedOutcome === 1 ? "bg-[#d1255d] text-white shadow-md scale-[1.01]" : "text-base-content/40 hover:text-black"}`}
                        onClick={() => setSelectedOutcome(1)}
                    >
                        NO {noCents}¢
                    </button>
                </div>

                {/* Input Section */}
                <div className="bg-base-100 rounded-[1.5rem] p-4 border border-base-200 shadow-inner relative group mb-4">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                                <span className="text-lg font-black text-blue-900/80 tracking-tight">Amount</span>
                                <ArrowsUpDownIcon className="w-3.5 h-3.5 text-blue-900/40 group-hover:text-blue-600 transition-colors cursor-pointer" />
                            </div>
                            <div className="flex items-center gap-1 text-blue-900/40 font-black text-[10px]">
                                <WalletIcon className="w-3 h-3" />
                                <span>Balance: {formatEther(mode === 'sell' ? (selectedOutcome === 0 ? userYesBalance : userNoBalance) : 0n)}</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end flex-1">
                            <div className="flex items-center justify-end w-full">
                                <span className={`text-2xl font-black transition-colors ${amount ? "text-blue-900/80" : "text-blue-900/40"}`}>$</span>
                                <input
                                    type="text"
                                    placeholder="0.0"
                                    className="bg-transparent text-right text-2xl font-black text-blue-900/80 w-full focus:outline-none placeholder:text-blue-900/40"
                                    value={amount}
                                    onChange={e => {
                                        const val = e.target.value.replace(/[^0-9.]/g, '');
                                        if (!isNaN(Number(val)) || val === "") setAmount(val);
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-1">
                        {[1, 10, 100, "MAX"].map((n) => (
                            <button
                                key={n}
                                className="px-2.5 py-1 rounded-lg border border-blue-600/30 text-[9px] font-black text-blue-600 hover:bg-blue-600 hover:text-white transition-all active:scale-95"
                                onClick={() => {
                                    if (n === "MAX") {
                                        setAmount(formatEther(mode === 'sell' ? (selectedOutcome === 0 ? userYesBalance : userNoBalance) : 1000n * parseEther("1")));
                                    } else {
                                        setAmount(String(Number(amount || 0) + (n as number)));
                                    }
                                }}
                            >
                                {typeof n === 'number' ? `+$${n}` : n}
                            </button>
                        ))}
                    </div>
                </div>

                {totalPriceInUSDC && tokenAmount > 0n && (
                    <div className="flex justify-between items-center px-2 mb-4">
                        <span className="text-xs font-black text-base-content/40 uppercase tracking-wider">{mode === "buy" ? "Estimated Cost" : "Estimated Return"}</span>
                        <span className="text-sm font-black text-black">{Number(formatEther(totalPriceInUSDC as bigint)).toFixed(4)} USDC</span>
                    </div>
                )}

                {/* Approval Check */}
                <div className="mb-4">
                    <GiveAllowance
                        tokenAddress={currentTokenAddress}
                        spenderAddress={marketAddress}
                        amount={amount}
                        showInput={false}
                        disabled={!tokenAmount || tokenAmount === 0n}
                    />
                </div>

                {/* Main Action Button */}
                <button
                    className={`w-full py-4 rounded-[1.2rem] font-black text-base shadow-lg active:scale-95 transition-all
            ${(!totalPriceInUSDC || tokenAmount === 0n)
                            ? "bg-base-200 text-base-content/30 cursor-not-allowed"
                            : "bg-[#ff5722] text-white hover:bg-[#f4511e] shadow-[#ff5722]/20"}`}
                    disabled={!totalPriceInUSDC || tokenAmount === 0n}
                    onClick={async () => {
                        if (onTrade) {
                            await onTrade(selectedOutcome === 0 ? 'YES' : 'NO', mode.toUpperCase() as 'BUY' | 'SELL', tokenAmount);
                            setAmount("");
                        }
                    }}
                >
                    {isConnected ? `${mode === "buy" ? "Buy" : "Sell"} ${selectedOutcome === 0 ? 'YES' : 'NO'}` : "Connect Wallet"}
                </button>
            </div>
        </div>
    );
};
