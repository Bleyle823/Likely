"use client";

import { MarketCard } from "./market-card";
import type { MarketSummary } from "~~/lib/types";

function MarketCardSkeleton() {
    return (
        <div className="bg-card rounded-xl border border-border/50 h-64 animate-pulse" />
    );
}

export function MarketListSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: count }).map((_, i) => (
                <MarketCardSkeleton key={i} />
            ))}
        </div>
    );
}

interface MarketListProps {
    markets: MarketSummary[];
    isLoading?: boolean;
}

export function MarketList({
    markets,
    isLoading,
}: MarketListProps) {
    if (isLoading) {
        return <MarketListSkeleton />;
    }

    if (markets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-card/10 rounded-2xl border border-dashed text-center">
                <h3 className="text-lg font-bold">No markets found</h3>
                <p className="text-muted-foreground text-sm">Check back later for new predictions.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {markets.map((market) => (
                <MarketCard key={market.id} market={market} />
            ))}
        </div>
    );
}
