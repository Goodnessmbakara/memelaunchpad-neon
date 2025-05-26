const hre = require("hardhat");

async function main() {
    console.log("Deploying BondingCurve contract...");

    // Deploy BondingCurve with initial parameters
    // A and B are the parameters for the exponential bonding curve
    // These values should be carefully chosen based on your tokenomics
    const A = hre.ethers.parseEther("1"); // Example value
    const B = hre.ethers.parseEther("0.1"); // Example value

    const BondingCurve = await hre.ethers.getContractFactory("BondingCurve");
    const bondingCurve = await BondingCurve.deploy(A, B);

    await bondingCurve.waitForDeployment();

    console.log("BondingCurve deployed to:", await bondingCurve.getAddress());
    console.log("Deployment parameters:");
    console.log("A:", A.toString());
    console.log("B:", B.toString());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 