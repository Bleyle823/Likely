"use client";

import { cn } from "@/lib/utils";

export type TradeAction = "buy" | "sell";

interface ActionTabsProps {
    action: TradeAction;
    onChange: (action: TradeAction) => void;
}

export function ActionTabs({ action, onChange }: ActionTabsProps) {
    return (
        <div className="flex border-b border-border">
            <button
                onClick={() => onChange("buy")}
                className={cn(
                    "flex-1 py-3 text-sm font-medium transition-colors",
                    action === "buy"
                        ? "text-foreground border-b-2 border-primary"
                        : "text-muted-foreground hover:text-foreground"
                )}
            >
                Buy
            </button>
            <button
                onClick={() => onChange("sell")}
                className={cn(
                    "flex-1 py-3 text-sm font-medium transition-colors",
                    action === "sell"
                        ? "text-foreground border-b-2 border-primary"
                        : "text-muted-foreground hover:text-foreground"
                )}
            >
                Sell
            </button>
        </div>
    );
}
