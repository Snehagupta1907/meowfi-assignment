const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BorrowingPool", function () {
  let borrowingPool: { getAddress: () => any; addSupportedNFT: (arg0: any) => any; addSupportedERC20: (arg0: any) => any; owner: () => any; usdc: () => any; priceOracle: () => any; connect: (arg0: any) => { (): any; new(): any; addNFTCollateral: { (arg0: any, arg1: number): any; new(): any; }; borrowNFT: { (arg0: number, arg1: any): any; new(): any; }; repayNFT: { (arg0: number, arg1: any): any; new(): any; }; removeNFTCollateral: { (arg0: number): any; new(): any; }; addERC20Collateral: { (arg0: any, arg1: any): any; new(): any; }; borrowERC20: { (arg0: number, arg1: any): any; new(): any; }; repayERC20: { (arg0: number, arg1: any): any; new(): any; }; removeERC20Collateral: { (arg0: number): any; new(): any; }; addSupportedNFT: { (arg0: any): any; new(): any; }; addSupportedERC20: { (arg0: any): any; new(): any; }; }; getNFTCollaterals: (arg0: any) => any; getTotalBorrowed: (arg0: any) => any; getERC20Collaterals: (arg0: any) => any; supportedNFTs: (arg0: any) => any; supportedERC20s: (arg0: any) => any; };
  let mockUSDC: { getAddress: () => any; mint: (arg0: any, arg1: any) => any; balanceOf: (arg0: any) => any; connect: (arg0: any) => { (): any; new(): any; approve: { (arg0: any, arg1: any): any; new(): any; }; }; };
  let mockPriceOracle: { getAddress: () => any; setTokenPrice: (arg0: any, arg1: any) => any; };
  let liquidNFT: { getAddress: () => any; mint: (arg0: any, arg1: any) => any; connect: (arg0: { address: any; }) => { (): any; new(): any; approve: { (arg0: any, arg1: number): any; new(): any; }; }; ownerOf: (arg0: number) => any; };
  let lpToken: { getAddress: () => any; mint: (arg0: any, arg1: any) => any; connect: (arg0: { address: any; }) => { (): any; new(): any; approve: { (arg0: any, arg1: any): any; new(): any; }; }; balanceOf: (arg0: any) => any; };
  let owner: { address: any; };
  let user1: { address: any; };
  let user2: { address: any; };
  
  // Constants for testing
  const NFT_VALUE = ethers.parseUnits("1000", 8); // $1000 with 8 decimals for price oracle
  const LP_TOKEN_VALUE = ethers.parseUnits("500", 8); // $500 per LP token with 8 decimals
  const LP_DEPOSIT_AMOUNT = ethers.parseUnits("10", 18); // 10 LP tokens
  const USDC_MINT_AMOUNT = ethers.parseUnits("10000", 6); // 10,000 USDC
  
  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy mock contracts
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy();
    
    const MockPriceOracle = await ethers.getContractFactory("MockPriceOracle");
    mockPriceOracle = await MockPriceOracle.deploy();
    
    const LiquidNFT = await ethers.getContractFactory("LiquidNFT");
    liquidNFT = await LiquidNFT.deploy();
    
    const LPToken = await ethers.getContractFactory("LPToken");
    lpToken = await LPToken.deploy();
    
    // Deploy BorrowingPool
    const BorrowingPool = await ethers.getContractFactory("BorrowingPool");
    borrowingPool = await BorrowingPool.deploy(await mockUSDC.getAddress(), await mockPriceOracle.getAddress());
    
    // Mint USDC to the BorrowingPool
    await mockUSDC.mint(await borrowingPool.getAddress(), USDC_MINT_AMOUNT);
    
    // Set token prices in the oracle
    await mockPriceOracle.setTokenPrice(await liquidNFT.getAddress(), NFT_VALUE);
    await mockPriceOracle.setTokenPrice(await lpToken.getAddress(), LP_TOKEN_VALUE);
    
    // Add supported tokens to BorrowingPool
    await borrowingPool.addSupportedNFT(await liquidNFT.getAddress());
    await borrowingPool.addSupportedERC20(await lpToken.getAddress());
    
    // Prepare user's test assets
    // Mint NFT to user1
    await liquidNFT.mint(user1.address, NFT_VALUE);// tokenid 0 - 1000usdt
    
    // Mint LP tokens to users
    await lpToken.mint(user1.address, LP_DEPOSIT_AMOUNT);
    await lpToken.mint(user2.address, LP_DEPOSIT_AMOUNT);
    
    // Approve BorrowingPool to transfer tokens
    await liquidNFT.connect(user1).approve(await borrowingPool.getAddress(), 0); // TokenId 0
    await lpToken.connect(user1).approve(await borrowingPool.getAddress(), LP_DEPOSIT_AMOUNT);
    await lpToken.connect(user2).approve(await borrowingPool.getAddress(), LP_DEPOSIT_AMOUNT);
  });
  
  describe("Contract Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await borrowingPool.owner()).to.equal(owner.address);
    });
    
    it("Should set the correct USDC address", async function () {
      expect(await borrowingPool.usdc()).to.equal(await mockUSDC.getAddress());
    });
    
    it("Should set the correct PriceOracle address", async function () {
      expect(await borrowingPool.priceOracle()).to.equal(await mockPriceOracle.getAddress());
    });
  });
  
  describe("NFT Collateral Operations", function () {
    it("Should add NFT as collateral", async function () {
      await borrowingPool.connect(user1).addNFTCollateral(await liquidNFT.getAddress(), 0);
      
      const nftCollaterals = await borrowingPool.getNFTCollaterals(user1.address);
      expect(nftCollaterals.length).to.equal(1);
      expect(nftCollaterals[0].token).to.equal(await liquidNFT.getAddress());
      expect(nftCollaterals[0].tokenId).to.equal(0);
      expect(nftCollaterals[0].borrowedAmount).to.equal(0);
      expect(nftCollaterals[0].collateralValue).to.equal(NFT_VALUE);
      
      // Verify NFT was transferred to the contract
      expect(await liquidNFT.ownerOf(0)).to.equal(await borrowingPool.getAddress());
    });
    
    it("Should not add unsupported NFT as collateral", async function () {
      // Deploy a new unsupported NFT
      const UnsupportedNFT = await ethers.getContractFactory("LiquidNFT");
      const unsupportedNFT = await UnsupportedNFT.deploy();
      await unsupportedNFT.mint(user1.address, NFT_VALUE);
      await unsupportedNFT.connect(user1).approve(await borrowingPool.getAddress(), 0);
      
      await expect(
        borrowingPool.connect(user1).addNFTCollateral(await unsupportedNFT.getAddress(), 0)
      ).to.be.revertedWith("NFT not supported");
    });
    
    it("Should borrow against NFT collateral", async function () {
      // Add NFT as collateral
      await borrowingPool.connect(user1).addNFTCollateral(await liquidNFT.getAddress(), 0);// 1000
      
      // Calculate borrow amount (70% LTV of $1000 = $700 in USDC)
      const borrowAmount = ethers.parseUnits("700", 6); // $700 USDC with 6 decimals
      
      // Initial USDC balance
      const initialUSDCBalance = await mockUSDC.balanceOf(user1.address);
      
      // Borrow against the NFT
      await borrowingPool.connect(user1).borrowNFT(0, borrowAmount);
      
      // Check the borrowed amount was updated
      const nftCollaterals = await borrowingPool.getNFTCollaterals(user1.address);
      expect(nftCollaterals[0].borrowedAmount).to.equal(borrowAmount);
      
      // Check that USDC was transferred to the user
      const finalUSDCBalance = await mockUSDC.balanceOf(user1.address);
      expect(finalUSDCBalance - initialUSDCBalance).to.equal(borrowAmount);
      
      // Check total borrowed
      expect(await borrowingPool.getTotalBorrowed(user1.address)).to.equal(borrowAmount);
    });
    
    it("Should not borrow more than LTV allows", async function () {
      // Add NFT as collateral
      await borrowingPool.connect(user1).addNFTCollateral(await liquidNFT.getAddress(), 0);
      
      // Try to borrow more than allowed (LTV is 70% of $1000 = $700)
      const excessiveBorrowAmount = ethers.parseUnits("701", 6); // $701 USDC
      
      await expect(
        borrowingPool.connect(user1).borrowNFT(0, excessiveBorrowAmount)
      ).to.be.revertedWith("Borrow amount exceeds LTV");
    });
    
    it("Should repay borrowed amount for NFT", async function () {
      // Add NFT as collateral
      await borrowingPool.connect(user1).addNFTCollateral(await liquidNFT.getAddress(), 0);
      
      // Borrow against the NFT
      const borrowAmount = ethers.parseUnits("500", 6); // $500 USDC
      await borrowingPool.connect(user1).borrowNFT(0, borrowAmount);
      
      // Mint some USDC to user for repayment
      await mockUSDC.mint(user1.address, borrowAmount);
      await mockUSDC.connect(user1).approve(await borrowingPool.getAddress(), borrowAmount);
      
      // Repay the borrowed amount
      await borrowingPool.connect(user1).repayNFT(0, borrowAmount);
      
      // Check that the borrowed amount was updated
      const nftCollaterals = await borrowingPool.getNFTCollaterals(user1.address);
      expect(nftCollaterals[0].borrowedAmount).to.equal(0);
      
      // Check total borrowed
      expect(await borrowingPool.getTotalBorrowed(user1.address)).to.equal(0);
    });
    
    it("Should remove NFT collateral when fully repaid", async function () {
      // Add NFT as collateral
      await borrowingPool.connect(user1).addNFTCollateral(await liquidNFT.getAddress(), 0);
      
      // Borrow against the NFT
      const borrowAmount = ethers.parseUnits("500", 6); // $500 USDC
      await borrowingPool.connect(user1).borrowNFT(0, borrowAmount);
      
      // Mint some USDC to user for repayment
      await mockUSDC.mint(user1.address, borrowAmount);
      await mockUSDC.connect(user1).approve(await borrowingPool.getAddress(), borrowAmount);
      
      // Repay the borrowed amount
      await borrowingPool.connect(user1).repayNFT(0, borrowAmount);
      
      // Remove the collateral
      await borrowingPool.connect(user1).removeNFTCollateral(0);
      
      // Check that the NFT was returned to the user
      expect(await liquidNFT.ownerOf(0)).to.equal(user1.address);
      
      // Check that the collateral was removed from the user's position
      const nftCollaterals = await borrowingPool.getNFTCollaterals(user1.address);
      expect(nftCollaterals.length).to.equal(0);
    });
    
    it("Should not remove NFT collateral with outstanding debt", async function () {
      // Add NFT as collateral
      await borrowingPool.connect(user1).addNFTCollateral(await liquidNFT.getAddress(), 0);
      
      // Borrow against the NFT
      const borrowAmount = ethers.parseUnits("500", 6); // $500 USDC
      await borrowingPool.connect(user1).borrowNFT(0, borrowAmount);
      
      // Try to remove without repaying
      await expect(
        borrowingPool.connect(user1).removeNFTCollateral(0)
      ).to.be.revertedWith("Repay borrowed amount first");
    });
  });
  
  describe("ERC20 Collateral Operations", function () {
    it("Should add ERC20 tokens as collateral", async function () {
      await borrowingPool.connect(user1).addERC20Collateral(await lpToken.getAddress(), LP_DEPOSIT_AMOUNT);
      
      const erc20Collaterals = await borrowingPool.getERC20Collaterals(user1.address);
      expect(erc20Collaterals.length).to.equal(1);
      expect(erc20Collaterals[0].token).to.equal(await lpToken.getAddress());
      expect(erc20Collaterals[0].amount).to.equal(LP_DEPOSIT_AMOUNT);
      expect(erc20Collaterals[0].borrowedAmount).to.equal(0);
      
      // Calculate expected collateral value: price * amount / 10^decimals
      // $500 (with 8 decimals) * 10 LP tokens (with 18 decimals) / 10^18 = $5000 with 8 decimals
      const expectedCollateralValue = BigInt(LP_TOKEN_VALUE * LP_DEPOSIT_AMOUNT) / BigInt(10 ** 18);
      expect(erc20Collaterals[0].collateralValue).to.equal(expectedCollateralValue);
      
      // Verify LP tokens were transferred to the contract
      expect(await lpToken.balanceOf(await borrowingPool.getAddress())).to.equal(LP_DEPOSIT_AMOUNT);
    });
    
    it("Should not add unsupported ERC20 as collateral", async function () {
      // Deploy a new unsupported ERC20
      const UnsupportedToken = await ethers.getContractFactory("LPToken");
      const unsupportedToken = await UnsupportedToken.deploy();
      await unsupportedToken.mint(user1.address, LP_DEPOSIT_AMOUNT);
      await unsupportedToken.connect(user1).approve(await borrowingPool.getAddress(), LP_DEPOSIT_AMOUNT);
      
      await expect(
        borrowingPool.connect(user1).addERC20Collateral(await unsupportedToken.getAddress(), LP_DEPOSIT_AMOUNT)
      ).to.be.revertedWith("ERC20 token not supported");
    });
    
    it("Should borrow against ERC20 collateral", async function () {
      // Add LP tokens as collateral
      await borrowingPool.connect(user1).addERC20Collateral(await lpToken.getAddress(), LP_DEPOSIT_AMOUNT);
      
      // Calculate collateral value and max borrow amount
      // 10 LP tokens worth $500 each = $5000 total
      // With 70% LTV, can borrow up to $3500
      const borrowAmount = ethers.parseUnits("3500", 6); // $3500 USDC with 6 decimals
      
      // Initial USDC balance
      const initialUSDCBalance = await mockUSDC.balanceOf(user1.address);
      
      // Borrow against the LP tokens
      await borrowingPool.connect(user1).borrowERC20(0, borrowAmount);
      
      // Check the borrowed amount was updated
      const erc20Collaterals = await borrowingPool.getERC20Collaterals(user1.address);
      expect(erc20Collaterals[0].borrowedAmount).to.equal(borrowAmount);
      
      // Check that USDC was transferred to the user
      const finalUSDCBalance = await mockUSDC.balanceOf(user1.address);
      expect(finalUSDCBalance - initialUSDCBalance).to.equal(borrowAmount);
      
      // Check total borrowed
      expect(await borrowingPool.getTotalBorrowed(user1.address)).to.equal(borrowAmount);
    });
    
    it("Should not borrow more than ERC20 LTV allows", async function () {
      // Add LP tokens as collateral
      await borrowingPool.connect(user1).addERC20Collateral(await lpToken.getAddress(), LP_DEPOSIT_AMOUNT);
      
      // Calculate max borrow: $5000 * 70% = $3500
      // Try to borrow slightly more
      const excessiveBorrowAmount = ethers.parseUnits("3501", 6); // $3501 USDC
      
      await expect(
        borrowingPool.connect(user1).borrowERC20(0, excessiveBorrowAmount)
      ).to.be.revertedWith("Borrow amount exceeds LTV");
    });
    
    it("Should repay borrowed amount for ERC20", async function () {
      // Add LP tokens as collateral
      await borrowingPool.connect(user1).addERC20Collateral(await lpToken.getAddress(), LP_DEPOSIT_AMOUNT);
      
      // Borrow against the LP tokens
      const borrowAmount = ethers.parseUnits("2000", 6); // $2000 USDC
      await borrowingPool.connect(user1).borrowERC20(0, borrowAmount);
      
      // Mint some USDC to user for repayment
      await mockUSDC.mint(user1.address, borrowAmount);
      await mockUSDC.connect(user1).approve(await borrowingPool.getAddress(), borrowAmount);
      
      // Repay the borrowed amount
      await borrowingPool.connect(user1).repayERC20(0, borrowAmount);
      
      // Check that the borrowed amount was updated
      const erc20Collaterals = await borrowingPool.getERC20Collaterals(user1.address);
      expect(erc20Collaterals[0].borrowedAmount).to.equal(0);
      
      // Check total borrowed
      expect(await borrowingPool.getTotalBorrowed(user1.address)).to.equal(0);
    });
    
    it("Should remove ERC20 collateral when fully repaid", async function () {
      // Add LP tokens as collateral
      await borrowingPool.connect(user1).addERC20Collateral(await lpToken.getAddress(), LP_DEPOSIT_AMOUNT);
      
      // Borrow against the LP tokens
      const borrowAmount = ethers.parseUnits("2000", 6); // $2000 USDC
      await borrowingPool.connect(user1).borrowERC20(0, borrowAmount);
      
      // Mint some USDC to user for repayment
      await mockUSDC.mint(user1.address, borrowAmount);
      await mockUSDC.connect(user1).approve(await borrowingPool.getAddress(), borrowAmount);
      
      // Repay the borrowed amount
      await borrowingPool.connect(user1).repayERC20(0, borrowAmount);
      
      // Initial LP token balance
      const initialLPBalance = await lpToken.balanceOf(user1.address);
      
      // Remove the collateral
      await borrowingPool.connect(user1).removeERC20Collateral(0);
      
      // Check that the LP tokens were returned to the user
      const finalLPBalance = await lpToken.balanceOf(user1.address);
      expect(finalLPBalance - initialLPBalance).to.equal(LP_DEPOSIT_AMOUNT);
      
      // Check that the collateral was removed from the user's position
      const erc20Collaterals = await borrowingPool.getERC20Collaterals(user1.address);
      expect(erc20Collaterals.length).to.equal(0);
    });
    
    it("Should not remove ERC20 collateral with outstanding debt", async function () {
      // Add LP tokens as collateral
      await borrowingPool.connect(user1).addERC20Collateral(await lpToken.getAddress(), LP_DEPOSIT_AMOUNT);
      
      // Borrow against the LP tokens
      const borrowAmount = ethers.parseUnits("2000", 6); // $2000 USDC
      await borrowingPool.connect(user1).borrowERC20(0, borrowAmount);
      
      // Try to remove without repaying
      await expect(
        borrowingPool.connect(user1).removeERC20Collateral(0)
      ).to.be.revertedWith("Repay borrowed amount first");
    });
  });
  
  describe("Multi-collateral operations", function () {
    it("Should correctly track multiple collaterals from the same user", async function () {
      // Add NFT collateral
      await borrowingPool.connect(user1).addNFTCollateral(await liquidNFT.getAddress(), 0);
      
      // Add ERC20 collateral
      await borrowingPool.connect(user1).addERC20Collateral(await lpToken.getAddress(), LP_DEPOSIT_AMOUNT);
      
      // Borrow against both
      const nftBorrowAmount = ethers.parseUnits("700", 6); // $700 USDC
      const erc20BorrowAmount = ethers.parseUnits("3000", 6); // $3000 USDC
      
      await borrowingPool.connect(user1).borrowNFT(0, nftBorrowAmount);
      await borrowingPool.connect(user1).borrowERC20(0, erc20BorrowAmount);
      
      // Check total borrowed
      const totalBorrowed = await borrowingPool.getTotalBorrowed(user1.address);
      expect(totalBorrowed).to.equal(nftBorrowAmount + erc20BorrowAmount);
    });
    
    it("Should handle different users with different collaterals", async function () {
      // User1 adds NFT collateral
      await borrowingPool.connect(user1).addNFTCollateral(await liquidNFT.getAddress(), 0);
      
      // User2 adds ERC20 collateral
      await borrowingPool.connect(user2).addERC20Collateral(await lpToken.getAddress(), LP_DEPOSIT_AMOUNT);
      
      // Both users borrow
      const nftBorrowAmount = ethers.parseUnits("700", 6); // $700 USDC
      const erc20BorrowAmount = ethers.parseUnits("3000", 6); // $3000 USDC
      
      await borrowingPool.connect(user1).borrowNFT(0, nftBorrowAmount);
      await borrowingPool.connect(user2).borrowERC20(0, erc20BorrowAmount);
      
      // Check total borrowed for each user
      expect(await borrowingPool.getTotalBorrowed(user1.address)).to.equal(nftBorrowAmount);
      expect(await borrowingPool.getTotalBorrowed(user2.address)).to.equal(erc20BorrowAmount);
      
      // Check collateral positions
      const user1NFTCollaterals = await borrowingPool.getNFTCollaterals(user1.address);
      const user2NFTCollaterals = await borrowingPool.getNFTCollaterals(user2.address);
      const user1ERC20Collaterals = await borrowingPool.getERC20Collaterals(user1.address);
      const user2ERC20Collaterals = await borrowingPool.getERC20Collaterals(user2.address);
      
      expect(user1NFTCollaterals.length).to.equal(1);
      expect(user2NFTCollaterals.length).to.equal(0);
      expect(user1ERC20Collaterals.length).to.equal(0);
      expect(user2ERC20Collaterals.length).to.equal(1);
    });
  });
  
  describe("Administrative functions", function () {
    it("Should allow owner to add supported NFTs", async function () {
      const newNFT = await (await ethers.getContractFactory("LiquidNFT")).deploy();
      expect(await borrowingPool.supportedNFTs(await newNFT.getAddress())).to.equal(false);
      
      await borrowingPool.addSupportedNFT(await newNFT.getAddress());
      expect(await borrowingPool.supportedNFTs(await newNFT.getAddress())).to.equal(true);
    });
    
    it("Should allow owner to add supported ERC20s", async function () {
      const newERC20 = await (await ethers.getContractFactory("LPToken")).deploy();
      expect(await borrowingPool.supportedERC20s(await newERC20.getAddress())).to.equal(false);
      
      await borrowingPool.addSupportedERC20(await newERC20.getAddress());
      expect(await borrowingPool.supportedERC20s(await newERC20.getAddress())).to.equal(true);
    });
    
    it("Should not allow non-owner to add supported tokens", async function () {
      const newNFT = await (await ethers.getContractFactory("LiquidNFT")).deploy();
      const newERC20 = await (await ethers.getContractFactory("LPToken")).deploy();
      
      await expect(
        borrowingPool.connect(user1).addSupportedNFT(await newNFT.getAddress())
      ).to.be.revertedWithCustomError(borrowingPool, "OwnableUnauthorizedAccount");
      
      await expect(
        borrowingPool.connect(user1).addSupportedERC20(await newERC20.getAddress())
      ).to.be.revertedWithCustomError(borrowingPool, "OwnableUnauthorizedAccount");
    });
  });
});