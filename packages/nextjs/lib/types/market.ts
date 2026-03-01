/**
 * Market Types
 */

export type MarketState = "open" | "closed" | "resolved";

export interface Outcome {
    id: number;
    title: string;
    price: number;
    shares: number;
    sharesHeld?: number;
    imageUrl?: string | null;
    priceCharts?: OutcomePriceCharts;
}

export interface PriceDataPoint {
    value: number;
    timestamp: number;
    date: string;
}

export interface PriceChartTimeframe {
    timeframe: "24h" | "7d" | "30d" | "all";
    prices: PriceDataPoint[];
    changePercent: number;
}

export type OutcomePriceCharts = PriceChartTimeframe[];

export interface Market {
    id: number;
    networkId: number;
    slug: string;
    title: string;
    description: string;
    state: MarketState;
    expiresAt: string;
    publishedAt?: string;
    voided: boolean;
    resolvedOutcomeId?: number | null;
    resolutionSource?: string | null;
    resolutionTitle?: string | null;
    imageUrl?: string | null;
    tokenAddress: string;
    topics: string[];
    liquidity: number;
    volume: number;
    volume24h: number;
    outcomes: Outcome[];
}

export interface MarketSummary {
    id: number;
    networkId: number;
    slug: string;
    title: string;
    description: string;
    state: MarketState;
    expiresAt: string;
    imageUrl?: string | null;
    tokenAddress: string;
    topics: string[];
    liquidity: number;
    volume: number;
    volume24h: number;
    outcomes: Outcome[];
}
