import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Script to check deployer wallet balance on the current network
 */
async function main() {
    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);
    const network = await ethers.provider.getNetwork();

    console.log("\n=== Deployer Wallet Information ===\n");
    console.log("Network:", network.name, `(Chain ID: ${network.chainId})`);
    console.log("Deployer Address:", deployer.address);
    console.log("Balance:", ethers.formatEther(balance), "ETH");

    // Check if balance is sufficient for deployment
    const minimumBalance = ethers.parseEther("0.05");
    const recommendedBalance = ethers.parseEther("0.1");

    if (balance < minimumBalance) {
        console.log("\n⚠️  WARNING: Balance is too low for deployment!");
        console.log("   Minimum required: 0.05 ETH");
        console.log("   Recommended: 0.1 ETH");
        console.log("\n   Get Sepolia ETH from:");
        console.log("   - https://sepoliafaucet.com/");
        console.log("   - https://www.alchemy.com/faucets/ethereum-sepolia");
    } else if (balance < recommendedBalance) {
        console.log("\n⚠️  Balance is sufficient but low.");
        console.log("   Recommended: 0.1 ETH for comfortable deployment");
    } else {
        console.log("\n✅ Balance is sufficient for deployment!");
    }

    console.log("\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
