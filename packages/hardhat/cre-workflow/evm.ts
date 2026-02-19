import {
    cre,
    type Runtime,
    getNetwork,
    hexToBase64,
    bytesToHex,
} from "@chainlink/cre-sdk";
import { encodeAbiParameters, parseAbiParameters } from "viem";
import { Config, GeminiResponse } from "./types";

export const reportOutcome = (
    runtime: Runtime<Config>,
    marketId: bigint,
    geminiResponse: GeminiResponse
): string => {
    const { result, confidence } = geminiResponse;

    // Map string result to uint8
    // 1 = NO
    // 2 = YES
    // 3 = INCONCLUSIVE
    let outcomeUint = 3;
    if (result === "NO") outcomeUint = 1;
    else if (result === "YES") outcomeUint = 2;

    // Encode the report data
    // (uint256 marketId, uint8 outcomeUint, uint16 confidenceBps, string evidenceURI)
    const reportData = encodeAbiParameters(
        parseAbiParameters(
            "uint256 marketId, uint8 outcomeUint, uint16 confidenceBps, string evidenceURI"
        ),
        [marketId, outcomeUint, confidence, "Gemini Search Grounding"]
    );

    const network = getNetwork({
        chainFamily: "evm",
        chainSelectorName: runtime.config.chainName,
    });

    if (!network) throw new Error(`Unknown chain: ${runtime.config.chainName}`);

    const evmClient = new cre.capabilities.EVMClient(network.chainSelector.selector);

    // Generate signed report
    const report = runtime.report({
        encodedPayload: hexToBase64(reportData),
        encoderName: "evm",
        signingAlgo: "ecdsa",
        hashingAlgo: "keccak256",
    }).result();

    // Write to contract
    const tx = evmClient.writeReport(runtime, {
        receiver: runtime.config.contractAddress,
        report,
        gasConfig: { gasLimit: "500000" }, // Hardcoded safe gas limit
    }).result();

    return bytesToHex(tx.txHash);
};
