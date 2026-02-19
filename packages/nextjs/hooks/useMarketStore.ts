import { create } from 'zustand';

export interface Market {
    id: string;
    address: string;
    question: string;
    yesToken: string;
    noToken: string;
    yesTokenReserve: bigint;
    noTokenReserve: bigint;
    collateral: bigint;
    lpTradingRevenue: bigint;
    isReported: boolean;
    winningToken: string;
    oracle: string;
    owner: string;
    initialProbability: number;
    percentageLocked: number;
    initialTokenValue: bigint;
}

export interface Trade {
    id: string;
    marketId: string;
    trader: string;
    outcome: 'YES' | 'NO';
    type: 'BUY' | 'SELL';
    amount: bigint;
    price: bigint;
    timestamp: number;
    txHash: string;
}

export interface Position {
    marketId: string;
    yesBalance: bigint;
    noBalance: bigint;
    invested: bigint;
    currentValue: bigint;
}

interface MarketStore {
    markets: Market[];
    trades: Trade[];
    positions: Map<string, Position>;
    selectedMarket: Market | null;

    setMarkets: (markets: Market[]) => void;
    addMarket: (market: Market) => void;
    updateMarket: (id: string, updates: Partial<Market>) => void;
    setSelectedMarket: (market: Market | null) => void;

    addTrade: (trade: Trade) => void;
    getMarketTrades: (marketId: string) => Trade[];

    setPosition: (marketId: string, position: Position) => void;
    getPosition: (marketId: string) => Position | undefined;
}

export const useMarketStore = create<MarketStore>((set, get) => ({
    markets: [],
    trades: [],
    positions: new Map(),
    selectedMarket: null,

    setMarkets: (markets) => set({ markets }),

    addMarket: (market) => set((state) => ({
        markets: [...state.markets, market],
    })),

    updateMarket: (id, updates) => set((state) => ({
        markets: state.markets.map((m) =>
            m.id === id ? { ...m, ...updates } : m
        ),
    })),

    setSelectedMarket: (market) => set({ selectedMarket: market }),

    addTrade: (trade) => set((state) => ({
        trades: [trade, ...state.trades],
    })),

    getMarketTrades: (marketId) => {
        return get().trades.filter((t) => t.marketId === marketId);
    },

    setPosition: (marketId, position) => set((state) => {
        const newPositions = new Map(state.positions);
        newPositions.set(marketId, position);
        return { positions: newPositions };
    }),

    getPosition: (marketId) => {
        return get().positions.get(marketId);
    },
}));
