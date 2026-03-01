/**
 * Formatting Utilities
 * 
 * Common formatting functions for dates, prices, and other data.
 */

import { format, formatDistanceToNow } from "date-fns";

/**
 * Format a timestamp for chart axis display
 */
export function formatChartDate(timestamp: number, timeframe: string): string {
  const date = new Date(timestamp * 1000);
  
  switch (timeframe) {
    case "24h":
      return format(date, "HH:mm");
    case "7d":
      return format(date, "MMM d");
    case "30d":
      return format(date, "MMM d");
    case "all":
      return format(date, "MMM yyyy");
    default:
      return format(date, "MMM d");
  }
}

/**
 * Format a timestamp for tooltip display
 */
export function formatTooltipDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return format(date, "MMM d, yyyy 'at' HH:mm");
}

/**
 * Format a price as a percentage
 */
export function formatPricePercent(price: number): string {
  return `${(price * 100).toFixed(1)}%`;
}

/**
 * Format a large number with appropriate suffixes
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Format a token amount with proper decimals
 */
export function formatTokenAmount(amount: bigint, decimals: number, displayDecimals: number = 2): string {
  const divisor = BigInt(10 ** decimals);
  const quotient = Number(amount / divisor);
  const remainder = Number(amount % divisor);
  const fractional = remainder / Number(divisor);
  
  return (quotient + fractional).toFixed(displayDecimals);
}

/**
 * Format relative time
 */
export function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}