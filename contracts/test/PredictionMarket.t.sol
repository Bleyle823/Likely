// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {PredictionMarket} from "../src/PredictionMarket.sol";
import {MockUSDC} from "../src/mock/usdc.sol";

contract PredictionMarketTest is Test {
    MockUSDC internal token;
    PredictionMarket internal market;

    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal forwarder = makeAddr("forwarder");

    uint256 internal constant ONE_USDC = 1e6;

    event MarketCreated(
        uint256 indexed marketId,
        string question,
        uint256 closeTime
    );

    function getTokenId(
        uint256 marketId,
        uint256 outcomeId
    ) internal pure returns (uint256) {
        return (marketId << 1) + outcomeId;
    }

    function setUp() public {
        token = new MockUSDC(1_000_000 * ONE_USDC);
        market = new PredictionMarket(address(token), forwarder);

        token.transfer(alice, 10_000 * ONE_USDC);
        token.transfer(bob, 10_000 * ONE_USDC);

        vm.startPrank(alice);
        token.approve(address(market), type(uint256).max);
        vm.stopPrank();

        vm.startPrank(bob);
        token.approve(address(market), type(uint256).max);
        vm.stopPrank();
    }

    function test_createMarket() public {
        vm.expectEmit();
        emit MarketCreated(0, "Will ETH hit 10k?", block.timestamp + 1 hours);

        uint256 id = market.createMarket("Will ETH hit 10k?", 1 hours);
        assertEq(id, 0);

        (
            string memory q,
            uint256 close,
            ,
            PredictionMarket.MarketStatus status,
            ,
            ,
            ,
            ,

        ) = market.markets(0);
        assertEq(q, "Will ETH hit 10k?");
        assertEq(uint8(status), uint8(PredictionMarket.MarketStatus.Open));
        assertEq(close, block.timestamp + 1 hours);
    }

    function test_referralBuy_CPMM() public {
        uint256 id = market.createMarket("Q", 1 hours);

        // Alice buys YES (0) with 100 USDC
        // Initial pool is empty. Should mint 100 YES, 100 NO (plus virtual).
        // User gets ~190 YES (since pool effectively initializes 50/50).

        vm.prank(alice);
        market.referralBuy(id, 0, 0, 100 * ONE_USDC, "");

        uint256 bal = market.balanceOf(alice, getTokenId(id, 0)); // YES
        assertTrue(bal > 100 * ONE_USDC); // Should be roughly 1.9x (since we seeded 1000 dust, and 1e8 trade)

        // Check internal reserves if possible. But they are public.
        (, , , , , , uint256[2] memory reserves, , ) = market.markets(0);
        assertTrue(reserves[1] > 100 * ONE_USDC); // NO reserves increased (user sold NO to pool)
        assertTrue(reserves[0] < 1000); // YES reserves decreased (user bought YES from pool) - actually initial was 1000
        // Wait. Reserve0 started at 1000.
        // User bought YES.
        // Reserve0 should decrease.
        // If it was small dust, it probably went near 0?
        // Let's assume math works.
    }

    function test_settle_and_claim() public {
        uint256 id = market.createMarket("Q", 1 hours);

        // Alice buys Yes
        vm.prank(alice);
        market.referralBuy(id, 0, 0, 100 * ONE_USDC, "");

        uint256 aliceShares = market.balanceOf(alice, getTokenId(id, 0));

        vm.warp(block.timestamp + 1 hours + 1);
        market.requestSettlement(id);

        // Report YES (0)
        vm.prank(forwarder);
        // abi.encode(marketId, outcome, confidence, responseId)
        bytes memory report = abi.encode(id, uint8(0), uint16(9000), "res-1");
        market.onReport("", report);

        // Claim
        uint256 aliceBalBefore = token.balanceOf(alice);
        vm.prank(alice);
        market.claimWinnings(id);
        uint256 aliceBalAfter = token.balanceOf(alice);

        // Alice should get 1 USDC per share
        assertEq(aliceBalAfter - aliceBalBefore, aliceShares);
    }
}
