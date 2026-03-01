"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";

interface AmountInputProps {
    value: string;
    onChange: (value: string) => void;
    availableBalance: number | bigint;
    isConnected: boolean;
    isDisabled: boolean;
}

const PERCENTAGE_OPTIONS = [25, 50, 100] as const;

export function AmountInput({
    value,
    onChange,
    availableBalance,
    isConnected,
    isDisabled,
}: AmountInputProps) {
    const handlePercentageClick = (percent: number) => {
        const balanceNum = typeof availableBalance === "bigint" ? Number(availableBalance) : availableBalance;
        const calculatedValue = balanceNum * (percent / 100);
        if (calculatedValue > 0) {
            onChange(calculatedValue.toFixed(6)); // Higher precision for tokens
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-muted-foreground font-medium">Amount</label>
                {isConnected && (
                    <span className="text-sm text-muted-foreground">
                        Available{" "}
                        <span className="text-foreground font-semibold">
                            {typeof availableBalance === "bigint" ? availableBalance.toString() : availableBalance.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                        </span>
                    </span>
                )}
            </div>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Input
                        type="number"
                        placeholder="0.00"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={isDisabled}
                        min="0"
                        step="0.000001"
                        className="bg-background [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                </div>
                <div className="flex gap-1">
                    {PERCENTAGE_OPTIONS.map((percent) => (
                        <Button
                            key={percent}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="px-2 h-9 text-xs font-semibold"
                            onClick={() => handlePercentageClick(percent)}
                            disabled={isDisabled || !isConnected || availableBalance <= 0}
                        >
                            {percent}%
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
}
