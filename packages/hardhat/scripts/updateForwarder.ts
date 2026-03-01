import { ethers } from "hardhat";

async function main() {
    const deploymentAddress = "0xc7e34D7722b056F6AdF0a4371A6246bf26464189";
    const fujiForwarder = "0x51E2a2A093eE60F78B4310E9e66DE8D889608B3E";

    console.log(`Updating forwarder address for PredictionMarket at ${deploymentAddress}...`);

    const [deployer] = await ethers.getSigners();
    const predictionMarket = await ethers.getContractAt("PredictionMarket", deploymentAddress, deployer);

    // Call setForwarderAddress
    const tx = await predictionMarket.setForwarderAddress(fujiForwarder);
    console.log(`Transaction submitted: ${tx.hash}`);

    await tx.wait();
    console.log(`Forwarder address updated to ${fujiForwarder} successfully!`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
