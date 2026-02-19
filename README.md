# 🔮 Google Gemini-Powered Prediction Markets Platform

A decentralized prediction markets platform built on Scaffold-ETH 2, powered by **Google Gemini AI** for automated settlement via **Chainlink CRE** (Compute Runtime Environment).

![Prediction Markets](https://raw.githubusercontent.com/scaffold-eth/se-2-challenges/challenge-prediction-markets/extension/packages/nextjs/public/hero.png)

## 🌟 Features

- **🤖 AI-Powered Settlement**: Google Gemini with Google Search integration for fact-checking
- **⛓️ Chainlink CRE**: Decentralized, verifiable off-chain computation
- **💱 AMM-Style Pricing**: Linear probability-based pricing model
- **💰 ERC20 Outcome Tokens**: Trade YES/NO tokens representing market outcomes
- **📊 Polymarket-Style UI**: Professional charts, real-time data, and intuitive trading interface
- **💧 Liquidity Provider Rewards**: Earn fees from trading activity
- **🔒 Secure Settlement**: Manual fallback for inconclusive AI results

## 🏗️ Architecture

### Smart Contracts

- **PredictionMarket.sol**: Main market contract with CRE integration
- **PredictionMarketToken.sol**: ERC20 outcome tokens (YES/NO)
- **MockERC20.sol**: Test payment token with faucet

### CRE Workflow

- **main.ts**: Event listener and workflow orchestration
- **gemini.ts**: Google Gemini API integration
- **evm.ts**: On-chain settlement logic
- **firebase.ts**: Optional logging to Firestore

### Frontend

- **Polymarket-style UI** with interactive charts
- **Real-time probability tracking**
- **Trading interface** with price impact calculator
- **Activity feed** for market events

## 🚀 Quick Start

### Prerequisites

- Node.js >= v20.18.3
- Yarn v1 or v2+
- Git

### Installation

```bash
# Clone the repository
cd scaffold-eth-2-main

# Install dependencies
yarn install

# Start local blockchain
yarn chain

# In a new terminal, deploy contracts
yarn deploy

# In a third terminal, start the frontend
yarn start
```

Visit `http://localhost:3000` to see the app!

## 📝 Configuration

### 1. CRE Workflow Setup

Update `packages/hardhat/cre-workflow/config.json`:

```json
{
  "geminiModel": "gemini-2.0-flash-exp",
  "evms": [
    {
      "chainSelectorName": "sepolia",
      "marketAddress": "0xYourDeployedMarketAddress",
      "gasLimit": "500000"
    }
  ]
}
```

### 2. API Keys

Copy and fill `packages/hardhat/cre-workflow/secrets.yaml`:

```yaml
GEMINI_API_KEY: "your_gemini_api_key_here"
FIREBASE_API_KEY: "optional_firebase_key"  # Optional
FIREBASE_PROJECT_ID: "optional_project_id"  # Optional
```

Get your Gemini API key: https://ai.google.dev/

### 3. Network Configuration

For testnet deployment, update the CRE forwarder address in `deploy/00_deploy_your_contract.ts`:

```typescript
// Replace with actual CRE forwarder for your network
const forwarderAddress = "0xActualForwarderAddress";
```

Find forwarder addresses: https://docs.chain.link/

## 🎮 Usage

### Creating a Market

1. Navigate to the **Liquidity Provider** page
2. Fill in the market question
3. Set initial probability and collateral
4. Deploy the market

### Trading

1. Browse markets on the **Markets** page
2. Click on a market to view details
3. Buy YES or NO tokens based on your prediction
4. Sell tokens anytime before settlement

### Settlement

**Automated (CRE)**:
1. Click "Request Settlement" on a market
2. CRE workflow detects the event
3. Gemini AI fact-checks the outcome
4. Settlement is submitted on-chain automatically

**Manual (Fallback)**:
1. Oracle calls `reportManually(YES/NO)`
2. Market is settled immediately

### Redeeming Winnings

1. After settlement, navigate to your position
2. Click "Redeem" on winning tokens
3. Receive payout in payment tokens

## 📊 How It Works

### Pricing Model

The platform uses a linear probability-based AMM:

```
price = initialTokenValue × avgProbability × tradingAmount
```

Where:
- `avgProbability = (probabilityBefore + probabilityAfter) / 2`
- `probability = tokensSold / totalTokensSold`

This creates a **volume discount** effect - larger trades get better per-token prices.

### Settlement Process

1. **Event Emission**: `requestSettlement()` emits `SettlementRequested` event
2. **CRE Detection**: Workflow listens for the event on-chain
3. **AI Query**: Gemini AI with Google Search fact-checks the question
4. **Response Parsing**: JSON response validated (YES/NO/INCONCLUSIVE)
5. **On-Chain Report**: CRE submits signed report to contract
6. **Market Resolution**: Contract processes report and sets winning token

## 🧪 Testing

### Run Unit Tests

```bash
cd packages/hardhat
yarn test
```

### Test CRE Workflow (Local Simulation)

```bash
cd packages/hardhat/cre-workflow
npm install
npm run simulate
```

### Deploy to Testnet

```bash
# Configure .env with your private key and RPC
yarn deploy --network sepolia
```

## 📁 Project Structure

```
scaffold-eth-2-main/
├── packages/
│   ├── hardhat/
│   │   ├── contracts/
│   │   │   ├── PredictionMarket.sol
│   │   │   ├── PredictionMarketToken.sol
│   │   │   ├── MockERC20.sol
│   │   │   └── interfaces/
│   │   │       ├── ReceiverTemplate.sol
│   │   │       ├── IReceiver.sol
│   │   │       └── IERC165.sol
│   │   ├── cre-workflow/
│   │   │   ├── main.ts
│   │   │   ├── gemini.ts
│   │   │   ├── evm.ts
│   │   │   ├── firebase.ts
│   │   │   ├── types.ts
│   │   │   ├── config.json
│   │   │   └── secrets.yaml
│   │   └── deploy/
│   │       └── 00_deploy_your_contract.ts
│   └── nextjs/
│       ├── app/
│       │   ├── markets/
│       │   └── liquidity-provider/
│       └── components/
│           └── prediction-markets/
│               ├── MarketCard.tsx
│               ├── TradingInterface.tsx
│               ├── ProbabilityChart.tsx
│               ├── VolumeChart.tsx
│               └── ActivityFeed.tsx
```

## 🔐 Security Considerations

- **Oracle Trust**: Manual settlement requires trusting the oracle address
- **CRE Verification**: Automated settlement is cryptographically verified
- **Owner Restrictions**: Market owner cannot trade (prevents manipulation)
- **Token Locking**: Prevents initial probability manipulation
- **SafeERC20**: All token transfers use OpenZeppelin's SafeERC20

## 🛠️ Tech Stack

- **Smart Contracts**: Solidity, Hardhat, OpenZeppelin
- **CRE Workflow**: TypeScript, Chainlink CRE SDK, Viem, Zod
- **AI**: Google Gemini 2.0 Flash with Google Search
- **Frontend**: Next.js, React, Wagmi, Viem
- **Charts**: Recharts, Lightweight Charts
- **State**: Zustand, SWR
- **Styling**: Tailwind CSS, Framer Motion

## 📚 Resources

- [Chainlink CRE Documentation](https://docs.chain.link/)
- [Google Gemini API](https://ai.google.dev/)
- [Scaffold-ETH 2 Docs](https://docs.scaffoldeth.io/)
- [Original Challenge](https://github.com/scaffold-eth/se-2-challenges/tree/challenge-prediction-markets)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Scaffold-ETH 2 team for the amazing framework
- Chainlink for CRE infrastructure
- Google for Gemini AI API
- Polymarket for UI/UX inspiration
