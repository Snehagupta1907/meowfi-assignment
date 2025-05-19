// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./MockPriceOracle.sol";

contract BorrowingPool is Ownable {
    IERC20 public usdc;
    MockPriceOracle public priceOracle;

    uint256 public constant LTV_RATIO = 70; // 70%
    uint256 public constant LIQUIDATION_THRESHOLD = 85; 
    uint256 public constant LIQUIDATION_BONUS = 10; // 10% bonus 
    uint256 public constant PRICE_DECIMALS = 8;
    uint256 public constant USDC_DECIMALS = 6;

    enum CollateralType { NFT, ERC20 }

    struct NFTCollateral {
        address token;
        uint256 tokenId;
        uint256 borrowedAmount; // amount borrowed against this NFT
        uint256 collateralValue; // value of this NFT
        bool isLiquidated;
    }

    struct ERC20Collateral {
        address token;
        uint256 amount; // LP tokens deposited
        uint256 borrowedAmount; // borrowed against this LP token amount
        uint256 collateralValue; // value of the deposited amount
        bool isLiquidated;
    }

    struct Position {
        NFTCollateral[] nftCollaterals;
        ERC20Collateral[] erc20Collaterals;
    }

    mapping(address => Position) internal positions;
    mapping(address => bool) public supportedNFTs;
    mapping(address => bool) public supportedERC20s;
    
    // New mappings for liquidation features
    mapping(address => uint256) public lastUpdateTimestamp;
    uint256 public updateInterval = 3600; // 1 hour default interval for updates

    event NFTCollateralAdded(address indexed user, address token, uint256 tokenId, uint256 value);
    event NFTCollateralRemoved(address indexed user, address token, uint256 tokenId);
    event ERC20CollateralAdded(address indexed user, address token, uint256 amount, uint256 value);
    event ERC20CollateralRemoved(address indexed user, address token, uint256 amount);
    event Borrowed(address indexed user, CollateralType collateralType, uint256 index, uint256 amount);
    event Repaid(address indexed user, CollateralType collateralType, uint256 index, uint256 amount);
    event CollateralLiquidated(address indexed user, CollateralType collateralType, uint256 index, address liquidator);
    event CollateralValueUpdated(address indexed user, CollateralType collateralType, uint256 index, uint256 oldValue, uint256 newValue);

    constructor(address _usdc, address _priceOracle) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        priceOracle = MockPriceOracle(_priceOracle);
    }

    function addSupportedNFT(address token) external onlyOwner {
        supportedNFTs[token] = true;
    }

    function addSupportedERC20(address token) external onlyOwner {
        supportedERC20s[token] = true;
    }
    
    function setUpdateInterval(uint256 _interval) external onlyOwner {
        updateInterval = _interval;
    }

    // Add NFT as collateral
    function addNFTCollateral(address token, uint256 tokenId) external {
        require(supportedNFTs[token], "NFT not supported");
        require(IERC721(token).ownerOf(tokenId) == msg.sender, "Not token owner");

        IERC721(token).transferFrom(msg.sender, address(this), tokenId);

        uint256 price = priceOracle.getPrice(token);
        require(price > 0, "Price not available");

        positions[msg.sender].nftCollaterals.push(
            NFTCollateral({
                token: token,
                tokenId: tokenId,
                borrowedAmount: 0,
                collateralValue: price,
                isLiquidated: false
            })
        );
        
        lastUpdateTimestamp[msg.sender] = block.timestamp;

        emit NFTCollateralAdded(msg.sender, token, tokenId, price);
    }

    // Remove NFT collateral (only if fully repaid)
    function removeNFTCollateral(uint256 index) external {
        Position storage position = positions[msg.sender];
        require(index < position.nftCollaterals.length, "Invalid index");
        NFTCollateral storage nftCol = position.nftCollaterals[index];
        require(nftCol.borrowedAmount == 0, "Repay borrowed amount first");
        require(!nftCol.isLiquidated, "Collateral already liquidated");

        IERC721(nftCol.token).transferFrom(address(this), msg.sender, nftCol.tokenId);


        position.nftCollaterals[index] = position.nftCollaterals[position.nftCollaterals.length - 1];
        position.nftCollaterals.pop();

        emit NFTCollateralRemoved(msg.sender, nftCol.token, nftCol.tokenId);
    }

   
    function addERC20Collateral(address token, uint256 amount) external {
        require(supportedERC20s[token], "ERC20 token not supported");
        require(amount > 0, "Amount must be > 0");
        IERC20(token).transferFrom(msg.sender, address(this), amount);

        uint256 price = priceOracle.getPrice(token);
        require(price > 0, "Price not available");

        // collateral value = price * amount / (10 ** token decimals)
        uint256 decimals = IERC20Metadata(token).decimals();
        uint256 collateralValue = (price * amount) / (10 ** decimals);

        positions[msg.sender].erc20Collaterals.push(
            ERC20Collateral({
                token: token,
                amount: amount,
                borrowedAmount: 0,
                collateralValue: collateralValue,
                isLiquidated: false
            })
        );
        
        lastUpdateTimestamp[msg.sender] = block.timestamp;

        emit ERC20CollateralAdded(msg.sender, token, amount, collateralValue);
    }


    function removeERC20Collateral(uint256 index) external {
        Position storage position = positions[msg.sender];
        require(index < position.erc20Collaterals.length, "Invalid index");
        ERC20Collateral storage ercCol = position.erc20Collaterals[index];
        require(ercCol.borrowedAmount == 0, "Repay borrowed amount first");
        require(!ercCol.isLiquidated, "Collateral already liquidated");

        IERC20(ercCol.token).transfer(msg.sender, ercCol.amount);

  
        position.erc20Collaterals[index] = position.erc20Collaterals[position.erc20Collaterals.length - 1];
        position.erc20Collaterals.pop();

        emit ERC20CollateralRemoved(msg.sender, ercCol.token, ercCol.amount);
    }

    function borrowNFT(uint256 index, uint256 amount) external {
        Position storage position = positions[msg.sender];
        require(index < position.nftCollaterals.length, "Invalid index");
        NFTCollateral storage nftCol = position.nftCollaterals[index];
        require(nftCol.collateralValue > 0, "Invalid collateral value");
        require(!nftCol.isLiquidated, "Collateral already liquidated");
        
        _updateNFTCollateralValue(msg.sender, index);

        uint256 maxBorrow = (nftCol.collateralValue * LTV_RATIO * (10 ** USDC_DECIMALS)) / (100 * (10 ** PRICE_DECIMALS));
        require(nftCol.borrowedAmount + amount <= maxBorrow, "Borrow amount exceeds LTV");

        nftCol.borrowedAmount += amount;
        require(usdc.transfer(msg.sender, amount), "USDC transfer failed");

        emit Borrowed(msg.sender, CollateralType.NFT, index, amount);
    }

    function borrowERC20(uint256 index, uint256 amount) external {
        Position storage position = positions[msg.sender];
        require(index < position.erc20Collaterals.length, "Invalid index");
        ERC20Collateral storage ercCol = position.erc20Collaterals[index];
        require(ercCol.collateralValue > 0, "Invalid collateral value");
        require(!ercCol.isLiquidated, "Collateral already liquidated");
        

        _updateERC20CollateralValue(msg.sender, index);

        uint256 maxBorrow = (ercCol.collateralValue * LTV_RATIO * (10 ** USDC_DECIMALS)) / (100 * (10 ** PRICE_DECIMALS));
        require(ercCol.borrowedAmount + amount <= maxBorrow, "Borrow amount exceeds LTV");

        ercCol.borrowedAmount += amount;
        require(usdc.transfer(msg.sender, amount), "USDC transfer failed");

        emit Borrowed(msg.sender, CollateralType.ERC20, index, amount);
    }

   
    function repayNFT(uint256 index, uint256 amount) external {
        Position storage position = positions[msg.sender];
        require(index < position.nftCollaterals.length, "Invalid index");
        NFTCollateral storage nftCol = position.nftCollaterals[index];
        require(!nftCol.isLiquidated, "Collateral already liquidated");
        require(amount <= nftCol.borrowedAmount, "Repay amount exceeds borrowed");

        require(usdc.transferFrom(msg.sender, address(this), amount), "USDC transfer failed");

        nftCol.borrowedAmount -= amount;
        emit Repaid(msg.sender, CollateralType.NFT, index, amount);
    }

    
    function repayERC20(uint256 index, uint256 amount) external {
        Position storage position = positions[msg.sender];
        require(index < position.erc20Collaterals.length, "Invalid index");
        ERC20Collateral storage ercCol = position.erc20Collaterals[index];
        require(!ercCol.isLiquidated, "Collateral already liquidated");
        require(amount <= ercCol.borrowedAmount, "Repay amount exceeds borrowed");

        require(usdc.transferFrom(msg.sender, address(this), amount), "USDC transfer failed");

        ercCol.borrowedAmount -= amount;
        emit Repaid(msg.sender, CollateralType.ERC20, index, amount);
    }
    
    function updateCollateralValues(address user) public {
        if (block.timestamp - lastUpdateTimestamp[user] < updateInterval) {
            return; 
        }
        
        Position storage position = positions[user];
        
   
        for (uint i = 0; i < position.nftCollaterals.length; i++) {
            if (!position.nftCollaterals[i].isLiquidated) {
                _updateNFTCollateralValue(user, i);
            }
        }
        

        for (uint i = 0; i < position.erc20Collaterals.length; i++) {
            if (!position.erc20Collaterals[i].isLiquidated) {
                _updateERC20CollateralValue(user, i);
            }
        }
        
        lastUpdateTimestamp[user] = block.timestamp;
    }
    

    function _updateNFTCollateralValue(address user, uint256 index) internal {
        Position storage position = positions[user];
        NFTCollateral storage nftCol = position.nftCollaterals[index];
        
        if (nftCol.isLiquidated) return;
        
        uint256 oldValue = nftCol.collateralValue;
        uint256 newValue = priceOracle.getPrice(nftCol.token);
        
        if (newValue > 0 && newValue != oldValue) {
            nftCol.collateralValue = newValue;
            emit CollateralValueUpdated(user, CollateralType.NFT, index, oldValue, newValue);
            
          
            _checkAndMarkForLiquidation(user, CollateralType.NFT, index);
        }
    }
    

    function _updateERC20CollateralValue(address user, uint256 index) internal {
        Position storage position = positions[user];
        ERC20Collateral storage ercCol = position.erc20Collaterals[index];
        
        if (ercCol.isLiquidated) return;
        
        uint256 oldValue = ercCol.collateralValue;
        uint256 price = priceOracle.getPrice(ercCol.token);
        
        if (price > 0) {
            uint256 decimals = IERC20Metadata(ercCol.token).decimals();
            uint256 newValue = (price * ercCol.amount) / (10 ** decimals);
            
            if (newValue != oldValue) {
                ercCol.collateralValue = newValue;
                emit CollateralValueUpdated(user, CollateralType.ERC20, index, oldValue, newValue);

                _checkAndMarkForLiquidation(user, CollateralType.ERC20, index);
            }
        }
    }
    
    // Check if position is liquidatable
    function _checkAndMarkForLiquidation(address user, CollateralType colType, uint256 index) internal {
        if (colType == CollateralType.NFT) {
            NFTCollateral storage nftCol = positions[user].nftCollaterals[index];
            
      
            uint256 maxBorrowAtThreshold = (nftCol.collateralValue * LIQUIDATION_THRESHOLD * (10 ** USDC_DECIMALS)) / 
                                          (100 * (10 ** PRICE_DECIMALS));
            
           
            if (nftCol.borrowedAmount > maxBorrowAtThreshold) {
                nftCol.isLiquidated = true;
            }
        } else { // ERC20
            ERC20Collateral storage ercCol = positions[user].erc20Collaterals[index];
            
       
            uint256 maxBorrowAtThreshold = (ercCol.collateralValue * LIQUIDATION_THRESHOLD * (10 ** USDC_DECIMALS)) / 
                                          (100 * (10 ** PRICE_DECIMALS));
            
         
            if (ercCol.borrowedAmount > maxBorrowAtThreshold) {
                ercCol.isLiquidated = true;
            }
        }
    }
    

    function liquidateNFTPosition(address user, uint256 index) external {
        Position storage position = positions[user];
        require(index < position.nftCollaterals.length, "Invalid index");
        NFTCollateral storage nftCol = position.nftCollaterals[index];
        
        _updateNFTCollateralValue(user, index);
        
        require(nftCol.isLiquidated, "Position not marked for liquidation");
        
        //  liquidator needs to pay (borrowed amount)
        uint256 repayAmount = nftCol.borrowedAmount;
        
        // Transfer USDC from liquidator to pool
        require(usdc.transferFrom(msg.sender, address(this), repayAmount), "USDC transfer failed");
        
        // Transfer NFT to liquidator
        IERC721(nftCol.token).transferFrom(address(this), msg.sender, nftCol.tokenId);
        
        nftCol.borrowedAmount = 0;
        
        emit CollateralLiquidated(user, CollateralType.NFT, index, msg.sender);
    }
    
  
    function liquidateERC20Position(address user, uint256 index) external {
        Position storage position = positions[user];
        require(index < position.erc20Collaterals.length, "Invalid index");
        ERC20Collateral storage ercCol = position.erc20Collaterals[index];
        

        _updateERC20CollateralValue(user, index);
        
        require(ercCol.isLiquidated, "Position not marked for liquidation");
        
        // Calculate amount liquidator needs to pay (borrowed amount)
        uint256 repayAmount = ercCol.borrowedAmount;
        
        // Transfer USDC from liquidator to pool
        require(usdc.transferFrom(msg.sender, address(this), repayAmount), "USDC transfer failed");
        
        // Transfer ERC20 tokens to liquidator
        IERC20(ercCol.token).transfer(msg.sender, ercCol.amount);
 
        ercCol.borrowedAmount = 0;
        
        emit CollateralLiquidated(user, CollateralType.ERC20, index, msg.sender);
    }
    

    function isLiquidatable(address user, CollateralType colType, uint256 index) external view returns (bool) {
        if (colType == CollateralType.NFT) {
            Position storage position = positions[user];
            if (index >= position.nftCollaterals.length) return false;
            return position.nftCollaterals[index].isLiquidated;
        } else { // ERC20
            Position storage position = positions[user];
            if (index >= position.erc20Collaterals.length) return false;
            return position.erc20Collaterals[index].isLiquidated;
        }
    }

    // View functions to get position details
    function getNFTCollaterals(address user) external view returns (NFTCollateral[] memory) {
        return positions[user].nftCollaterals;
    }

    function getERC20Collaterals(address user) external view returns (ERC20Collateral[] memory) {
        return positions[user].erc20Collaterals;
    }


    function getTotalBorrowed(address user) external view returns (uint256 total) {
        Position storage position = positions[user];
        for (uint i = 0; i < position.nftCollaterals.length; i++) {
            total += position.nftCollaterals[i].borrowedAmount;
        }
        for (uint i = 0; i < position.erc20Collaterals.length; i++) {
            total += position.erc20Collaterals[i].borrowedAmount;
        }
    }
}