"use client";

import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { format } from "date-fns";
import type { Market } from "~~/lib/types";

interface ResolutionInfoProps {
  market: Market;
  resolvedAt?: string | null;
}

export function ResolutionInfo({ market, resolvedAt }: ResolutionInfoProps) {
  if (market.state !== "resolved") return null;

  const winningOutcome = market.outcomes.find((o) => o.id === (market.resolvedOutcomeId ?? 0));
  const winningTitle = market.resolutionTitle ?? winningOutcome?.title ?? "Unknown";
  const isYes = winningTitle.toUpperCase() === "YES";

  return (
    <div className="rounded-xl border border-success/30 bg-success/10 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <CheckCircleIcon className="w-5 h-5 text-success shrink-0" />
        <h3 className="font-semibold text-base-content">Resolution</h3>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-base-content/70">Resolved</span>
          <span
            className={`font-bold ${isYes ? "text-success" : "text-error"}`}
          >
            {winningTitle}
          </span>
        </div>

        {market.resolutionSource && (
          <div className="flex items-start justify-between gap-4">
            <span className="text-base-content/70 shrink-0">Source</span>
            <span className="text-base-content text-right font-medium">
              {market.resolutionSource}
            </span>
          </div>
        )}

        {resolvedAt && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-base-content/70">Resolved on</span>
            <span className="text-base-content font-medium">
              {format(new Date(resolvedAt), "MMM d, yyyy")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
