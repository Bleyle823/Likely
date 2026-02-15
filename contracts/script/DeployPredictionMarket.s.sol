// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "forge-std/console2.sol";
import {PredictionMarket} from "../src/PredictionMarket.sol";

contract DeployPredictionMarket is Script {
    function run() external returns (PredictionMarket market) {
        address token = vm.envAddress("PAYMENT_TOKEN");
        address forwarder = address(0x15fC6ae953E024d975e77382eEeC56A9101f9F88); // Default to Sepolia one, override if needed or if deploying to BNB
        // BNB Testnet Forwarder: The user didn't provide one. I should check if there is a known one or just use a placeholder.
        // For BNB Testnet, we might need a specific address. If not known, we can deploy a mock or ask the user.
        // However, the `ReceiverTemplate` expects a forwarder.
        // Let's assume for now we use a placeholder or the same address if using a cross-chain service, but likely it's different.
        // Since I don't have the BNB Testnet forwarder address handy, I will use a placeholder variable that MUST be set.

        // Actually, if we are deploying to BNB Testnet, we probably want to use the one from the docs or a mock.
        // "Integrates with Chainlink Runtime Environment".
        // Let's look for a "CRE Forwarder" on BNB Testnet.
        // If not found, I will add a comment.

        // On BNB Testnet, let's use a dummy or env var.
        address envForwarder = vm.envOr("CRE_FORWARDER", address(0));
        if (envForwarder != address(0)) {
            forwarder = envForwarder;
        }

        uint256 pk = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(pk);
        market = new PredictionMarket(token, forwarder);
        vm.stopBroadcast();

        console2.log("PredictionMarket deployed at:", address(market));
        console2.log("Payment token:", token);
        console2.log("CRE Forwarder:", forwarder);
    }
}
