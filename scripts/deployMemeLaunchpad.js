const { ethers } = require("hardhat");

async function main() {
    let MemeLaunchpadFactory;
    try {
        MemeLaunchpadFactory = await ethers.getContractFactory('contracts/MemeLaunchpad/MemeLaunchpad.sol:MemeLaunchpad');
        console.log("MemeLaunchpadFactory:", MemeLaunchpadFactory);
    } catch (error) {
        console.error("Error creating MemeLaunchpadFactory:", error);
        throw error;
    }
    const MemeLaunchpad = await MemeLaunchpadFactory.deploy(
        "0xF6b17787154C418d5773Ea22Afc87A95CAA3e957",
        "0x0Fc6Ec7F9F06bd733913C1Fcd10BFc959a1F88DC",
        "0xc7Fc9b46e479c5Cb42f6C458D1881e55E6B7986c",
        100
    );
    await MemeLaunchpad.waitForDeployment();
    console.log("MemeLaunchpad deployed at:", MemeLaunchpad.target);
}

main().catch(console.error);