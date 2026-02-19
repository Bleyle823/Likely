import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    const predictionMarket = await ethers.getContract("PredictionMarket", deployer);

    console.log("Requesting settlement for Market ID 1...");
    const tx = await predictionMarket.requestSettlement(1);
    await tx.wait();
    console.log(`Settlement requested! Tx Hash: ${tx.hash}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
