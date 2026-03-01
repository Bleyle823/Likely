"use client";

import { useScaffoldReadContract, useScaffoldWriteContract, useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { useAccount, useReadContract } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { useMarketStore, Market } from "./useMarketStore";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

// Minimal ERC20 ABI for balance/supply reads on dynamic token addresses
const ERC20_ABI = [
    { inputs: [{ name: "account", type: "address" }], name: "balanceOf", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
    { inputs: [], name: "totalSupply", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
] as const;

export const usePredictionMarket = () => {
    const { address: connectedAddress } = useAccount();
    const { updateMarket, setMarkets } = useMarketStore();
    const [isLoading, setIsLoading] = useState(false);

    // Read market details via Scaffold-ETH (resolves to Fuji deployedContracts.ts address)
    const { data: predictionDetails, isLoading: isDetailsLoading, refetch: refetchDetails } = useScaffoldReadContract({
        contractName: "PredictionMarket",
        functionName: "getPrediction",
    });

    // Get user YES token balances — dynamic address, use wagmi directly
    const { data: yesBalance, refetch: refetchYesBalance } = useReadContract({
        abi: ERC20_ABI,
        address: predictionDetails?.yesToken as `0x${string}` | undefined,
        functionName: "balanceOf",
        args: connectedAddress ? [connectedAddress] : undefined,
        query: { enabled: !!predictionDetails?.yesToken && !!connectedAddress },
    });

    const { data: noBalance, refetch: refetchNoBalance } = useReadContract({
        abi: ERC20_ABI,
        address: predictionDetails?.noToken as `0x${string}` | undefined,
        functionName: "balanceOf",
        args: connectedAddress ? [connectedAddress] : undefined,
        query: { enabled: !!predictionDetails?.noToken && !!connectedAddress },
    });

    // Payment token (MockERC20) balance — known deployed address, use scaffold-eth
    const { data: musdcBalance, refetch: refetchMusdcBalance } = useScaffoldReadContract({
        contractName: "MockERC20",
        functionName: "balanceOf",
        args: [connectedAddress],
    });

    // YES/NO token total supplies — dynamic addresses, use wagmi directly
    const { data: yesTotalSupply, refetch: refetchYesSupply } = useReadContract({
        abi: ERC20_ABI,
        address: predictionDetails?.yesToken as `0x${string}` | undefined,
        functionName: "totalSupply",
        query: { enabled: !!predictionDetails?.yesToken },
    });

    const { data: noTotalSupply, refetch: refetchNoSupply } = useReadContract({
        abi: ERC20_ABI,
        address: predictionDetails?.noToken as `0x${string}` | undefined,
        functionName: "totalSupply",
        query: { enabled: !!predictionDetails?.noToken },
    });

    const { data: predictionMarketInfo } = useDeployedContractInfo("PredictionMarket");

    // Sync store with contract data
    useEffect(() => {
        if (predictionDetails && yesTotalSupply !== undefined && noTotalSupply !== undefined && predictionMarketInfo) {
            const newMarket: Market = {
                id: "1", // Use "1" for the primary market
                address: predictionMarketInfo.address,
                question: predictionDetails.question,
                yesToken: predictionDetails.yesToken,
                noToken: predictionDetails.noToken,
                yesTokenReserve: predictionDetails.yesTokenReserve,
                noTokenReserve: predictionDetails.noTokenReserve,
                yesTotalSupply: yesTotalSupply,
                noTotalSupply: noTotalSupply,
                collateral: predictionDetails.collateral,
                lpTradingRevenue: predictionDetails.lpTradingRevenue,
                isReported: predictionDetails.isReported,
                winningToken: predictionDetails.winningToken,
                oracle: predictionDetails.oracle,
                owner: predictionDetails.predictionMarketOwner,
                initialProbability: Number(predictionDetails.initialProbability),
                percentageLocked: Number(predictionDetails.percentageLocked),
                initialTokenValue: predictionDetails.initialTokenValue,
                paymentToken: predictionDetails.paymentToken,
            };

            // Check if data actually changed to avoid unnecessary re-renders
            const currentMarkets = useMarketStore.getState().markets;
            const currentMarket = currentMarkets.find(m => m.id === "1");

            const hasChanged = !currentMarket ||
                currentMarket.yesTokenReserve !== newMarket.yesTokenReserve ||
                currentMarket.noTokenReserve !== newMarket.noTokenReserve ||
                currentMarket.yesTotalSupply !== newMarket.yesTotalSupply ||
                currentMarket.noTotalSupply !== newMarket.noTotalSupply ||
                currentMarket.isReported !== newMarket.isReported ||
                currentMarket.collateral !== newMarket.collateral ||
                currentMarket.lpTradingRevenue !== newMarket.lpTradingRevenue ||
                currentMarket.address !== newMarket.address;

            if (hasChanged) {
                setMarkets([newMarket]);
            }
        }
    }, [predictionDetails, yesTotalSupply, noTotalSupply, setMarkets, predictionMarketInfo]);

    const refetchAll = () => {
        refetchDetails();
        refetchYesBalance();
        refetchNoBalance();
        refetchMusdcBalance();
        refetchYesSupply();
        refetchNoSupply();
    };

    // Write functions
    const { writeContractAsync: buyTokensWrite } = useScaffoldWriteContract("PredictionMarket");

    const { writeContractAsync: sellTokensWrite } = useScaffoldWriteContract("PredictionMarket");

    const { writeContractAsync: redeemWrite } = useScaffoldWriteContract("PredictionMarket");

    const { writeContractAsync: requestSettlementWrite } = useScaffoldWriteContract("PredictionMarket");

    const buyTokens = async (outcome: 'YES' | 'NO', amount: bigint, minTokensOut: bigint = 0n) => {
        setIsLoading(true);
        try {
            const outcomeIndex = outcome === 'YES' ? 0 : 1;
            await buyTokensWrite({
                functionName: "buyTokens",
                args: [outcomeIndex, amount, minTokensOut],
            });
            toast.success(`Successfully bought ${outcome} tokens!`);
            refetchAll();
        } catch (e: any) {
            console.error("Error buying tokens", e);
            toast.error(e.message || "Error buying tokens");
        } finally {
            setIsLoading(false);
        }
    };

    const sellTokens = async (outcome: 'YES' | 'NO', amount: bigint, minRefund: bigint = 0n) => {
        setIsLoading(true);
        try {
            const outcomeIndex = outcome === 'YES' ? 0 : 1;
            await sellTokensWrite({
                functionName: "sellTokens",
                args: [outcomeIndex, amount, minRefund],
            });
            toast.success(`Successfully sold ${outcome} tokens!`);
            refetchAll();
        } catch (e: any) {
            console.error("Error selling tokens", e);
            toast.error(e.message || "Error selling tokens");
        } finally {
            setIsLoading(false);
        }
    };

    const redeemWinningTokens = async (amount: bigint) => {
        setIsLoading(true);
        try {
            await redeemWrite({
                functionName: "redeemWinningTokens",
                args: [amount],
            });
            toast.success("Successfully redeemed winning tokens!");
            refetchAll();
        } catch (e: any) {
            console.error("Error redeeming tokens", e);
            toast.error(e.message || "Error redeeming tokens");
        } finally {
            setIsLoading(false);
        }
    };

    const requestSettlement = async () => {
        setIsLoading(true);
        try {
            await requestSettlementWrite({
                functionName: "requestSettlement",
                args: [1n],
            });
            toast.success("Settlement requested! CRE workflow will process this shortly.");
            refetchAll();
        } catch (e: any) {
            console.error("Error requesting settlement", e);
            toast.error(e.message || "Error requesting settlement");
        } finally {
            setIsLoading(false);
        }
    };

    return {
        predictionDetails,
        isDetailsLoading,
        buyTokens,
        sellTokens,
        redeemWinningTokens,
        requestSettlement,
        isLoading,
        refetchDetails,
        yesBalance,
        noBalance,
        musdcBalance
    };
}
