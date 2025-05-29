require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.28",
        settings: {
            viaIR: true,
            optimizer: {
                enabled: true,
                runs: 1000
            }
        }
    },
    defaultNetwork: "neondevnet",
    etherscan: {
        apiKey: {
            neondevnet: "test",
            neonmainnet: process.env.NEONSCAN_API_KEY_MAINNET || "mainnet_key_here"
        },
        customChains: [
            {
                network: "neondevnet",
                chainId: 245022926,
                urls: {
                    apiURL: "https://devnet-api.neonscan.org/hardhat/verify",
                    browserURL: "https://devnet.neonscan.org"
                }
            },
            {
                network: "neonmainnet",
                chainId: 245022934,
                urls: {
                    apiURL: "https://api.neonscan.org/hardhat/verify",
                    browserURL: "https://neonscan.org"
                }
            }
        ]
    },
    networks: {
        neondevnet: {
            url: "https://devnet.neonevm.org",
            accounts: [process.env.PRIVATE_KEY_OWNER],
            chainId: 245022926,
            timeout: 6000000
        },
        neonmainnet: {
            url: "https://neon-proxy-mainnet.solana.p2p.org",
            accounts: [process.env.PRIVATE_KEY_OWNER],
            chainId: 245022934
        }
    }
};
