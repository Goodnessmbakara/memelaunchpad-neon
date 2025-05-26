const { ethers } = require("hardhat");
const { expect } = require("chai");
const web3 = require("@solana/web3.js");
const { config } = require('../config');
const { raydiumSwapInput } = require('./raydiumSwapInput');
const { createATA } = require('../CreateATAThroughSolanaWeb3');
require("dotenv").config();

let owner;
const MemeLaunchpadAddress = config.DATA.EVM.ADDRESSES.MemeLaunchpad.MemeLaunchpadTest;
const BondingCurveAddress = config.DATA.EVM.ADDRESSES.MemeLaunchpad.BondingCurve;
let MemeLaunchpad;
let payer;
let BondingCurve;
let WSOL;
let Token;
let poolId;
const RECEIPTS_COUNT = 1;

// Helper function to retry operations
async function retryOperation(operation, maxRetries = 3, delay = 5000) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            console.log(`Attempt ${i + 1} failed:`, error.message);
            lastError = error;
            if (i < maxRetries - 1) {
                console.log(`Retrying in ${delay/1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
}

// Background airdrop process
async function startBackgroundAirdrop() {
    const targetBalance = ethers.parseEther('3000'); // Increased target to ensure enough for all operations
    let currentBalance = await ethers.provider.getBalance(owner.address);
    console.log('Starting background airdrops. Initial balance:', ethers.formatEther(currentBalance), 'NEON');
    
    while (currentBalance < targetBalance) {
        try {
            // Request multiple airdrops in parallel
            const airdropPromises = Array(5).fill().map(() => 
                retryOperation(async () => {
                    await config.utils.airdropNEON(owner.address);
                })
            );
            
            console.log('Requesting 5 airdrops in parallel...');
            await Promise.all(airdropPromises);
            
            // Check new balance after all airdrops
            currentBalance = await ethers.provider.getBalance(owner.address);
            console.log('Airdrops completed. New balance:', ethers.formatEther(currentBalance), 'NEON');
            
            // Wait a bit before next batch
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.error('Batch airdrop failed:', error.message);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
    console.log('Target balance reached:', ethers.formatEther(currentBalance), 'NEON');
}

// Helper function to wait for sufficient balance
async function waitForBalance(minBalance) {
    let currentBalance = await ethers.provider.getBalance(owner.address);
    console.log('Current balance:', ethers.formatEther(currentBalance), 'NEON');
    
    if (currentBalance < minBalance) {
        console.log('Requesting bulk airdrops to reach target balance...');
        // Request multiple airdrops in parallel
        const airdropPromises = Array(5).fill().map(() => 
            retryOperation(async () => {
                await config.utils.airdropNEON(owner.address);
            })
        );
        
        await Promise.all(airdropPromises);
        currentBalance = await ethers.provider.getBalance(owner.address);
        console.log('Bulk airdrops completed. New balance:', ethers.formatEther(currentBalance), 'NEON');
    }
    
    while (currentBalance < minBalance) {
        console.log('Waiting for sufficient balance...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        currentBalance = await ethers.provider.getBalance(owner.address);
        console.log('New balance:', ethers.formatEther(currentBalance), 'NEON');
    }
}

describe('Test init', async function () {
    this.timeout(600000); // Increased to 10 minutes
    before(async function () {
        this.timeout(300000); // 5 minutes for setup
        console.time('before-hook');
        console.log('Starting before hook');
    
        console.time('getSigners');
        [owner] = await ethers.getSigners();
        console.timeEnd('getSigners');
        console.log('Owner address:', owner.address);
    
        console.time('checkBalance');
        const balance = await ethers.provider.getBalance(owner.address);
        console.log('Owner balance:', ethers.formatEther(balance), 'NEON');
        console.timeEnd('checkBalance');
    
        // Start background airdrop process with retry
        await retryOperation(async () => {
            startBackgroundAirdrop().catch(console.error);
        });
    
        // Wait for initial balance before proceeding
        await waitForBalance(ethers.parseEther('1000'));
    
        console.time('getContractFactories');
        const MemeLaunchpadFactory = await ethers.getContractFactory('contracts/MemeLaunchpad/MemeLaunchpad.sol:MemeLaunchpad');
        const BondingCurveFactory = await ethers.getContractFactory('contracts/MemeLaunchpad/BondingCurve.sol:BondingCurve');
        
        try {
            WSOL = await hre.ethers.getContractAt('contracts/interfaces/IERC20ForSpl.sol:IERC20ForSpl', config.DATA.EVM.ADDRESSES.WSOL);
            
            // Check WSOL balance and allowance
            const wsolBalance = await WSOL.balanceOf(owner.address);
            console.log('WSOL Balance:', ethers.formatUnits(wsolBalance, 9), 'WSOL');
            
            // Check if we need to wrap more SOL
            if (wsolBalance < ethers.parseUnits('3', 9)) {
                console.log('WSOL balance is low, attempting to wrap more SOL...');
                // Add wrapping logic here if needed
            }
        } catch (error) {
            console.error('Error checking WSOL balance:', error.message);
            throw error;
        }
        
        console.timeEnd('getContractFactories');
    
        console.time('bondingCurveSetup');
        if (ethers.isAddress(BondingCurveAddress)) {
            console.log('BondingCurve used at', "\x1b[32m", BondingCurveAddress, "\x1b[30m", '\n');
            BondingCurve = BondingCurveFactory.attach(BondingCurveAddress);
        } else {
            console.log('Deploying BondingCurve');
            BondingCurve = await ethers.deployContract('contracts/MemeLaunchpad/BondingCurve.sol:BondingCurve', [
                ethers.parseUnits('0.001', 'ether'),
                ethers.parseUnits('0.002', 'ether')
            ]);
            await BondingCurve.waitForDeployment();
            console.log('BondingCurve deployed at', "\x1b[32m", BondingCurve.target, "\x1b[30m", '\n');
        }
        console.timeEnd('bondingCurveSetup');
    
        console.time('memeLaunchpadSetup');
        if (ethers.isAddress(MemeLaunchpadAddress)) {
            console.log('MemeLaunchpad used at', "\x1b[32m", MemeLaunchpadAddress, "\x1b[30m", '\n');
            MemeLaunchpad = MemeLaunchpadFactory.attach(MemeLaunchpadAddress);
        } else {
            console.log('Deploying MemeLaunchpad with args:', {
                erc20ForSplFactory: config.DATA.EVM.ADDRESSES.ERC20ForSplFactory,
                bondingCurve: BondingCurve.target,
                wsol: WSOL.target,
                fee: 100
            });
            // Validate addresses
            if (!ethers.isAddress(config.DATA.EVM.ADDRESSES.ERC20ForSplFactory) || config.DATA.EVM.ADDRESSES.ERC20ForSplFactory === ethers.AddressZero) {
                throw new Error('Invalid ERC20ForSplFactory address');
            }
            if (!ethers.isAddress(BondingCurve.target) || BondingCurve.target === ethers.AddressZero) {
                throw new Error('Invalid BondingCurve address');
            }
            if (!ethers.isAddress(WSOL.target) || WSOL.target === ethers.AddressZero) {
                throw new Error('Invalid WSOL address');
            }
            // Verify contract addresses
            console.log('Verifying contract addresses...');
            const erc20FactoryCode = await ethers.provider.getCode(config.DATA.EVM.ADDRESSES.ERC20ForSplFactory);
            const bondingCurveCode = await ethers.provider.getCode(BondingCurve.target);
            const wsolCode = await ethers.provider.getCode(WSOL.target);
            console.log('ERC20ForSplFactory code exists:', erc20FactoryCode !== '0x');
            console.log('BondingCurve code exists:', bondingCurveCode !== '0x');
            console.log('WSOL code exists:', wsolCode !== '0x');
            // Verify WSOL interface
            try {
                const wsolContract = await ethers.getContractAt('IERC20ForSpl', WSOL.target);
                console.log('WSOL tokenMint:', await wsolContract.tokenMint());
            } catch (error) {
                console.error('WSOL interface verification failed:', error);
            }
            // Verify BondingCurve interface
            try {
                const bondingCurveContract = await ethers.getContractAt('BondingCurve', BondingCurve.target);
                console.log('BondingCurve A:', (await bondingCurveContract.A()).toString());
                console.log('BondingCurve B:', (await bondingCurveContract.B()).toString());
            } catch (error) {
                console.error('BondingCurve interface verification failed:', error);
            }
            // Verify ERC20ForSplFactory interface
            try {
                const factoryContract = await ethers.getContractAt('IERC20ForSplFactory', config.DATA.EVM.ADDRESSES.ERC20ForSplFactory);
                console.log('ERC20ForSplFactory interface verified');
            } catch (error) {
                console.error('ERC20ForSplFactory interface verification failed:', error);
            }
            // Verify ICallSolana precompile
            const callSolanaCode = await ethers.provider.getCode('0xFF00000000000000000000000000000000000006');
            console.log('ICallSolana precompile exists:', callSolanaCode !== '0x');
            console.log('Testing ICallSolana precompile...');
            try {
                const callSolana = await ethers.getContractAt('ICallSolana', '0xFF00000000000000000000000000000000000006');
                const payer = await callSolana.getPayer();
                console.log('ICallSolana getPayer:', payer);
            } catch (error) {
                console.error('ICallSolana getPayer failed:', error);
            }
            console.time('deployMemeLaunchpad');
            try {
                MemeLaunchpad = await ethers.deployContract('contracts/MemeLaunchpad/MemeLaunchpad.sol:MemeLaunchpad', [
                    config.DATA.EVM.ADDRESSES.ERC20ForSplFactory,
                    BondingCurve.target,
                    WSOL.target,
                    100
                ]);
                console.timeEnd('deployMemeLaunchpad');
                console.log('Waiting for deployment confirmation');
                console.time('waitForDeployment');
                await MemeLaunchpad.waitForDeployment();
                console.timeEnd('waitForDeployment');
                console.log('MemeLaunchpad deployed at', "\x1b[32m", MemeLaunchpad.target, "\x1b[30m", '\n');
                console.log('Update config with MemeLaunchpad address:', MemeLaunchpad.target);
            } catch (error) {
                console.error('Deployment failed:', error);
                throw error;
            }
        }
        console.timeEnd('memeLaunchpadSetup');
    
        console.time('getPayer');
        payer = await MemeLaunchpad.getPayer();
        console.timeEnd('getPayer');
        console.log('Payer address:', payer);
    
        console.timeEnd('before-hook');
    });

    describe('MemeLaunchpad tests', function() {
        // Store test state
        let testState = {
            tokenSaleCreated: false,
            initialBuyCompleted: false,
            fundingGoalReached: false
        };

        it('createTokenSale', async function () {
            this.timeout(180000); // 3 minutes
            // Wait for sufficient balance before proceeding
            await waitForBalance(ethers.parseEther('1000'));
            
            let tx = await MemeLaunchpad.createTokenSale(
                "TEST" + Date.now().toString(),
                "TST",
                9,
                100000000, // 0.1 SOL sale cap
                ethers.parseUnits('2000', 9),
                ethers.parseUnits('8000', 9)
            );
            let receipt = await tx.wait(RECEIPTS_COUNT);
            console.log(tx.hash, 'createTokenSale tx');

            Token = await hre.ethers.getContractAt('contracts/interfaces/IERC20ForSpl.sol:IERC20ForSpl', receipt.logs[2].args[0]);

            // setup contract's payer ATA accounts for both tokens ( payer account is the one who creates the Raydium pool )
            await createATA(
                [
                    new web3.PublicKey(ethers.encodeBase58(payer))
                ],
                [
                    ethers.encodeBase58(await WSOL.tokenMint()),
                    ethers.encodeBase58(await Token.tokenMint())
                ]
            );
            testState.tokenSaleCreated = true;
        });

        it('buy ( not reaching the fundingGoal )', async function () {
            this.timeout(180000); // 3 minutes
            if (!testState.tokenSaleCreated) {
                throw new Error('Token sale must be created first');
            }

            // Wait for sufficient balance before proceeding
            await waitForBalance(ethers.parseEther('1000'));

            const buyAmount = 10000000; // 0.01 SOL
            const decimals = 9;
            const wsolBalance = await WSOL.balanceOf(owner.address);
            const allowance = await WSOL.allowance(owner.address, MemeLaunchpad.target);

            console.log(`[BUY-1] WSOL balance: ${ethers.formatUnits(wsolBalance, decimals)} WSOL`);
            console.log(`[BUY-1] Required for buy: ${ethers.formatUnits(buyAmount, decimals)} WSOL`);
            console.log(`[BUY-1] Allowance: ${ethers.formatUnits(allowance, decimals)} WSOL`);

            if (wsolBalance < buyAmount) {
                console.error(`[BUY-1] Insufficient WSOL for buy!`);
                throw new Error('Not enough WSOL for buy');
            }

            let tx;
            if (allowance < buyAmount) {
                console.log('[BUY-1] Approving WSOL...');
                tx = await WSOL.approve(MemeLaunchpad.target, ethers.MaxUint256);
                await tx.wait(RECEIPTS_COUNT);
                console.log('[BUY-1] Approval done.');
            }

            console.log('[BUY-1] Executing buy transaction...');
            tx = await MemeLaunchpad.buy(Token.target, buyAmount);
            let receipt = await tx.wait(RECEIPTS_COUNT);
            console.log(tx.hash, '[BUY-1] buy tx');

            const finalWSOLBalance = await WSOL.balanceOf(owner.address);
            console.log(`[BUY-1] Final WSOL balance: ${ethers.formatUnits(finalWSOLBalance, decimals)} WSOL`);

            testState.initialBuyCompleted = true;
        });

        it('buy ( reaching the fundingGoal )', async function () {
            this.timeout(180000); // 3 minutes
            if (!testState.initialBuyCompleted) {
                throw new Error('Initial buy must be completed first');
            }

            await waitForBalance(ethers.parseEther('2000'));

            const buyAmount = 150000000; // 0.15 SOL
            const decimals = 9;
            const wsolBalance = await WSOL.balanceOf(owner.address);
            const allowance = await WSOL.allowance(owner.address, MemeLaunchpad.target);

            console.log(`[BUY-2] WSOL balance: ${ethers.formatUnits(wsolBalance, decimals)} WSOL`);
            console.log(`[BUY-2] Required for buy: ${ethers.formatUnits(buyAmount, decimals)} WSOL`);
            console.log(`[BUY-2] Allowance: ${ethers.formatUnits(allowance, decimals)} WSOL`);

            if (wsolBalance < buyAmount) {
                console.error(`[BUY-2] Insufficient WSOL for buy!`);
                throw new Error('Not enough WSOL for buy');
            }

            let tx;
            if (allowance < buyAmount) {
                console.log('[BUY-2] Approving WSOL...');
                tx = await WSOL.approve(MemeLaunchpad.target, ethers.MaxUint256);
                await tx.wait(RECEIPTS_COUNT);
                console.log('[BUY-2] Approval done.');
            }

            console.log('[BUY-2] Executing buy transaction...');
            tx = await MemeLaunchpad.buy(Token.target, buyAmount);
            let receipt = await tx.wait(RECEIPTS_COUNT);
            console.log(tx.hash, '[BUY-2] buy tx');

            const finalWSOLBalance = await WSOL.balanceOf(owner.address);
            console.log(`[BUY-2] Final WSOL balance: ${ethers.formatUnits(finalWSOLBalance, decimals)} WSOL`);

            poolId = receipt.logs[7].args[1];
            console.log('\nRaydium Pool ID account - ', ethers.encodeBase58(poolId));
            console.log('Locked LP amount - ', receipt.logs[7].args[2]);
            console.log('NFT account holding the locked LP position - ', ethers.encodeBase58(receipt.logs[7].args[3]));

            testState.fundingGoalReached = true;
        });

        it('collectPoolFees', async function () {
            this.timeout(180000); // 3 minutes
            if (!testState.fundingGoalReached) {
                throw new Error('Funding goal must be reached first');
            }
            if (!poolId) {
                throw new Error('Pool ID is not set. Make sure the previous test completed successfully.');
            }

            // Wait for sufficient balance before proceeding
            await waitForBalance(ethers.parseEther('1000'));
            
            // collect token sale fee
            const wsolBalance = await WSOL.balanceOf(owner.address);
            
            let tx = await MemeLaunchpad.claimTokenSaleFee();
            await tx.wait(RECEIPTS_COUNT);
            console.log(tx.hash, 'claimTokenSaleFee tx');

            expect(await WSOL.balanceOf(owner.address)).to.be.greaterThan(wsolBalance);
            
            // collect Raydium locked LP fee
            await raydiumSwapInput(ethers.encodeBase58(poolId)); // fake some swap in order to be able to collect some fees
            await config.utils.asyncTimeout(20000); // Increased timeout to 20 seconds

            const initialTokenABalance = await WSOL.balanceOf(owner.address);
            const initialTokenBBalance = await Token.balanceOf(owner.address);
            
            tx = await MemeLaunchpad.collectPoolFees(
                poolId,
                WSOL.target,
                Token.target,
                '18446744073709551615' // withdraw maximum available fees
            );
            await tx.wait(RECEIPTS_COUNT);
            console.log(tx.hash, 'collectPoolFees tx');

            expect(await WSOL.balanceOf(owner.address)).to.be.greaterThan(initialTokenABalance);
            expect(await Token.balanceOf(owner.address)).to.be.greaterThan(initialTokenBBalance);
        });
    });
});