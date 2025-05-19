// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract MockPriceOracle is Ownable {
    // Price in USD with 8 decimals
    mapping(address => uint256) private tokenPrices;
    
    constructor() Ownable(msg.sender) {
        // Set some initial dummy prices 
        tokenPrices[address(0)] = 2000 * 1e8; //8 decimal like chainlink
    }

    function setTokenPrice(address token, uint256 price) external onlyOwner {
        tokenPrices[token] = price;
    }

    function getPrice(address token) external view returns (uint256) {
        uint256 price = tokenPrices[token];
        require(price > 0, "Price not set");
        return price;
    }
}
