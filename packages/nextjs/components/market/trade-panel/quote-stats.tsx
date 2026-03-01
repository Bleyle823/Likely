"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface Quote {
    value: number; // For buy: cost in USDC, For sell: refund in USDC
    shares: number; // For buy: shares received, For sell: shares sold
    priceBefore: number;
    priceAfter: number;
    priceAverage: number;
}

interface QuoteStatsProps {
    quote: Quote | null;
    action: "buy" | "sell";
    amount: string;
    isLoading: boolean;
}

export function QuoteStats({ quote, action, amount, isLoading }: QuoteStatsProps) {
    const amountNum = parseFloat(amount) || 0;

    const estPayout = quote ? quote.shares : 0;
    const estProfit = quote ? (action === "buy" ? quote.shares - quote.value : quote.value) : 0;
    const estProfitPercent = quote && quote.value > 0 ? (estProfit / quote.value) * 100 : 0;

    return (
        <div className="pt-2 space-y-2.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
                <span>Price impact</span>
                {isLoading ? (
                    <Skeleton className="h-4 w-32" />
                ) : (
                    <span className="text-foreground font-medium tabular-nums">
                        {quote
                            ? `${(quote.priceBefore * 100).toFixed(1)}¢ → ${(quote.priceAfter * 100).toFixed(1)}¢`
                            : "—"}
                    </span>
                )}
            </div>

            <div className="flex justify-between text-muted-foreground">
                <span>{action === "buy" ? "Shares to receive" : "Shares to sell"}</span>
                {isLoading ? (
                    <Skeleton className="h-4 w-12" />
                ) : (
                    <span className="text-foreground font-medium tabular-nums">
                        {quote?.shares.toFixed(2) ?? "—"}
                    </span>
                )}
            </div>

            <div className="flex justify-between text-muted-foreground">
                <span>Avg. price</span>
                {isLoading ? (
                    <Skeleton className="h-4 w-16" />
                ) : (
                    <span className="text-foreground font-medium tabular-nums">
                        {quote ? `$${quote.priceAverage.toFixed(3)}/share` : "—"}
                    </span>
                )}
            </div>

            <div className="flex justify-between text-muted-foreground border-t border-border/50 pt-2">
                <span className="font-medium text-foreground">{action === "buy" ? "Potential payout" : "Estimated return"}</span>
                {isLoading ? (
                    <Skeleton className="h-4 w-24" />
                ) : (
                    <span className="text-foreground font-semibold tabular-nums">
                        {quote
                            ? `$${(action === "buy" ? quote.shares : quote.value).toFixed(2)}`
                            : "—"}
                    </span>
                )}
            </div>
        </div>
    );
}
