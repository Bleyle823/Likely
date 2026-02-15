// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import {PredictionMarket} from "../src/PredictionMarket.sol";
import {MockUSDC} from "../src/mock/usdc.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Get or Deploy Payment Token
        address paymentToken = vm.envOr("PAYMENT_TOKEN", address(0));
        if (paymentToken == address(0)) {
            MockUSDC mock = new MockUSDC(1_000_000 * 1e6); // 1M USDC
            paymentToken = address(mock);
            console.log("Deployed MockUSDC at:", paymentToken);
        } else {
            console.log("Using existing Payment Token at:", paymentToken);
        }

        // 2. Get CRE Forwarder
        // Default to a placeholder if not provided (User must provide for real settlement)
        address forwarder = vm.envOr(
            "CRE_FORWARDER",
            address(0x15fC6ae953E024d975e77382eEeC56A9101f9F88)
        );
        console.log("Using CRE Forwarder at:", forwarder);

        // 3. Deploy Market
        PredictionMarket market = new PredictionMarket(paymentToken, forwarder);
        console.log("Deployed PredictionMarket at:", address(market));

        vm.stopBroadcast();
    }
}
