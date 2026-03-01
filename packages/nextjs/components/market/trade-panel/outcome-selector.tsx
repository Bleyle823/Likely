"use client";

import { cn } from "@/lib/utils";
import { getOutcomeColor } from "@/lib/outcome-colors";
import { formatPricePercent } from "@/lib/formatters";
import type { Outcome } from "@/lib/types";

interface OutcomeSelectorProps {
    outcomes: Outcome[];
    selectedOutcomeId: number;
    onSelect: (outcomeId: number) => void;
}

export function OutcomeSelector({
    outcomes,
    selectedOutcomeId,
    onSelect,
}: OutcomeSelectorProps) {
    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground font-medium">Select outcome</span>
            </div>
            <div className="space-y-1">
                {outcomes.map((outcome, index) => {
                    const isSelected = selectedOutcomeId === outcome.id;
                    const color = getOutcomeColor(outcome.title, index);

                    return (
                        <button
                            key={outcome.id}
                            onClick={() => onSelect(outcome.id)}
                            className={cn(
                                "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all border",
                                isSelected
                                    ? "bg-accent/50 border-primary shadow-sm"
                                    : "hover:bg-accent/30 border-transparent hover:border-border"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="h-2.5 w-2.5 rounded-full ring-2 ring-background"
                                    style={{ backgroundColor: color }}
                                />
                                <span
                                    className={cn(
                                        "truncate max-w-[180px]",
                                        isSelected && "font-semibold"
                                    )}
                                >
                                    {outcome.title}
                                </span>
                            </div>
                            <span
                                className={cn(
                                    "font-semibold tabular-nums",
                                    isSelected ? "text-foreground" : "text-muted-foreground"
                                )}
                            >
                                {formatPricePercent(outcome.price)}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
