import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploys the PredictionMarket contract and MockERC20 payment token
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployPredictionMarket: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  try {
    const { deployer } = await hre.getNamedAccounts();
    const { deploy } = hre.deployments;

    console.log("\n🚀 Deploying Prediction Market Platform...\n");

    // Step 1: Deploy MockERC20 as payment token (for testing)
    console.log("📝 Deploying MockERC20 payment token...");
    const mockERC20 = await deploy("MockERC20", {
      from: deployer,
      args: ["Mock USDC", "MUSDC"],
      log: true,
      autoMine: true,
    });
    console.log(`✅ MockERC20 deployed at: ${mockERC20.address}\n`);

    // Step 2: Get deployer signer and check balance
    const signers = await hre.ethers.getSigners();
    const deployerSigner = signers[0];
    const mockERC20Contract = await hre.ethers.getContractAt("MockERC20", mockERC20.address);
    const deployerBalance = await mockERC20Contract.balanceOf(deployer);
    console.log("Deployer MockERC20 balance:", hre.ethers.formatUnits(deployerBalance, 18), "MUSDC");

    // Step 3: Configuration parameters
    console.log("Preparing PredictionMarket deployment...");
    const liquidityProvider = deployer;
    const oracle = deployer;
    const question = "Will Bitcoin reach $100,000 by end of 2026?";
    const initialTokenValue = hre.ethers.parseUnits("1", 18);
    const initialYesProbability = 50;
    const percentageToLock = 10;
    const paymentToken = mockERC20.address;
    const forwarderAddress = deployer;

    // Adjust liquidity based on network
    // For local testing: 1000 tokens
    // For testnets (Sepolia): 100 tokens (easier to manage with faucets/minting)
    const isLocal = hre.network.name === "localhost" || hre.network.name === "hardhat";
    const initialLiquidityAmount = hre.ethers.parseUnits(isLocal ? "1000" : "100", 18);

    console.log(`Using initial liquidity: ${hre.ethers.formatUnits(initialLiquidityAmount, 18)} MUSDC on network: ${hre.network.name}`);

    // Step 4: Deploy PredictionMarket (without initial liquidity transfer)
    console.log("Deploying PredictionMarket contract...");
    const predictionMarket = await deploy("PredictionMarket", {
      from: deployer,
      args: [
        liquidityProvider,
        oracle,
        question,
        initialTokenValue,
        initialYesProbability,
        percentageToLock,
        paymentToken,
        forwarderAddress,
        initialLiquidityAmount,
      ],
      log: true,
      autoMine: true,
      gasLimit: 10000000,
    });

    console.log("PredictionMarket deployed at:", predictionMarket.address);

    // Step 5: Approve and initialize the market
    console.log("Approving and initializing market...");
    const predictionMarketContract = await hre.ethers.getContractAt("PredictionMarket", predictionMarket.address);

    // Approve the contract to spend tokens
    const approveTx = await mockERC20Contract.approve(predictionMarket.address, initialLiquidityAmount);
    await approveTx.wait();
    console.log("Approved contract to spend tokens");

    // Initialize the market (transfers the initial liquidity)
    const initTx = await predictionMarketContract.initialize();
    await initTx.wait();
    console.log("Market initialized with liquidity");

    // Step 6: Get contract instance and display details
    const details = await predictionMarketContract.getPrediction();

    console.log("Market Details:");
    console.log("  Question:", details.question);
    console.log("  YES Token:", details.yesToken);
    console.log("  NO Token:", details.noToken);
    console.log("  Collateral:", hre.ethers.formatUnits(details.collateral, 18), "MUSDC");
    console.log("  YES Reserve:", hre.ethers.formatUnits(details.yesTokenReserve, 18));
    console.log("  NO Reserve:", hre.ethers.formatUnits(details.noTokenReserve, 18));
    console.log("  Oracle:", details.oracle);
    console.log("  Owner:", details.predictionMarketOwner);

    // Step 7: Disable forwarder check for local testing
    console.log("Disabling Forwarder check for local testing...");
    const setForwarderTx = await predictionMarketContract.setForwarderAddress(hre.ethers.ZeroAddress);
    await setForwarderTx.wait();
    console.log("Forwarder check disabled");

    console.log("Deployment Complete!");
    console.log("Next Steps:");
    console.log("  1. Start the frontend: yarn start");
    console.log("  2. Run CRE workflow: yarn workspace prediction-market-cre-workflow simulate");
    console.log("  3. Test the market at http://localhost:3000");

    // Step 8: Save deployment info for CRE workflow
    const fs = require("fs");
    const path = require("path");
    const configPath = path.join(__dirname, "../cre-workflow/config.json");

    try {
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      config.evms[0].marketAddress = predictionMarket.address;
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log("Updated cre-workflow/config.json with market address");
    } catch (error) {
      console.log("Could not auto-update cre-workflow/config.json");
      console.log("Please update manually");
    }

    // Step 9: Generate deployedContracts.ts for frontend (Localhost only)
    if (hre.network.name === "localhost" || hre.network.name === "hardhat") {
      console.log("Generating deployedContracts.ts for frontend...");
      try {
        const { execSync } = require("child_process");
        execSync("yarn hardhat run scripts/generateDeployedContracts.ts", { cwd: __dirname + "/..", stdio: "inherit" });
      } catch (error) {
        console.log("Could not generate deployedContracts.ts");
      }
    } else {
      console.log("Skipping manual contract generation (handled by hardhat-deploy for testnets)");
    }
  } catch (error) {
    console.error("Deployment Failed!");
    console.error("Error:", error);
    throw error;
  }
};

export default deployPredictionMarket;
deployPredictionMarket.tags = ["PredictionMarket"];
