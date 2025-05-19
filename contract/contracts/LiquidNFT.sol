// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LiquidNFT is ERC721, Ownable {
    uint256 private _nextTokenId;
    mapping(uint256 => uint256) public tokenValues; // Dummy value in wei

    constructor() ERC721("LiquidNFT", "LNFT") Ownable(msg.sender) {}

    function mint(address to, uint256 value) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        tokenValues[tokenId] = value;
        return tokenId;
    }

    function getTokenValue(uint256 tokenId) public view returns (uint256) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        return tokenValues[tokenId];
    }
} 