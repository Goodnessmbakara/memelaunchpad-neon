# 🚀 Memecoin Launchpad on Neon EVM Devnet

## 📝 Overview
This project demonstrates the implementation of a Memecoin Launchpad on Neon EVM Devnet, showcasing the power of Neon EVM in bridging Ethereum and Solana ecosystems. The project allows for the creation and management of memecoin tokens with Raydium integration, all while using Solidity smart contracts on Neon EVM.

## 🛠️ Technical Implementation

### Architecture
- **Neon EVM**: Enables Solidity smart contracts to interact with Solana programs
- **Cross-Chain Integration**: Bridges Ethereum and Solana ecosystems
- **Raydium Integration**: For liquidity pool creation and management

### Key Components
1. **MemeLaunchpad Contract**: Main contract for token creation and management
2. **BondingCurve**: Handles token distribution logic
3. **ERC20ForSpl**: Solidity wrapper for SPL tokens
4. **Raydium Integration**: For liquidity pool creation

## 🚀 Setup and Deployment

### Prerequisites
- Node.js and pnpm
- Neon Devnet wallet
- Solana Devnet wallet

### Installation
```bash
# Initialize project
git init
pnpm init

# Install dependencies
pnpm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
pnpm install @solana/web3.js dotenv
```

### Configuration
1. Create `.env` file:
```env
NEON_RPC_URL=https://devnet.neonevm.org
PRIVATE_KEY=your_neon_wallet_private_key
SOLANA_RPC_URL=https://api.devnet.solana.com
PRIVATE_KEY_SOLANA=your_solana_wallet_private_key
```

2. Update `hardhat.config.js`:
```javascript
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  networks: {
    neondevnet: {
      url: process.env.NEON_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 245022926,
      allowUnlimitedContractSize: true,
      timeout: 1000000
    }
  }
};
```

## 🔗 Contract Addresses and Transactions

### Deployed Contracts
- **MemeLaunchpad**: [View on Neonscan](https://devnet.neonscan.org/address/YOUR_CONTRACT_ADDRESS)
- **BondingCurve**: `0x0Fc6Ec7F9F06bd733913C1Fcd10BFc959a1F88DC`
- **ERC20ForSplFactory**: `0xF6b17787154C418d5773Ea22Afc87A95CAA3e957`
- **WSOL**: `0xc7Fc9b46e479c5Cb42f6C458D1881e55E6B7986c`

### Key Transactions
1. **Contract Deployment**: [View on Neonscan](https://devnet.neonscan.org/tx/YOUR_DEPLOYMENT_TX)
2. **Token Sale Creation**: [View on Neonscan](https://devnet.neonscan.org/tx/YOUR_TOKEN_SALE_TX)
3. **Raydium Pool Creation**: [View on Solana Explorer](https://explorer.solana.com/tx/YOUR_POOL_CREATION_TX)

## 🧪 Testing
Run the test suite:
```bash
npx hardhat test test/MemeLaunchpad/MemeLaunchpad.js
```

### Test Results
- Successfully deployed MemeLaunchpad contract
- Created token sale with funding goal
- Executed buy operations
- Created Raydium liquidity pool
- Collected pool fees

## 🔍 Technical Details

### Contract Parameters
- **BondingCurve Parameters**:
  - A: 1000000000000000
  - B: 2000000000000000
- **Fee Structure**: 1% (100 basis points)
- **Token Decimals**: 9

### Cross-Chain Integration
- Successfully integrated with Solana Devnet
- Implemented composability with Raydium protocol
- Handled cross-chain token transfers

## 🎯 Future Improvements
1. Enhanced UI for token creation and management
2. Additional bonding curve models
3. More sophisticated fee distribution mechanisms
4. Integration with additional DEX protocols

## 📚 Resources
- [Neon EVM Documentation](https://docs.neonfoundation.io/)
- [Solana Documentation](https://docs.solana.com/)
- [Raydium Protocol](https://raydium.gitbook.io/raydium/)

## 🔐 Security Considerations
- Implemented reentrancy protection
- Added input validation
- Used SafeERC20 for token transfers
- Implemented proper access control

## 📄 License
MIT License