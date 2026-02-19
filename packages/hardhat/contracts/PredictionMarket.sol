//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import { PredictionMarketToken } from "./PredictionMarketToken.sol";
import { ReceiverTemplate } from "./interfaces/ReceiverTemplate.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract PredictionMarket is ReceiverTemplate {
    using SafeERC20 for IERC20;
    /////////////////
    /// Errors //////
    /////////////////

    error PredictionMarket__MustProvideInitialLiquidity();
    error PredictionMarket__InvalidProbability();
    error PredictionMarket__PredictionAlreadyReported();
    error PredictionMarket__OnlyOracleCanReport();
    error PredictionMarket__OwnerCannotCall();
    error PredictionMarket__PredictionNotReported();
    error PredictionMarket__InsufficientWinningTokens();
    error PredictionMarket__AmountMustBeGreaterThanZero();
    error PredictionMarket__PaymentTransferFailed();
    error PredictionMarket__InsufficientTokenReserve(Outcome _outcome, uint256 _amountToken);
    error PredictionMarket__InsufficientBalance(uint256 _tradingAmount, uint256 _userBalance);
    error PredictionMarket__InsufficientAllowance(uint256 _tradingAmount, uint256 _allowance);
    error PredictionMarket__InsufficientLiquidity();
    error PredictionMarket__InvalidPercentageToLock();

    //////////////////////////
    /// State Variables //////
    //////////////////////////

    enum Outcome {
        YES,
        NO
    }

    struct PredictionDetails {
        string question;
        string outcome1;
        string outcome2;
        address oracle;
        uint256 initialTokenValue;
        uint256 yesTokenReserve;
        uint256 noTokenReserve;
        bool isReported;
        address yesToken;
        address noToken;
        address winningToken;
        uint256 collateral;
        uint256 lpTradingRevenue;
        address predictionMarketOwner;
        uint256 initialProbability;
        uint256 percentageLocked;
    }

    uint256 private constant PRECISION = 1e18;

    /// Checkpoint 2: Immutable Variables ///
    address public immutable i_oracle;
    uint256 public immutable i_initialTokenValue;
    PredictionMarketToken public immutable i_yesToken;
    PredictionMarketToken public immutable i_noToken;
    uint8 public immutable i_percentageLocked;
    uint8 public immutable i_initialYesProbability;
    IERC20 public immutable i_paymentToken;

    /// Checkpoint 2: State Variables ///
    uint256 public s_collateral;
    uint256 public s_pendingInitialLiquidity; // Liquidity amount pending initialization
    uint256 public s_lpTradingRevenue;
    string public s_question;

    /// Checkpoint 5: Settlement State ///
    bool public s_isReported;
    PredictionMarketToken public s_winningToken;
    uint16 public s_confidenceBps;
    string public s_evidenceURI;

    /// Owner tracking handled by inherited Ownable ///

    /////////////////////////
    /// Events //////
    /////////////////////////

    event TokensPurchased(address indexed buyer, Outcome outcome, uint256 amount, uint256 paymentAmount);
    event TokensSold(address indexed seller, Outcome outcome, uint256 amount, uint256 paymentAmount);
    event WinningTokensRedeemed(address indexed redeemer, uint256 amount, uint256 payoutAmount);
    event MarketReported(address indexed oracle, Outcome winningOutcome, address winningToken);
    event MarketResolved(address indexed resolver, uint256 payoutAmount);
    event LiquidityAdded(address indexed provider, uint256 amount, uint256 tokensAmount);
    event LiquidityRemoved(address indexed provider, uint256 amount, uint256 tokensAmount);

    /// CRE Settlement Event ///
    event SettlementRequested(uint256 indexed marketId, string question);

    /////////////////
    /// Modifiers ///
    /////////////////

    /// Checkpoint 5: Prevent actions after market is settled ///
    modifier predictionNotReported() {
        if (s_isReported) revert PredictionMarket__PredictionAlreadyReported();
        _;
    }

    /// Owner modifier is inherited from Ownable ///

    /// Checkpoint 6: Only oracle can report (for manual fallback) ///
    modifier onlyOracle() {
        if (msg.sender != i_oracle) revert PredictionMarket__OnlyOracleCanReport();
        _;
    }

    /// Checkpoint 8: Prevent owner from trading ///
    modifier notOwner() {
        if (msg.sender == owner()) revert PredictionMarket__OwnerCannotCall();
        _;
    }

    /// Amount must be greater than zero ///
    modifier greaterThanZero(uint256 _amount) {
        if (_amount == 0) revert PredictionMarket__AmountMustBeGreaterThanZero();
        _;
    }

    //////////////////
    ////Constructor///
    //////////////////

    constructor(
        address _liquidityProvider,
        address _oracle,
        string memory _question,
        uint256 _initialTokenValue,
        uint8 _initialYesProbability,
        uint8 _percentageToLock,
        address _paymentToken,
        address _forwarderAddress,
        uint256 _initialLiquidityAmount
    ) ReceiverTemplate(_forwarderAddress) {
        //// Checkpoint 2: Validate inputs and set immutable variables ////
        if (_initialLiquidityAmount == 0) revert PredictionMarket__AmountMustBeGreaterThanZero();
        if (_initialYesProbability > 100) revert PredictionMarket__InvalidProbability();
        if (_percentageToLock > 100) revert PredictionMarket__InvalidPercentageToLock();

        i_oracle = _oracle;
        i_initialTokenValue = _initialTokenValue;
        i_initialYesProbability = _initialYesProbability;
        i_percentageLocked = _percentageToLock;
        i_paymentToken = IERC20(_paymentToken);
        s_question = _question;

        // Set initial collateral
        s_collateral = _initialLiquidityAmount;

        // Calculate initial token amount based on liquidity and token value
        uint256 initialTokenAmount = (_initialLiquidityAmount * PRECISION) / i_initialTokenValue;

        //// Checkpoint 3: Deploy tokens and implement probability locking ////

        // Calculate locked tokens to simulate initial probability
        uint256 lockedYes = (initialTokenAmount * _initialYesProbability * _percentageToLock * 2) / 10000;
        uint256 lockedNo = (initialTokenAmount * (100 - _initialYesProbability) * _percentageToLock * 2) / 10000;

        // Create tokens with split minting (avoiding transfer calls)
        i_yesToken = new PredictionMarketToken("Yes", "Y", _liquidityProvider, initialTokenAmount, lockedYes);
        i_noToken = new PredictionMarketToken("No", "N", _liquidityProvider, initialTokenAmount, lockedNo);

        // Set owner
        _transferOwnership(_liquidityProvider);

        // NOTE: Initial liquidity transfer moved to initialize() function
        // to avoid chicken-and-egg problem during deployment
        // i_paymentToken.safeTransferFrom(
        //     _liquidityProvider,
        //     address(this),
        //     _initialLiquidityAmount
        // );

        // Store initial liquidity amount for later initialization
        s_collateral = 0; // Will be set in initialize()
        s_pendingInitialLiquidity = _initialLiquidityAmount;

        emit LiquidityAdded(_liquidityProvider, _initialLiquidityAmount, initialTokenAmount);
    }

    /// @notice Initialize the market by transferring initial liquidity
    /// @dev Must be called immediately after deployment by the liquidity provider
    function initialize() external {
        if (s_collateral != 0) revert("Already initialized");
        if (s_pendingInitialLiquidity == 0) revert("No pending liquidity");

        uint256 amount = s_pendingInitialLiquidity;
        s_pendingInitialLiquidity = 0;
        s_collateral = amount;

        // Transfer initial liquidity from owner
        i_paymentToken.safeTransferFrom(owner(), address(this), amount);
    }

    /////////////////
    /// Functions ///
    /////////////////

    /**
     * @notice Add liquidity to the prediction market and mint tokens
     * @dev Only the owner can add liquidity and only if the prediction is not reported
     */
    function addLiquidity(uint256 _amount) external onlyOwner predictionNotReported {
        //// Checkpoint 4 ////
        if (_amount == 0) revert PredictionMarket__AmountMustBeGreaterThanZero();

        uint256 tokensToMint = (_amount * PRECISION) / i_initialTokenValue;
        s_collateral += _amount;

        // Transfer payment tokens from LP
        i_paymentToken.safeTransferFrom(msg.sender, address(this), _amount);

        // Mint proportional YES and NO tokens
        i_yesToken.mint(address(this), tokensToMint);
        i_noToken.mint(address(this), tokensToMint);

        emit LiquidityAdded(msg.sender, _amount, tokensToMint);
    }

    /**
     * @notice Remove liquidity from the prediction market and burn tokens
     * @dev Only the owner can remove liquidity and only if the prediction is not reported
     * @param _amountToWithdraw Amount of payment tokens to withdraw from liquidity pool
     */
    function removeLiquidity(uint256 _amountToWithdraw) external onlyOwner predictionNotReported {
        //// Checkpoint 4 ////
        if (_amountToWithdraw > s_collateral) revert PredictionMarket__InsufficientLiquidity();

        uint256 tokensToBurn = (_amountToWithdraw * PRECISION) / i_initialTokenValue;

        // Ensure contract has enough tokens to burn
        if (i_yesToken.balanceOf(address(this)) < tokensToBurn) {
            revert PredictionMarket__InsufficientTokenReserve(Outcome.YES, tokensToBurn);
        }
        if (i_noToken.balanceOf(address(this)) < tokensToBurn) {
            revert PredictionMarket__InsufficientTokenReserve(Outcome.NO, tokensToBurn);
        }

        s_collateral -= _amountToWithdraw;

        // Burn tokens
        i_yesToken.burn(address(this), tokensToBurn);
        i_noToken.burn(address(this), tokensToBurn);

        // Transfer payment tokens back to owner
        i_paymentToken.safeTransfer(msg.sender, _amountToWithdraw);

        emit LiquidityRemoved(msg.sender, _amountToWithdraw, tokensToBurn);
    }

    /**
     * @notice Report the winning outcome for the prediction
     * @dev Only the oracle can report the winning outcome and only if the prediction is not reported
     * @param _winningOutcome The winning outcome (YES or NO)
     */
    /// @notice CRE settlement integration - processes automated AI settlement
    /// @dev Overrides ReceiverTemplate._processReport to handle CRE reports
    function _processReport(bytes calldata report) internal override {
        //// Checkpoint 5: CRE Settlement ////
        // Decode the report from CRE workflow
        // Format: (marketId, outcome, confidenceBps, evidenceURI)
        // Note: marketId is not used in single-market contract, but kept for compatibility
        (uint256 marketId, uint8 outcomeUint, uint16 confidenceBps, string memory evidenceURI) = abi.decode(
            report,
            (uint256, uint8, uint16, string)
        );

        if (s_isReported) revert PredictionMarket__PredictionAlreadyReported();

        // Map outcome: 1=NO, 2=YES, 3=INCONCLUSIVE (handle manually)
        Outcome winningOutcome;
        if (outcomeUint == 1) {
            winningOutcome = Outcome.NO;
            s_winningToken = i_noToken;
        } else if (outcomeUint == 2) {
            winningOutcome = Outcome.YES;
            s_winningToken = i_yesToken;
        } else {
            // INCONCLUSIVE - require manual settlement
            revert("Inconclusive result - use manual settlement");
        }

        s_isReported = true;
        s_confidenceBps = confidenceBps;
        s_evidenceURI = evidenceURI;

        emit MarketReported(address(0), winningOutcome, address(s_winningToken));
    }

    /// @notice Manual fallback for inconclusive AI results
    /// @dev Only oracle can call this if CRE returns INCONCLUSIVE
    function reportManually(Outcome _winningOutcome) external onlyOracle predictionNotReported {
        //// Checkpoint 5: Manual Oracle Fallback ////
        s_isReported = true;
        s_winningToken = _winningOutcome == Outcome.YES ? i_yesToken : i_noToken;

        emit MarketReported(msg.sender, _winningOutcome, address(s_winningToken));
    }

    /**
     * @notice Owner of contract can redeem winning tokens held by the contract after prediction is resolved and get payout from the contract including LP revenue and collateral back
     * @dev Only callable by the owner and only if the prediction is resolved
     * @return payoutAmount The amount of payment tokens redeemed
     */
    function resolveMarketAndWithdraw() external onlyOwner returns (uint256 payoutAmount) {
        /// Checkpoint 6 ////
        if (!s_isReported) revert PredictionMarket__PredictionNotReported();

        // Burn winning tokens held by contract
        uint256 winningTokenBalance = s_winningToken.balanceOf(address(this));
        if (winningTokenBalance > 0) {
            s_winningToken.burn(address(this), winningTokenBalance);
        }

        // Calculate total payout to withdraw (collateral + trading revenue)
        payoutAmount = s_collateral + s_lpTradingRevenue;

        // Reset state
        s_collateral = 0;
        s_lpTradingRevenue = 0;

        // Transfer payment tokens to owner
        i_paymentToken.safeTransfer(msg.sender, payoutAmount);

        emit MarketResolved(msg.sender, payoutAmount);
    }

    /**
     * @notice Buy prediction outcome tokens with payment tokens - simplified interface
     * @dev User specifies payment amount, contract calculates tokens to receive
     * @param _outcome The possible outcome (YES or NO) to buy tokens for
     * @param _paymentAmount Amount of payment tokens to spend
     * @param _minTokensOut Minimum tokens to receive (slippage protection)
     */
    function buyTokens(
        Outcome _outcome,
        uint256 _paymentAmount,
        uint256 _minTokensOut
    ) external predictionNotReported notOwner greaterThanZero(_paymentAmount) {
        /// Checkpoint 8 ////

        // Calculate how many tokens user will receive for this payment
        uint256 tokensToReceive = calculateTokensForPayment(_outcome, _paymentAmount);

        // Slippage protection
        require(tokensToReceive >= _minTokensOut, "Insufficient output amount");

        PredictionMarketToken token = _outcome == Outcome.YES ? i_yesToken : i_noToken;

        // Check contract has enough tokens
        if (token.balanceOf(address(this)) < tokensToReceive) {
            revert PredictionMarket__InsufficientTokenReserve(_outcome, tokensToReceive);
        }

        // Update trading revenue (LP earns from trades)
        s_lpTradingRevenue += _paymentAmount;

        // Transfer payment tokens from buyer
        i_paymentToken.safeTransferFrom(msg.sender, address(this), _paymentAmount);

        // Transfer tokens to buyer
        token.transfer(msg.sender, tokensToReceive);

        emit TokensPurchased(msg.sender, _outcome, tokensToReceive, _paymentAmount);
    }

    /**
     * @notice Calculate how many tokens user will receive for a given payment amount
     * @dev Uses iterative approximation to inverse the pricing formula
     * @param _outcome The possible outcome (YES or NO)
     * @param _paymentAmount Amount of payment tokens to spend
     * @return Number of tokens user will receive
     */
    function calculateTokensForPayment(Outcome _outcome, uint256 _paymentAmount) public view returns (uint256) {
        if (_paymentAmount == 0) return 0;

        (uint256 tokensSold, uint256 totalSold) = _getCurrentReserves(_outcome);
        PredictionMarketToken token = _outcome == Outcome.YES ? i_yesToken : i_noToken;

        // If no tokens sold yet, use initial probability
        if (totalSold == 0) {
            uint256 initialProb = _outcome == Outcome.YES
                ? (uint256(i_initialYesProbability) * PRECISION) / 100
                : ((100 - uint256(i_initialYesProbability)) * PRECISION) / 100;

            return (_paymentAmount * PRECISION) / ((i_initialTokenValue * initialProb) / PRECISION);
        }

        // Use binary search to find token amount that costs approximately _paymentAmount
        uint256 low = 0;
        uint256 high = token.balanceOf(address(this)); // Max we can sell
        uint256 mid;
        uint256 cost;

        // Binary search with 10 iterations (sufficient precision)
        for (uint256 i = 0; i < 10; i++) {
            mid = (low + high) / 2;
            if (mid == 0) break;

            cost = getBuyPrice(_outcome, mid);

            if (cost < _paymentAmount) {
                low = mid;
            } else if (cost > _paymentAmount) {
                high = mid;
            } else {
                return mid; // Exact match
            }
        }

        // Return the closest match (slightly under to ensure user has enough payment)
        return low;
    }

    /**
     * @notice Sell prediction outcome tokens for payment tokens, need to call price function first to get right amount of tokens to buy
     * @param _outcome The possible outcome (YES or NO) to sell tokens for
     * @param _tradingAmount The amount of tokens to sell
     */
    function sellTokens(
        Outcome _outcome,
        uint256 _tradingAmount,
        uint256 _minRefund
    ) external predictionNotReported notOwner greaterThanZero(_tradingAmount) {
        /// Checkpoint 8 ////
        PredictionMarketToken token = _outcome == Outcome.YES ? i_yesToken : i_noToken;

        // Check user has enough tokens
        uint256 userBalance = token.balanceOf(msg.sender);
        if (userBalance < _tradingAmount) {
            revert PredictionMarket__InsufficientBalance(_tradingAmount, userBalance);
        }

        // Check user has approved contract
        uint256 allowance = token.allowance(msg.sender, address(this));
        if (allowance < _tradingAmount) {
            revert PredictionMarket__InsufficientAllowance(_tradingAmount, allowance);
        }

        // Calculate payment to return
        uint256 refund = getSellPrice(_outcome, _tradingAmount);
        require(refund >= _minRefund, "Refund below min refund");

        // Check contract has enough in trading revenue (or collateral)
        if (refund > s_lpTradingRevenue + s_collateral) {
            revert PredictionMarket__InsufficientLiquidity();
        }

        // Deduct from trading revenue/collateral (simplified)
        if (refund <= s_lpTradingRevenue) {
            s_lpTradingRevenue -= refund;
        } else {
            uint256 remaining = refund - s_lpTradingRevenue;
            s_lpTradingRevenue = 0;
            s_collateral -= remaining;
        }

        // Burn tokens from user
        token.burn(msg.sender, _tradingAmount);

        // Transfer payment tokens to seller
        i_paymentToken.safeTransfer(msg.sender, refund);

        emit TokensSold(msg.sender, _outcome, _tradingAmount, refund);
    }

    /**
     * @notice Redeem winning tokens for payment tokens after prediction is resolved, winning tokens are burned and user receives payment tokens
     * @dev Only if the prediction is resolved
     * @param _amount The amount of winning tokens to redeem
     */
    function redeemWinningTokens(uint256 _amount) external greaterThanZero(_amount) notOwner {
        //// Checkpoint 9 ////
        if (!s_isReported) revert PredictionMarket__PredictionNotReported();

        // Check user has winning tokens
        uint256 userBalance = s_winningToken.balanceOf(msg.sender);
        if (userBalance < _amount) {
            revert PredictionMarket__InsufficientWinningTokens();
        }

        // Calculate payout: each winning token is worth initialTokenValue
        uint256 payout = (_amount * i_initialTokenValue) / PRECISION;

        // Check contract has enough collateral
        if (payout > s_collateral) {
            revert PredictionMarket__InsufficientLiquidity();
        }

        // Deduct from collateral
        s_collateral -= payout;

        // Burn winning tokens
        s_winningToken.burn(msg.sender, _amount);

        // Transfer payment tokens to user
        i_paymentToken.safeTransfer(msg.sender, payout);

        emit WinningTokensRedeemed(msg.sender, _amount, payout);
    }

    /**
     * @notice Calculate the total price for buying tokens
     * @param _outcome The possible outcome (YES or NO) to buy tokens for
     * @param _tradingAmount The amount of tokens to buy
     * @return The total price
     */
    function getBuyPrice(Outcome _outcome, uint256 _tradingAmount) public view returns (uint256) {
        //// Checkpoint 7 ////
        return _calculatePrice(_outcome, _tradingAmount, false);
    }

    /**
     * @notice Calculate the total price for selling tokens
     * @param _outcome The possible outcome (YES or NO) to sell tokens for
     * @param _tradingAmount The amount of tokens to sell
     * @return The total price
     */
    function getSellPrice(Outcome _outcome, uint256 _tradingAmount) public view returns (uint256) {
        //// Checkpoint 7 ////
        return _calculatePrice(_outcome, _tradingAmount, true);
    }

    /////////////////////////
    /// Helper Functions ///
    ////////////////////////

    /**
     * @dev Internal helper to calculate price for both buying and selling
     * @param _outcome The possible outcome (YES or NO)
     * @param _tradingAmount The amount of tokens
     * @param _isSelling Whether this is a sell calculation
     */
    function _calculatePrice(Outcome _outcome, uint256 _tradingAmount, bool _isSelling) private view returns (uint256) {
        /// Checkpoint 7 ////
        (uint256 tokensSold, uint256 totalSold) = _getCurrentReserves(_outcome);

        // Calculate probability before trade
        uint256 probBefore = _calculateProbability(tokensSold, totalSold);

        // Calculate probability after trade
        uint256 tokensAfter = _isSelling ? tokensSold - _tradingAmount : tokensSold + _tradingAmount;
        uint256 totalAfter = _isSelling ? totalSold - _tradingAmount : totalSold + _tradingAmount;
        uint256 probAfter = _calculateProbability(tokensAfter, totalAfter);

        // Average probability
        uint256 avgProb = (probBefore + probAfter) / 2;

        // Price = initialTokenValue * avgProbability * tradingAmount
        return (i_initialTokenValue * avgProb * _tradingAmount) / PRECISION;
    }

    /**
     * @dev Internal helper to get the current reserves of the tokens
     * @param _outcome The possible outcome (YES or NO)
     * @return The current reserves of the tokens
     */
    function _getCurrentReserves(Outcome _outcome) private view returns (uint256, uint256) {
        /// Checkpoint 7 ////
        // Get total supply of both tokens
        uint256 yesTotalSupply = i_yesToken.totalSupply();
        uint256 noTotalSupply = i_noToken.totalSupply();

        // Calculate tokens sold (total - contract balance)
        uint256 yesSold = yesTotalSupply - i_yesToken.balanceOf(address(this));
        uint256 noSold = noTotalSupply - i_noToken.balanceOf(address(this));

        // Return (tokensSold, totalSold) for the specified outcome
        if (_outcome == Outcome.YES) {
            return (yesSold, yesSold + noSold);
        } else {
            return (noSold, yesSold + noSold);
        }
    }

    /**
     * @dev Internal helper to calculate the probability of the tokens
     * @param tokensSold The number of tokens sold
     * @param totalSold The total number of tokens sold
     * @return The probability of the tokens
     */
    function _calculateProbability(uint256 tokensSold, uint256 totalSold) private pure returns (uint256) {
        /// Checkpoint 7 ////
        if (totalSold == 0) {
            return PRECISION / 2; // 50% probability if no tokens sold
        }
        // Probability = (tokensSold / totalSold) * PRECISION
        return (tokensSold * PRECISION) / totalSold;
    }

    /////////////////////////
    /// Getter Functions ///
    ////////////////////////

    /**
     * @notice Get the prediction details
     */
    function getPrediction() external view returns (PredictionDetails memory details) {
        details.oracle = i_oracle;
        details.initialTokenValue = i_initialTokenValue;
        details.percentageLocked = i_percentageLocked;
        details.initialProbability = i_initialYesProbability;
        details.question = s_question;
        details.collateral = s_collateral;
        details.lpTradingRevenue = s_lpTradingRevenue;
        details.predictionMarketOwner = owner();
        details.yesToken = address(i_yesToken);
        details.noToken = address(i_noToken);
        details.outcome1 = i_yesToken.name();
        details.outcome2 = i_noToken.name();
        details.yesTokenReserve = i_yesToken.balanceOf(address(this));
        details.noTokenReserve = i_noToken.balanceOf(address(this));
        details.isReported = s_isReported;
        details.winningToken = address(s_winningToken);
    }

    /// @notice Get the owner of the contract (inherited from Ownable)

    /// @notice Request CRE to settle the market
    /// @dev Emits SettlementRequested event that CRE workflow listens for
    function requestSettlement(uint256 _marketId) external predictionNotReported {
        emit SettlementRequested(_marketId, s_question);
    }

    /// @notice Support ERC165 interface detection
    function supportsInterface(bytes4 interfaceId) public pure override returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /// @notice Receive function to accept ETH
    receive() external payable {}
}
