"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAccount } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePredictionMarket } from "~~/hooks/usePredictionMarket";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { cn } from "@/lib/utils";
import type { Market, Outcome } from "@/lib/types";

// Sub-components
import { ActionTabs, type TradeAction } from "./action-tabs";
import { OutcomeSelector } from "./outcome-selector";
import { AmountInput } from "./amount-input";
import { QuoteStats, type Quote } from "./quote-stats";

interface TradePanelProps {
    market: Market;
    selectedOutcomeId: number;
    onOutcomeChange?: (outcomeId: number) => void;
}

export function TradePanel({
    market,
    selectedOutcomeId,
    onOutcomeChange,
}: TradePanelProps) {
    const { address: connectedAddress, isConnected } = useAccount();
    const { buyTokens, sellTokens, isLoading: isTrading, musdcBalance, yesBalance, noBalance } = usePredictionMarket();

    const [action, setAction] = useState<TradeAction>("buy");
    const [amount, setAmount] = useState("");
    const [quote, setQuote] = useState<Quote | null>(null);

    const selectedOutcome = market.outcomes.find((o) => o.id === selectedOutcomeId);
    const outcomeIndex = selectedOutcomeId; // YES=0, NO=1

    // Get Quote from Contract
    const { data: buyAmountQuote } = useScaffoldReadContract({
        contractName: "PredictionMarket",
        functionName: "getBuyAmount",
        args: [outcomeIndex, parseUnits(amount || "0", 18)], // USDC is 18 decimals in this mock
        query: {
            enabled: action === "buy" && !!amount && parseFloat(amount) > 0,
        }
    });

    const { data: sellPriceQuote } = useScaffoldReadContract({
        contractName: "PredictionMarket",
        functionName: "getSellPrice",
        args: [outcomeIndex, parseUnits(amount || "0", 18)],
        query: {
            enabled: action === "sell" && !!amount && parseFloat(amount) > 0,
        }
    });

    // Fetch current price for impact calculation
    const { data: currentPriceData } = useScaffoldReadContract({
        contractName: "PredictionMarket",
        functionName: "getBuyPrice",
        args: [outcomeIndex, parseUnits("1", 18)], // Price for 1 token
        query: {
            enabled: true
        }
    });

    useEffect(() => {
        if (action === "buy" && buyAmountQuote !== undefined) {
            const shares = parseFloat(formatUnits(buyAmountQuote, 18));
            const value = parseFloat(amount);
            const priceBefore = currentPriceData ? parseFloat(formatUnits(currentPriceData, 18)) : (selectedOutcome?.price || 0.5);

            // Price after is roughly (value / shares) but depends on liquidity
            // For simplicity in this mock UI, we show the average price
            const priceAverage = shares > 0 ? value / shares : priceBefore;

            setQuote({
                value,
                shares,
                priceBefore,
                priceAfter: priceAverage * 1.1, // Mocking impact for now
                priceAverage
            });
        } else if (action === "sell" && sellPriceQuote !== undefined) {
            const value = parseFloat(formatUnits(sellPriceQuote, 18));
            const shares = parseFloat(amount);
            const priceBefore = currentPriceData ? parseFloat(formatUnits(currentPriceData, 18)) : (selectedOutcome?.price || 0.5);
            const priceAverage = shares > 0 ? value / shares : priceBefore;

            setQuote({
                value,
                shares,
                priceBefore,
                priceAfter: priceAverage * 0.9, // Mocking impact for now
                priceAverage
            });
        } else {
            setQuote(null);
        }
    }, [action, amount, buyAmountQuote, sellPriceQuote, currentPriceData, selectedOutcome]);

    const availableBalance = useMemo(() => {
        if (action === "buy") {
            return musdcBalance ? parseFloat(formatUnits(musdcBalance, 18)) : 0;
        } else {
            const balance = outcomeIndex === 0 ? yesBalance : noBalance;
            return balance ? parseFloat(formatUnits(balance, 18)) : 0;
        }
    }, [action, musdcBalance, yesBalance, noBalance, outcomeIndex]);

    const handleTrade = async () => {
        if (!amount) return;
        const amountBigInt = parseUnits(amount, 18);

        if (action === "buy") {
            await buyTokens(outcomeIndex === 0 ? 'YES' : 'NO', amountBigInt);
        } else {
            await sellTokens(outcomeIndex === 0 ? 'YES' : 'NO', amountBigInt);
        }
        setAmount("");
    };

    const isMarketOpen = market.state === "open";

    return (
        <Card className="bg-card border-border overflow-hidden shadow-md">
            <CardContent className="p-0">
                <ActionTabs action={action} onChange={setAction} />

                <div className="p-4 space-y-6">
                    <OutcomeSelector
                        outcomes={market.outcomes}
                        selectedOutcomeId={selectedOutcomeId}
                        onSelect={(id) => onOutcomeChange?.(id)}
                    />

                    <div className="h-px bg-border/50" />

                    <AmountInput
                        value={amount}
                        onChange={setAmount}
                        availableBalance={availableBalance}
                        isConnected={isConnected}
                        isDisabled={!isMarketOpen || isTrading}
                    />

                    <div className="space-y-3">
                        {!isConnected ? (
                            <Button className="w-full h-11 text-base font-semibold" variant="secondary">
                                Connect Wallet to Trade
                            </Button>
                        ) : !isMarketOpen ? (
                            <Button className="w-full h-11 text-base font-semibold" disabled>
                                Market Closed
                            </Button>
                        ) : (
                            <Button
                                className={cn(
                                    "w-full h-11 text-base font-semibold transition-all",
                                    action === "buy"
                                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20"
                                        : "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/20",
                                )}
                                onClick={handleTrade}
                                disabled={!amount || isTrading || (action === "buy" ? !buyAmountQuote : !sellPriceQuote)}
                            >
                                {isTrading ? "Processing..." : (action === "buy" ? "Buy Outcome" : "Sell Outcome")}
                            </Button>
                        )}

                        <QuoteStats
                            quote={quote}
                            action={action}
                            amount={amount}
                            isLoading={false}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
