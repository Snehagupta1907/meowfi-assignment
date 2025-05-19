import { ethers } from "hardhat";

async function main() {
  // Deploy MockUSDC
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  console.log("MockUSDC deployed to:", await usdc.getAddress());

  // Deploy MockPriceOracle
  const MockPriceOracle = await ethers.getContractFactory("MockPriceOracle");
  const priceOracle = await MockPriceOracle.deploy();
  await priceOracle.waitForDeployment();
  console.log("MockPriceOracle deployed to:", await priceOracle.getAddress());

  // Deploy LiquidNFT (ERC721)
  const LiquidNFT = await ethers.getContractFactory("LiquidNFT");
  const liquidNFT = await LiquidNFT.deploy();
  await liquidNFT.waitForDeployment();
  console.log("LiquidNFT deployed to:", await liquidNFT.getAddress());

  // Deploy LPToken (ERC20)
  const LPToken = await ethers.getContractFactory("LPToken");
  const lpToken = await LPToken.deploy();
  await lpToken.waitForDeployment();
  console.log("LPToken deployed to:", await lpToken.getAddress());

  // Deploy BorrowingPool with USDC and PriceOracle addresses
  const BorrowingPool = await ethers.getContractFactory("BorrowingPool");
  const borrowingPool = await BorrowingPool.deploy(
    await usdc.getAddress(),
    await priceOracle.getAddress()
  );
  await borrowingPool.waitForDeployment();
  console.log("BorrowingPool deployed to:", await borrowingPool.getAddress());

  const [owner] = await ethers.getSigners();

  // Add supported NFT and ERC20 collateral
  await borrowingPool.addSupportedNFT(await liquidNFT.getAddress());
  await borrowingPool.addSupportedERC20(await lpToken.getAddress());

  // Set token prices in oracle
  await priceOracle.setTokenPrice(await liquidNFT.getAddress(), ethers.parseUnits("1000", 8)); // $1000
  await priceOracle.setTokenPrice(await lpToken.getAddress(), ethers.parseUnits("500", 8)); // $500

  // Mint USDC to the pool for borrowing liquidity
  await usdc.mint(await borrowingPool.getAddress(), ethers.parseUnits("1000000", 6)); // 1M USDC

  // Mint LiquidNFT and LPToken to the user (owner)
  await liquidNFT.mint(owner.address, ethers.parseEther("1")); // Mint 1 NFT (tokenId = 0) with value = 1 eth
  await lpToken.mint(owner.address, ethers.parseUnits("1000", 18)); // Mint 1000 LP tokens
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
