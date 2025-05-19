/* eslint-disable @typescript-eslint/no-explicit-any */
// components/UserPosition.tsx
import { ethers } from 'ethers';

interface UserPositionProps {
  nftCollaterals: any[];
  erc20Collaterals: any[];
  totalBorrowed: bigint;
}

export default function UserPosition({ nftCollaterals, erc20Collaterals, totalBorrowed }: UserPositionProps) {
  return (
    <div className="space-y-2">
      <div>
        <h3 className="font-semibold">Total Borrowed:</h3>
        <p>{ethers.formatUnits(totalBorrowed, 6)} USDC</p>
      </div>
      <div>
        <h3 className="font-semibold">NFT Collaterals:</h3>
        <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
          {JSON.stringify(nftCollaterals, null, 2)}
        </pre>
      </div>
      <div>
        <h3 className="font-semibold">ERC20 Collaterals:</h3>
        <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
          {JSON.stringify(erc20Collaterals, null, 2)}
        </pre>
      </div>
    </div>
  );
}
