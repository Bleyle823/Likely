import { createPublicClient, http, parseAbiItem } from 'viem';
import { sepolia } from 'viem/chains';

const client = createPublicClient({
    chain: sepolia,
    transport: http()
});

async function main() {
    const logs = await client.getLogs({
        address: '0x7CFA136d26AE91a663D1d655D3E373D6a049198C',
        event: parseAbiItem('event SettlementRequested(uint256 indexed marketId, string question)'),
        fromBlock: 10100000n
    });

    console.log(`Found ${logs.length} logs`);
    for (const log of logs) {
        console.log(`Tx: ${log.transactionHash}, Market: ${log.args.marketId}, Question: ${log.args.question}`);
    }
}

main();
