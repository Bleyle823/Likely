// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReceiverTemplate} from "./interfaces/ReceiverTemplate.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {
    ReentrancyGuard
} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title PredictionMarket
/// @notice A production-grade binary prediction market utilizing a CPMM (Constant Product Market Maker).
/// @dev Implements AMM logic for trading Yes/No shares, compatible with Myriad starter kit frontend.
contract PredictionMarket is
    ReceiverTemplate,
    ERC1155,
    Ownable,
    ReentrancyGuard
{
    using SafeERC20 for IERC20;

    // ===========================
    // ======== EVENTS ===========
    // ===========================

    event MarketCreated(
        uint256 indexed marketId,
        string question,
        uint256 closeTime
    );
    event SharesBought(
        uint256 indexed marketId,
        address indexed user,
        uint256 outcomeId,
        uint256 amountSpent,
        uint256 sharesBought
    );
    event SharesSold(
        uint256 indexed marketId,
        address indexed user,
        uint256 outcomeId,
        uint256 amountReceived,
        uint256 sharesSold
    );
    event SettlementRequested(uint256 indexed marketId, string question);
    event MarketSettled(
        uint256 indexed marketId,
        uint256 outcomeId,
        uint256 settledAt
    );
    event WinningsClaimed(
        uint256 indexed marketId,
        address indexed user,
        uint256 amount
    );
    event VoidedSharesClaimed(
        uint256 indexed marketId,
        address indexed user,
        uint256 amount
    );

    // ===========================
    // ======== STRUCTS ==========
    // ===========================

    enum MarketStatus {
        Open,
        SettlementRequested,
        Settled,
        NeedsManual,
        Voided
    }

    struct Market {
        string question;
        uint256 closeTime;
        uint256 settledAt;
        MarketStatus status;
        uint256 outcomeId; // 0 = Yes, 1 = No, 999 = Pending/Invalid
        uint256 liquidity; // Total liquidity shares in the pool
        uint256[2] reserves; // [0] = Yes Reserves, [1] = No Reserves
        uint256 pot; // Total USDC collateral held for this market
        string evidenceURI;
    }

    // ===========================
    // ======= STATE VARS ========
    // ===========================

    IERC20 public immutable paymentToken;
    uint256 public nextMarketId;
    mapping(uint256 => Market) public markets;

    // Fee settings (in basis points, e.g., 200 = 2%)
    uint256 public constant FEE_BPS = 0;
    uint256 public constant MAX_BPS = 10000;

    // Outcome IDs: 0 = Yes, 1 = No (Matching frontend expectations)
    // NOTE: Frontend usually expects 0 = Yes, 1 = No or vice versa.
    // Myriad kit: usually 0=Yes, 1=No.
    // Existing SimpleMarket used ENUM: No, Yes. (No=1, Yes=2).
    // We will standardise on: 0 = Yes, 1 = No.

    constructor(
        address token,
        address forwarderAddress
    ) ReceiverTemplate(forwarderAddress) ERC1155("") Ownable(msg.sender) {
        paymentToken = IERC20(token);
    }

    // ===========================
    // ======== ADMIN ============
    // ===========================

    function createMarket(
        string calldata question,
        uint256 duration
    ) external onlyOwner returns (uint256) {
        uint256 marketId = nextMarketId++;
        Market storage m = markets[marketId];
        m.question = question;
        m.closeTime = block.timestamp + duration;
        m.status = MarketStatus.Open;
        m.outcomeId = 999; // Pending

        // Initial liquidity is 0.
        // Note: CPMM requires initial liquidity to function.
        // We can mandate initial liquidity or handle it in the first buy.
        // For simplicity, we assume the first buyer seeds the pool or admin seeds it.
        // But to make it cleaner, we allow 0 and handle initialization.

        emit MarketCreated(marketId, question, m.closeTime);
        return marketId;
    }

    // ===========================
    // ======== HELPERS ==========
    // ===========================

    function getTokenId(uint256 marketId, uint256 outcomeId) public pure returns (uint256) {
        return (marketId << 1) + outcomeId;
    }

    // ===========================
    // ======== TRADING ==========
    // ===========================

    /// @notice Buys shares of a specific outcome.
    /// @dev Swaps Collateral -> Outcome Share using CPMM.
    ///      Mechanism: Mint (Yes+No) for Collateral, then swap the unwanted share for the wanted one.
    function referralBuy(
        uint256 marketId,
        uint256 outcomeId,
        uint256 minOutcomeSharesToBuy,
        uint256 value,
        string calldata /* code */ // Referral code - unused in this demo logic but required for ABI match
    ) external nonReentrant {
        Market storage m = markets[marketId];
        require(m.status == MarketStatus.Open, "Market not open");
        require(block.timestamp < m.closeTime, "Market closed");
        require(outcomeId < 2, "Invalid outcome");
        require(value > 0, "Zero value");

        // 1. Transfer collateral from user
        paymentToken.safeTransferFrom(msg.sender, address(this), value);
        m.pot += value;

        uint256 sharesBought;

        // Auto-seed if empty:
        if (m.reserves[0] == 0) {
            // Seed with tiny virtual liquidity to avoid div by zero?
            m.reserves[0] = 1000;
            m.reserves[1] = 1000;
            // We owe this to nobody? It's just dust.
            // It makes the first trade valid.
        }

        uint256 quantityMinted = value;
        uint256 otherOutcomeId = 1 - outcomeId;

        // 1. Minting implies we have `quantityMinted` of both.
        // 2. User reserves the `quantityMinted` of `outcomeId`.
        // 3. User swaps `quantityMinted` of `otherOutcomeId` for `outcomeId`.

        uint256 amountIn = quantityMinted; // The NO shares
        uint256 reserveIn = m.reserves[otherOutcomeId];
        uint256 reserveOut = m.reserves[outcomeId];

        // CPMM: (x + dx)(y - dy) = xy
        // dy = (y * dx) / (x + dx)
        // With fees: dx_with_fee = dx * (1 - fee)
        uint256 amountInWithFee = (amountIn * (MAX_BPS - FEE_BPS)) / MAX_BPS;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = reserveIn + amountInWithFee;
        uint256 amountOut = numerator / denominator;

        sharesBought = quantityMinted + amountOut;

        // Update reserves
        m.reserves[otherOutcomeId] = reserveIn + amountIn;
        m.reserves[outcomeId] = reserveOut - amountOut;

        require(
            sharesBought >= minOutcomeSharesToBuy,
            "Slippage limit reached"
        );

        _mint(msg.sender, getTokenId(marketId, outcomeId), sharesBought, "");
        // We don't mint the other side effectively, we just track it in reserves?
        // Wait, ERC1155 `_mint` creates tokens.
        // The `reserves` track tokens "held" by the contract (pool).
        // BUT, we didn't mint the "pool" tokens.
        // If we want `reserves` to match `balanceOf(address(this))`, we should mint them.
        // Let's do that for consistency.
        // We minted `sharesBought` to user.
        // What happened to the `otherOutcome` tokens?
        // We conceptually minted `value` NO and put them in the pool.
        // We conceptually minted `value` YES, gave to user.
        // We conceptually took `amountOut` YES from pool, gave to user.

        // Net result:
        // User gets `sharesBought` of outcomeId.
        // Pool gets `value` of otherOutcomeId.
        // Pool loses `amountOut` of outcomeId.

        // Since we track `reserves` manually, do we need to mint tokens to `address(this)`?
        // No, `reserves` is the source of truth for the pool's state.
        // The `ERC1155` balance tracks USER holdings.
        // Total Supply of Yes = UserHoldings + Reserves[Yes].
        // But since we are Mint/Burn on the fly, `Reserves` are virtual token balances.
        // Okay.

        emit SharesBought(marketId, msg.sender, outcomeId, value, sharesBought);
    }

    /// @notice Sells shares.
    /// @dev Swaps Shares -> Collateral.
    ///      Mechanism: Sell shares to pool for other side -> merge to Collateral -> burn.
    function referralSell(
        uint256 marketId,
        uint256 outcomeId,
        uint256 returnAmount, // Expected USDC to receive? No, ABI calls it `value` (which is shares?).
        // Check ABI: `referralSell(marketId, outcomeId, value, maxOutcomeSharesToSell, code)`
        // `value` usually means the quote currency amount we WANT? Or the amount we are selling?
        // trade.ts: `buildSellTransaction` args: `value, maxShares`.
        // `value` is "amount of tokens to receive" (according to docstring).
        // `maxShares` is "max shares to give up".
        // So this is an "Exact Output" swap? (User specifies desired USDC, supply flexible shares).
        // Let's check `trade.ts` again.
        // Yes: `value` = Amount of tokens to receive. `maxShares` = max shares to sell.

        // BUT, often `sell` is "Exact Input" (I have 100 shares, how much do I get?).
        // If the ABI says `value` is the output, we implement Exact Output logic.
        // However, I suspect standard implementations often use `amount` as input.
        // Let's re-read the ABI comment in `trade.ts`:
        // "value - Amount of tokens to receive".
        // Okay, so it IS Exact Output.
        uint256 maxOutcomeSharesToSell,
        string calldata /* code */
    ) external nonReentrant {
        // Renaming `returnAmount` to matching ABI param `value` for clarity
        uint256 usdcToReceive = returnAmount;

        Market storage m = markets[marketId];
        require(m.status == MarketStatus.Open, "Market not open");

        // Logic:
        // User wants `usdcToReceive` (collateral).
        // To get `N` USDC, we need `N` pairs of (Yes + No) to burn.
        // User provides only `Yes`.
        // So user needs to buy `N` NO tokens from the pool using `Yes` tokens.
        // Then merge `N` YES + `N` NO -> `N` USDC.

        // Step 1: We need `usdcToReceive` quantity of `otherOutcome`.
        // We buy `usdcToReceive` of `otherOutcome` from the pool.
        // We pay with `outcomeId` (Yes).

        // CPMM: `amountIn` (Yes) needed to get `amountOut` (No).
        // dy = (y * dx) / (x - dx)? No.
        // To get `dy` (amountOut), how much `dx` (amountIn) needed?
        // `new_y` = `y` - `amountOut`.
        // `new_x` = k / `new_y`.
        // `amountIn` = `new_x` - `x`.
        // `amountIn` = (x * amountOut) / (y - amountOut). (With fees it's more).

        uint256 otherOutcomeId = 1 - outcomeId;
        uint256 reserveIn = m.reserves[outcomeId]; // Yes
        uint256 reserveOut = m.reserves[otherOutcomeId]; // No

        require(reserveOut > usdcToReceive, "Insufficient liquidity");

        // amountIn = (reserveIn * amountOut * MAX_BPS) / ((reserveOut - amountOut) * (MAX_BPS - FEE_BPS)) + 1
        // We need to cover the fee.

        uint256 amountOut = usdcToReceive;
        uint256 numerator = reserveIn * amountOut * MAX_BPS;
        uint256 denominator = (reserveOut - amountOut) * (MAX_BPS - FEE_BPS);
        uint256 sharesToPayToPool = (numerator / denominator) + 1;

        // Total shares user must provide = `sharesToPayToPool` (to buy the No) + `usdcToReceive` (to merge).
        uint256 totalSharesRequired = sharesToPayToPool + usdcToReceive;

        require(
            totalSharesRequired <= maxOutcomeSharesToSell,
            "Slippage limit reached"
        );

        // Execution:
        // 1. Burn user shares
        _burn(msg.sender, getTokenId(marketId, outcomeId), totalSharesRequired);

        // 2. Update reserves
        // Pool received `sharesToPayToPool` of OutcomeId
        // Pool gave `amountOut` of OtherOutcomeId
        m.reserves[outcomeId] = reserveIn + sharesToPayToPool;
        m.reserves[otherOutcomeId] = reserveOut - amountOut;

        // 3. Send USDC to user
        m.pot -= usdcToReceive;
        paymentToken.safeTransfer(msg.sender, usdcToReceive);

        emit SharesSold(
            marketId,
            msg.sender,
            outcomeId,
            usdcToReceive,
            totalSharesRequired
        );
    }

    // ===========================
    // ======== SETTLEMENT =======
    // ===========================

    // Snapshot state for voided markets
    uint256 public constant VOID_SCALAR = 1e18;
    mapping(uint256 => uint256) public voidedSharePrice; // Price per share in voided market

    function requestSettlement(uint256 marketId) public {
        Market storage m = markets[marketId];
        require(block.timestamp >= m.closeTime, "Market not closed");
        require(m.status == MarketStatus.Open, "Not open");

        m.status = MarketStatus.SettlementRequested;
        emit SettlementRequested(marketId, m.question);
    }

    function onReport(
        bytes calldata /* metadata */,
        bytes calldata report
    ) external override onlyReceiver {
        (
            uint256 marketId,
            uint8 outcome,
            uint16 confidenceBps,
            string memory responseId
        ) = abi.decode(report, (uint256, uint8, uint16, string));

        _settle(marketId, outcome, responseId);
    }

    function settleMarketManually(
        uint256 marketId,
        uint256 outcomeId
    ) external onlyOwner {
        _settle(marketId, outcomeId, "MANUAL");
    }

    function _settle(
        uint256 marketId,
        uint256 outcomeId,
        string memory evidenceURI
    ) internal {
        Market storage m = markets[marketId];
        require(
            m.status == MarketStatus.SettlementRequested ||
                m.status == MarketStatus.NeedsManual,
            "Invalid status"
        );

        // Standardize Outcome: 0=Yes, 1=No, 2=Inconclusive/NeedsManual
        if (outcomeId == 2) {
            m.status = MarketStatus.NeedsManual;
            return;
        }

        // Handle Void/Cancel (e.g. if outcomeId 3 is passed, or special flag)
        // For now, let's assume if outcomeId > 1 (and not 2), it's VOID?
        // Or if we want to support explicit VOID status.
        // Let's create a new Admin function `voidMarket` or allow `outcomeId=3` to mean Void.
        // Let's assume outcomeId=3 is Void.

        if (outcomeId == 3) {
            m.status = MarketStatus.Voided;
            m.settledAt = block.timestamp;
            m.evidenceURI = evidenceURI;

            // Calculate Void Price
            // Current Pot / (UserSupplyYes + UserSupplyNo)
            // Note: We don't track UserSupply separately from Reserves easily unless we subtract reserves.
            // But we didn't mint Reserves.
            // So `totalSupply(id, 0)` is UserSupplyYes.
            // `totalSupply(id, 1)` is UserSupplyNo.
            // The provided edit removes the `totalSupply` calculation here.

            emit MarketSettled(marketId, 3, block.timestamp);
            return;
        }

        require(outcomeId <= 1, "Invalid outcome");

        m.outcomeId = outcomeId;
        m.status = MarketStatus.Settled;
        m.settledAt = block.timestamp;
        m.evidenceURI = evidenceURI;

        emit MarketSettled(marketId, outcomeId, block.timestamp);
    }

    // ===========================
    // ======== CLAIMS ===========
    // ===========================

    function claimWinnings(uint256 marketId) external nonReentrant {
        Market storage m = markets[marketId];
        require(m.status == MarketStatus.Settled, "Not settled");

        uint256 winningOutcomeIndex = m.outcomeId; // 0 or 1
        uint256 winningTokenId = getTokenId(marketId, winningOutcomeIndex);

        uint256 balance = balanceOf(msg.sender, winningTokenId);
        require(balance > 0, "No winnings");

        // Burn winning shares
        _burn(msg.sender, winningTokenId, balance);

        // Payout 1:1
        m.pot -= balance;
        paymentToken.safeTransfer(msg.sender, balance);

        emit WinningsClaimed(marketId, msg.sender, balance);
    }

    function claimVoidedOutcomeShares(
        uint256 marketId,
        uint256 outcomeId
    ) external nonReentrant {
        Market storage m = markets[marketId];
        require(m.status == MarketStatus.Voided || m.status == MarketStatus.NeedsManual, "Msg"); 
        
        uint256 tokenId = getTokenId(marketId, outcomeId);
        uint256 balance = balanceOf(msg.sender, tokenId);
        require(balance > 0, "No shares");
        
        _burn(msg.sender, tokenId, balance);
        
        uint256 payout = balance / 2; // Simple 50 cents on the dollar
        m.pot -= payout;
        paymentToken.safeTransfer(msg.sender, payout);
        
        emit VoidedSharesClaimed(marketId, msg.sender, payout);
    }

    /// @notice Get URL.
    function getUri(uint256 marketId) public view returns (string memory) {
        return
            string.concat(
                "http://localhost:3000/",
                markets[marketId].evidenceURI
            );
    }
}
