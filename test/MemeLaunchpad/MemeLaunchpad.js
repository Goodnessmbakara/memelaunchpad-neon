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

describe('Test init', async function () {
    this.timeout(120000);
    before(async function () {
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
    
        if (balance === 0n) {
            console.time('airdropNEON');
            console.log('Airdropping NEON to owner');
            await config.utils.airdropNEON(owner.address);
            console.timeEnd('airdropNEON');
            console.log('Airdrop complete, new balance:', ethers.formatEther(await ethers.provider.getBalance(owner.address)));
        }
    
        console.time('getContractFactories');
        const MemeLaunchpadFactory = await ethers.getContractFactory('contracts/MemeLaunchpad/MemeLaunchpad.sol:MemeLaunchpad');
        const BondingCurveFactory = await ethers.getContractFactory('contracts/MemeLaunchpad/BondingCurve.sol:BondingCurve');
        WSOL = await hre.ethers.getContractAt('contracts/interfaces/IERC20ForSpl.sol:IERC20ForSpl', config.DATA.EVM.ADDRESSES.WSOL);
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
            ], { gasLimit: 5000000 });
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
                ], { gasLimit: 100000000 });
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
        it('createTokenSale', async function () {
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
            )
        });

        it('buy ( not reaching the fundingGoal )', async function () {
            const initialWSOLBalance = await WSOL.balanceOf(owner.address);
            const initialWSOLBalanceContract = await WSOL.balanceOf(MemeLaunchpad.target);

            let tx;
            if (await WSOL.allowance(owner.address, MemeLaunchpad.target) == 0) {
                tx = await WSOL.approve(MemeLaunchpad.target, ethers.MaxUint256);
                await tx.wait(RECEIPTS_COUNT);
            }

            tx = await MemeLaunchpad.buy(
                Token.target,
                10000000 // 0.01 SOL
            );
            let receipt = await tx.wait(RECEIPTS_COUNT);
            console.log(tx.hash, 'buy tx');

            expect(initialWSOLBalance).to.be.greaterThan(await WSOL.balanceOf(owner.address));
            expect(await WSOL.balanceOf(MemeLaunchpad.target)).to.be.greaterThan(initialWSOLBalanceContract);
        });

        it('buy ( reaching the fundingGoal )', async function () {
            const initialTokenABalance = await WSOL.balanceOf(owner.address);
            const initialTokenBBalance = await Token.balanceOf(owner.address);
            const initialWSOLBalanceContract = await WSOL.balanceOf(MemeLaunchpad.target);

            let tx;
            if (await WSOL.allowance(owner.address, MemeLaunchpad.target) == 0) {
                tx = await WSOL.approve(MemeLaunchpad.target, ethers.MaxUint256);
                await tx.wait(RECEIPTS_COUNT);
            }

            tx = await MemeLaunchpad.buy(
                Token.target,
                150000000 // 0.15 SOL
            );
            let receipt = await tx.wait(RECEIPTS_COUNT);
            console.log(tx.hash, 'buy tx');

            poolId = receipt.logs[7].args[1];
            console.log('\nRaydium Pool ID account - ', ethers.encodeBase58(poolId));
            console.log('Locked LP amount - ', receipt.logs[7].args[2]);
            console.log('NFT account holding the locked LP position - ', ethers.encodeBase58(receipt.logs[7].args[3]));

            expect(initialTokenABalance).to.be.greaterThan(await WSOL.balanceOf(owner.address));
            expect(await Token.balanceOf(owner.address)).to.be.greaterThan(initialTokenBBalance);
            expect(initialWSOLBalanceContract).to.be.greaterThan(await WSOL.balanceOf(MemeLaunchpad.target));
            expect(await WSOL.balanceOf(MemeLaunchpad.target)).to.eq(await MemeLaunchpad.fee());
            expect(await Token.balanceOf(MemeLaunchpad.target)).to.eq(0);
        });

        it('collectPoolFees', async function () {
            // collect token sale fee
            const wsolBalance = await WSOL.balanceOf(owner.address);
            
            let tx = await MemeLaunchpad.claimTokenSaleFee();
            await tx.wait(RECEIPTS_COUNT);
            console.log(tx.hash, 'claimTokenSaleFee tx');

            expect(await WSOL.balanceOf(owner.address)).to.be.greaterThan(wsolBalance);
            
            // collect Raydium locked LP fee
            await raydiumSwapInput(ethers.encodeBase58(poolId)); // fake some swap in order to be able to collect some fees
            await config.utils.asyncTimeout(10000);

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