import { cre, Runner, type Runtime, getNetwork, bytesToHex } from "@chainlink/cre-sdk";
import { decodeEventLog, parseAbi, keccak256, toHex } from "viem";
import { configSchema, Config } from "./types";
import { fetchGeminiOutcome } from "./gemini";
import { reportOutcome } from "./evm";

const eventAbi = parseAbi(["event SettlementRequested(uint256 indexed marketId, string question)"]);
const eventSignature = "SettlementRequested(uint256,string)";

const onSettlementRequested = async (runtime: Runtime<Config>, log: any): Promise<string> => {
    // Decode the log
    const topics = log.topics.map((t: any) => bytesToHex(t));
    const data = bytesToHex(log.data);

    const decoded = decodeEventLog({
        abi: eventAbi,
        data,
        topics,
    });

    const marketId = decoded.args.marketId;
    const question = decoded.args.question;

    runtime.log(`Settlement requested for Market ${marketId}: "${question}"`);

    // step 1: fetch outcome from Gemini
    const geminiResult = fetchGeminiOutcome(runtime, question);
    runtime.log(`Gemini result: ${JSON.stringify(geminiResult)}`);

    // step 2: report to chain
    const txHash = reportOutcome(runtime, marketId, geminiResult);
    runtime.log(`Report submitted. Tx Hash: ${txHash}`);
    return "SUCCESS";
};

const initWorkflow = (config: Config) => {
    const network = getNetwork({
        chainFamily: "evm",
        chainSelectorName: config.chainName,
    });

    if (!network) throw new Error(`Unknown chain: ${config.chainName}`);

    const evmClient = new cre.capabilities.EVMClient(network.chainSelector.selector);
    const topicHash = keccak256(toHex(eventSignature));

    return [
        cre.handler(
            evmClient.logTrigger({
                addresses: [config.contractAddress],
                topics: [{ values: [topicHash] }],
                confidence: "CONFIDENCE_LEVEL_FINALIZED",
            }),
            onSettlementRequested
        ),
    ];
};



export async function main() {
    try {
        const runner = await Runner.newRunner<Config>({ configSchema });
        await runner.run(initWorkflow);
    } catch (e: any) {
        console.error("Runner failed to start:");
        if (e.issues) {
            console.error(JSON.stringify(e.issues, null, 2));
        } else {
            console.error(e);
        }
    }
}

main();
