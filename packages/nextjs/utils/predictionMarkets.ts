import { formatUnits, parseUnits } from 'viem';

/**
 * Format a bigint value to a human-readable string
 */
export function formatTokenAmount(value: bigint, decimals: number = 18, maxDecimals: number = 4): string {
    const formatted = formatUnits(value, decimals);
    const num = parseFloat(formatted);

    if (num === 0) return '0';
    if (num < 0.0001) return '<0.0001';
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;

    return num.toFixed(maxDecimals);
}

/**
 * Format a number as a percentage
 */
export function formatPercentage(value: number, decimals: number = 2): string {
    return `${value.toFixed(decimals)}%`;
}

/**
 * Format a USD value
 */
export function formatUSD(value: number, decimals: number = 2): string {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;
    return `$${value.toFixed(decimals)}`;
}

/**
 * Calculate probability from token reserves
 */
export function calculateProbability(
    yesReserve: bigint,
    noReserve: bigint,
    totalSupply: bigint
): number {
    if (totalSupply === 0n) return 50;

    const yesSold = totalSupply - yesReserve;
    const noSold = totalSupply - noReserve;
    const totalSold = yesSold + noSold;

    if (totalSold === 0n) return 50;

    const probability = (Number(yesSold) / Number(totalSold)) * 100;
    return Math.max(0, Math.min(100, probability));
}

/**
 * Calculate price for buying tokens
 */
export function calculateBuyPrice(
    outcome: 'YES' | 'NO',
    amount: bigint,
    yesReserve: bigint,
    noReserve: bigint,
    totalSupply: bigint,
    initialTokenValue: bigint
): bigint {
    const tokensSold = outcome === 'YES'
        ? totalSupply - yesReserve
        : totalSupply - noReserve;
    const totalSold = (totalSupply - yesReserve) + (totalSupply - noReserve);

    // Probability before trade
    const probBefore = totalSold === 0n
        ? 50n
        : (tokensSold * 100n) / totalSold;

    // Probability after trade
    const tokensAfter = tokensSold + amount;
    const totalAfter = totalSold + amount;
    const probAfter = (tokensAfter * 100n) / totalAfter;

    // Average probability
    const avgProb = (probBefore + probAfter) / 2n;

    // Price = initialTokenValue * avgProbability * amount / 100
    return (initialTokenValue * avgProb * amount) / 100n / parseUnits('1', 18);
}

/**
 * Calculate price for selling tokens
 */
export function calculateSellPrice(
    outcome: 'YES' | 'NO',
    amount: bigint,
    yesReserve: bigint,
    noReserve: bigint,
    totalSupply: bigint,
    initialTokenValue: bigint
): bigint {
    const tokensSold = outcome === 'YES'
        ? totalSupply - yesReserve
        : totalSupply - noReserve;
    const totalSold = (totalSupply - yesReserve) + (totalSupply - noReserve);

    if (tokensSold < amount) return 0n;

    // Probability before trade
    const probBefore = (tokensSold * 100n) / totalSold;

    // Probability after trade
    const tokensAfter = tokensSold - amount;
    const totalAfter = totalSold - amount;
    const probAfter = totalAfter === 0n ? 50n : (tokensAfter * 100n) / totalAfter;

    // Average probability
    const avgProb = (probBefore + probAfter) / 2n;

    // Price = initialTokenValue * avgProbability * amount / 100
    return (initialTokenValue * avgProb * amount) / 100n / parseUnits('1', 18);
}

/**
 * Calculate price impact percentage
 */
export function calculatePriceImpact(
    outcome: 'YES' | 'NO',
    amount: bigint,
    yesReserve: bigint,
    noReserve: bigint,
    totalSupply: bigint
): number {
    const tokensSold = outcome === 'YES'
        ? totalSupply - yesReserve
        : totalSupply - noReserve;
    const totalSold = (totalSupply - yesReserve) + (totalSupply - noReserve);

    if (totalSold === 0n) return 0;

    const probBefore = (Number(tokensSold) / Number(totalSold)) * 100;
    const tokensAfter = tokensSold + amount;
    const totalAfter = totalSold + amount;
    const probAfter = (Number(tokensAfter) / Number(totalAfter)) * 100;

    return Math.abs(probAfter - probBefore);
}

/**
 * Shorten an Ethereum address
 */
export function shortenAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format time ago
 */
export function timeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

/**
 * Generate mock historical data for charts
 */
export function generateMockHistoricalData(
    currentProbability: number,
    days: number = 7
): Array<{ timestamp: number; yes: number; no: number }> {
    const data: Array<{ timestamp: number; yes: number; no: number }> = [];
    const now = Date.now();
    const interval = (days * 24 * 60 * 60 * 1000) / 50; // 50 data points

    let prob = 50; // Start at 50%

    for (let i = 0; i < 50; i++) {
        const timestamp = now - (50 - i) * interval;

        // Random walk towards current probability
        const drift = (currentProbability - prob) * 0.1;
        const randomChange = (Math.random() - 0.5) * 5;
        prob = Math.max(1, Math.min(99, prob + drift + randomChange));

        data.push({
            timestamp,
            yes: prob,
            no: 100 - prob,
        });
    }

    return data;
}

/**
 * Generate mock volume data
 */
export function generateMockVolumeData(
    days: number = 7
): Array<{ timestamp: number; buy: number; sell: number }> {
    const data: Array<{ timestamp: number; buy: number; sell: number }> = [];
    const now = Date.now();
    const interval = (days * 24 * 60 * 60 * 1000) / 20; // 20 data points

    for (let i = 0; i < 20; i++) {
        const timestamp = now - (20 - i) * interval;
        const buy = Math.random() * 1000;
        const sell = Math.random() * 800;

        data.push({ timestamp, buy, sell });
    }

    return data;
}
