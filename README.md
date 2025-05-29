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
- **MemeLaunchpad**: `0x18caB9d00eF5a52E40EA3e25f9b15CC3a6c48505` [View on Neonscan](https://devnet.neonscan.org/address/0x18caB9d00eF5a52E40EA3e25f9b15CC3a6c48505)
- **BondingCurve**: `0x0Fc6Ec7F9F06bd733913C1Fcd10BFc959a1F88DC` [View on Neonscan](https://devnet.neonscan.org/address/0x0Fc6Ec7F9F06bd733913C1Fcd10BFc959a1F88DC)
- **ERC20ForSplFactory**: `0xF6b17787154C418d5773Ea22Afc87A95CAA3e957` [View on Neonscan](https://devnet.neonscan.org/address/0xF6b17787154C418d5773Ea22Afc87A95CAA3e957)
- **WSOL**: `0xc7Fc9b46e479c5Cb42f6C458D1881e55E6B7986c` [View on Neonscan](https://devnet.neonscan.org/address/0xc7Fc9b46e479c5Cb42f6C458D1881e55E6B7986c)

### Key Transactions
1. **Token Sale Creation**: `0x884293febb31142cd79af9c6af940111820ae69ec6b7b8bad7f036f58017f496` [View on Neonscan](https://devnet.neonscan.org/tx/0x884293febb31142cd79af9c6af940111820ae69ec6b7b8bad7f036f58017f496)
2. **Buy Transaction (Not Reaching Goal)**: `0x4e7b73aef082449d20015893bd22fdf25e907045c7fb0b3a56415bd405ae3b3c` [View on Neonscan](https://devnet.neonscan.org/tx/0x4e7b73aef082449d20015893bd22fdf25e907045c7fb0b3a56415bd405ae3b3c)
3. **Buy Transaction (Reaching Goal)**: `0xbd513cebbaef07684867f8b565c117f00766b02e98210ddb07270b613478fa29` [View on Neonscan](https://devnet.neonscan.org/tx/0xbd513cebbaef07684867f8b565c117f00766b02e98210ddb07270b613478fa29)
4. **Claim Token Sale Fee**: `0x02159983787f27b533694e55817ab222caa253966734cb686564d25a2b467ac4` [View on Neonscan](https://devnet.neonscan.org/tx/0x02159983787f27b533694e55817ab222caa253966734cb686564d25a2b467ac4)
5. **Collect Pool Fees**: `0x2b2b46a4e213950efc5f5bca912d1b9616879ddb19ef9cdc1e050fece9737295` [View on Neonscan](https://devnet.neonscan.org/tx/0x2b2b46a4e213950efc5f5bca912d1b9616879ddb19ef9cdc1e050fece9737295)

### Raydium Integration
- **Raydium Pool ID**: `2Zjo3najyvLK5QyPkvbJ9hyZwEyXc71fjNY8mZXo7jG4` [View on Solana Explorer](https://explorer.solana.com/address/2Zjo3najyvLK5QyPkvbJ9hyZwEyXc71fjNY8mZXo7jG4)
- **Locked LP Amount**: 14142135523
- **NFT Account**: `6aXPnX1Q7wK2JFqyVNPxddon3LY5Zw21h18rfCWGYrxd` [View on Solana Explorer](https://explorer.solana.com/address/6aXPnX1Q7wK2JFqyVNPxddon3LY5Zw21h18rfCWGYrxd)

## 🧪 Testing
Run the test suite:
```bash
npx hardhat test test/MemeLaunchpad/MemeLaunchpad.js
```

### Test Results
- ✅ Successfully deployed MemeLaunchpad contract at `0x18caB9d00eF5a52E40EA3e25f9b15CC3a6c48505`
- ✅ Created token sale with funding goal (Tx: `0x884293febb31142cd79af9c6af940111820ae69ec6b7b8bad7f036f58017f496`)
- ✅ Executed buy operations:
  - Buy without reaching goal (Tx: `0x4e7b73aef082449d20015893bd22fdf25e907045c7fb0b3a56415bd405ae3b3c`)
  - Buy reaching goal (Tx: `0xbd513cebbaef07684867f8b565c117f00766b02e98210ddb07270b613478fa29`)
- ✅ Created Raydium liquidity pool (Pool ID: `2Zjo3najyvLK5QyPkvbJ9hyZwEyXc71fjNY8mZXo7jG4`)
- ✅ Collected pool fees (Tx: `0x2b2b46a4e213950efc5f5bca912d1b9616879ddb19ef9cdc1e050fece9737295`)
- ✅ All tests passed successfully (4 passing tests in 9 minutes)

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