"use client";

import { Badge } from "~~/components/ui/badge";
import { formatRelativeTime } from "~~/lib/formatters";
import { ResolutionInfo } from "./resolution-info";
import type { Market } from "~~/lib/types";

interface MarketHeaderProps {
  market: Market;
  resolvedAt?: string | null;
}

export function MarketHeader({ market, resolvedAt }: MarketHeaderProps) {
  const getStateColor = (state: string) => {
    switch (state) {
      case "open":
        return "bg-success/20 text-success border-success/30";
      case "resolved":
        return "bg-info/20 text-info border-info/30";
      case "closed":
        return "bg-base-300 text-base-content/70";
      default:
        return "bg-base-300 text-base-content/70";
    }
  };

  return (
    <div className="space-y-4">
      {/* Status and Topics */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={getStateColor(market.state)}>
          {market.state.toUpperCase()}
        </Badge>
        {market.topics.map((topic) => (
          <Badge key={topic} variant="outline" className="text-xs">
            {topic}
          </Badge>
        ))}
      </div>

      {/* Title */}
      <h1 className="text-2xl md:text-3xl font-bold leading-tight text-base-content">
        {market.title}
      </h1>

      {/* Description */}
      {market.description && (
        <p className="text-base-content/70 text-sm md:text-base leading-relaxed">
          {market.description}
        </p>
      )}

      {/* Resolution Info (Polymarket-style) */}
      {market.state === "resolved" && (
        <ResolutionInfo market={market} resolvedAt={resolvedAt} />
      )}

      {/* Market Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
        <div className="space-y-1">
          <p className="text-xs text-base-content/60 uppercase tracking-wide">
            Liquidity
          </p>
          <p className="text-lg font-semibold text-base-content">
            ${market.liquidity.toLocaleString()}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-base-content/60 uppercase tracking-wide">
            Volume
          </p>
          <p className="text-lg font-semibold text-base-content">
            ${market.volume.toLocaleString()}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-base-content/60 uppercase tracking-wide">
            24h Volume
          </p>
          <p className="text-lg font-semibold text-base-content">
            ${market.volume24h.toLocaleString()}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-base-content/60 uppercase tracking-wide">
            {market.state === "resolved" ? "Expired" : "Expires"}
          </p>
          <p className="text-lg font-semibold text-base-content">
            {formatRelativeTime(new Date(market.expiresAt))}
          </p>
        </div>
      </div>
    </div>
  );
}