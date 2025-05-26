const hre = require("hardhat");

async function main() {
    console.log("Deploying MemeLaunchpad contract...");

    // These addresses should be provided as environment variables or command line arguments
    const ERC20_FOR_SPL_FACTORY = process.env.ERC20_FOR_SPL_FACTORY;
    const BONDING_CURVE = process.env.BONDING_CURVE;
    const WSOL_TOKEN = process.env.WSOL_TOKEN;
    const FEE_PERCENT = 500; // 5% in basis points

    if (!ERC20_FOR_SPL_FACTORY || !BONDING_CURVE || !WSOL_TOKEN) {
        throw new Error("Missing required environment variables. Please set ERC20_FOR_SPL_FACTORY, BONDING_CURVE, and WSOL_TOKEN");
    }

    const MemeLaunchpad = await hre.ethers.getContractFactory("MemeLaunchpad");
    const memeLaunchpad = await MemeLaunchpad.deploy(
        ERC20_FOR_SPL_FACTORY,
        BONDING_CURVE,
        WSOL_TOKEN,
        FEE_PERCENT
    );

    await memeLaunchpad.waitForDeployment();

    console.log("MemeLaunchpad deployed to:", await memeLaunchpad.getAddress());
    console.log("Deployment parameters:");
    console.log("ERC20ForSplFactory:", ERC20_FOR_SPL_FACTORY);
    console.log("BondingCurve:", BONDING_CURVE);
    console.log("WSOL Token:", WSOL_TOKEN);
    console.log("Fee Percent:", FEE_PERCENT);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 