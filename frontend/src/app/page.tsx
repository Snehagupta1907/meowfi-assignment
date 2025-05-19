/* eslint-disable react-hooks/exhaustive-deps */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// /* eslint-disable @typescript-eslint/no-unused-vars */
// "use client";

// import { AwaitedReactNode, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useEffect, useState } from "react";
// import { useAccount } from "wagmi";
// import { ethers } from "ethers";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import {
//   Select,
//   SelectTrigger,
//   SelectContent,
//   SelectItem,
// } from "@/components/ui/select";
// import { Input } from "@/components/ui/input";
// import { ConnectButton } from "@/components/ConnectWallet";
// import { BorrowingABI, NFTABI,ERC20ABI } from "@/constants";
// const BORROWING_POOL_ADDRESS = "0x77Bae75cc8d10f756CCc244E8C6473BE46Fc7d62";
// const LIQUIDNFTADDRESS = "0xB1BD1a5793b561D4788B11728af02A3Cf1979219";
// const ERC20ADDRESS = "0x59b8592C40edB9E7eD92b10Cc3ec370Af9A6180e";
// const MOCKUSDCADDRESS = "0xb0574922Ae124B374fc699820deeC7a1eD226f3E";
// export default function BorrowPage() {
//   const { address } = useAccount();
//   const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
//   const [contract, setContract] = useState<ethers.Contract | null>(null);
//   const [liquidNFTContract, setLiquidNFTContract] =
//     useState<ethers.Contract | null>(null);
//     const [lpTokenContract, setLPTokenContract] =
//     useState<ethers.Contract | null>(null);
//     const [mockUsdcContract, setMockUsdcContract] =
//     useState<ethers.Contract | null>(null);
//   const [selectedNFT, setSelectedNFT] = useState<string>("");
//   const [selectedERC20, setSelectedERC20] = useState<string>("");
//   const [nftTokenId, setNftTokenId] = useState("");
//   const [erc20Amount, setErc20Amount] = useState("");
//   const [borrowAmount, setBorrowAmount] = useState("");
//   const [collateralType, setCollateralType] = useState<"nft" | "erc20">("nft");
//   const [collateralIndex, setCollateralIndex] = useState(0);
//   const [userPosition, setUserPosition] = useState<any>(null);

//   useEffect(() => {
//     const loadContract = async () => {
//       if (typeof window.ethereum !== "undefined") {
//         const browserProvider = new ethers.BrowserProvider(window.ethereum);
//         const signer = await browserProvider.getSigner();
//         console.log(signer, "signer");
//         const pool = new ethers.Contract(
//           BORROWING_POOL_ADDRESS,
//           BorrowingABI,
//           signer
//         );

//         const liquidNFT = new ethers.Contract(LIQUIDNFTADDRESS, NFTABI, signer);
//         const erc20Contract = new ethers.Contract(ERC20ADDRESS,ERC20ABI,signer);
//         const _mockUsdcContract = new ethers.Contract(MOCKUSDCADDRESS,ERC20ABI,signer);
//         setMockUsdcContract(_mockUsdcContract);
//         setLiquidNFTContract(liquidNFT);
//         setLPTokenContract(erc20Contract);
//         setProvider(browserProvider);
//         setContract(pool);
//       }
//     };
//     loadContract();
//   }, []);

//   const handleMintNFT = async () => {
//     if (!contract || !selectedNFT || !nftTokenId || !liquidNFTContract) return;

//     const approvedAddress = await liquidNFTContract.getApproved(nftTokenId);
//     if (
//       approvedAddress.toLowerCase() !== BORROWING_POOL_ADDRESS.toLowerCase()
//     ) {
//       const tx = await liquidNFTContract.approve(
//         BORROWING_POOL_ADDRESS,
//         nftTokenId
//       );
//       await tx.wait();
//       console.log("NFT approved");
//     } else {
//       console.log("NFT already approved");
//     }

//     await contract.addNFTCollateral(selectedNFT, nftTokenId);
//   };

//   const handleDepositERC20 = async () => {
//     if (!contract || !selectedERC20 || !erc20Amount || !lpTokenContract) return;

//     try {
//       const parsedAmount = ethers.parseUnits(erc20Amount, 18);
//       const approveTx = await lpTokenContract.approve(BORROWING_POOL_ADDRESS, parsedAmount);
//       await approveTx.wait();
//       console.log("ERC20 approved");
//       const tx = await contract.addERC20Collateral(selectedERC20, parsedAmount);
//       await tx.wait();
//       console.log("ERC20 Collateral added");

//     } catch (error) {
//       console.error("Deposit failed:", error);
//     }
//   };

//   const handleBorrow = async () => {
//     if (!contract || !borrowAmount) return;
//     if (collateralType === "nft") {
//       await contract.borrowNFT(
//         collateralIndex,
//         ethers.parseUnits(borrowAmount, 6)
//       );
//     } else {
//       await contract.borrowERC20(
//         collateralIndex,
//         ethers.parseUnits(borrowAmount, 6)
//       );
//     }
//   };

//   const handleRepay = async () => {
//     if (!contract || !borrowAmount || !mockUsdcContract) return;

//     try {
//       const amount = ethers.parseUnits(borrowAmount, 6); // USDC typically has 6 decimals

//       const approveTx = await mockUsdcContract.approve(BORROWING_POOL_ADDRESS, amount);
//       await approveTx.wait();
//       console.log("USDC approved for repayment");

//       // 2. Call repay function based on collateral type
//       if (collateralType === "nft") {
//         const repayTx = await contract.repayNFT(collateralIndex, amount);
//         await repayTx.wait();
//         console.log("Repaid NFT collateral");
//       } else {
//         const repayTx = await contract.repayERC20(collateralIndex, amount);
//         await repayTx.wait();
//         console.log("Repaid ERC20 collateral");
//       }

//     } catch (error) {
//       console.error("Repayment failed:", error);
//     }
//   };

//   const fetchUserPosition = async () => {
//     if (!contract || !address) return;

//     try {
//       const nftCollaterals = await contract.getNFTCollaterals(address);
//       const erc20Collaterals = await contract.getERC20Collaterals(address);
//       const totalBorrowed = await contract.getTotalBorrowed(address);

//       setUserPosition({
//         nftCollaterals,
//         erc20Collaterals,
//         totalBorrowed,
//       });
//     } catch (error) {
//       console.error("Failed to fetch user position:", error);
//     }
//   };

//   return (
//     <div className="p-6 space-y-6 max-w-4xl mx-auto">
//       <h1 className="text-3xl font-bold">Borrowing Pool</h1>
//       <ConnectButton />
//       <Card>
//         <CardContent className="p-4 space-y-4">
//           <h2 className="text-xl font-semibold">Add Collateral</h2>

//           <Select
//             onValueChange={(v) => setCollateralType(v as "nft" | "erc20")}
//           >
//             <SelectTrigger className="w-48">
//               <span>{collateralType.toUpperCase()}</span>
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="nft">NFT</SelectItem>
//               <SelectItem value="erc20">ERC20</SelectItem>
//             </SelectContent>
//           </Select>

//           {collateralType === "nft" ? (
//             <div className="space-y-2">
//               <Input
//                 placeholder="NFT Address"
//                 onChange={(e) => setSelectedNFT(e.target.value)}
//               />
//               <Input
//                 placeholder="Token ID"
//                 onChange={(e) => setNftTokenId(e.target.value)}
//               />
//               <Button onClick={handleMintNFT}>Add NFT Collateral</Button>
//             </div>
//           ) : (
//             <div className="space-y-2">
//               <Input
//                 placeholder="ERC20 Address"
//                 onChange={(e) => setSelectedERC20(e.target.value)}
//               />
//               <Input
//                 placeholder="Amount"
//                 onChange={(e) => setErc20Amount(e.target.value)}
//               />
//               <Button onClick={handleDepositERC20}>Add ERC20 Collateral</Button>
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       <Card>
//         <CardContent className="p-4 space-y-4">
//           <h2 className="text-xl font-semibold">Borrow / Repay</h2>
//           <Input
//             placeholder="Collateral Index"
//             onChange={(e) => setCollateralIndex(Number(e.target.value))}
//           />
//           <Input
//             placeholder="Amount (USDC)"
//             onChange={(e) => setBorrowAmount(e.target.value)}
//           />

//           <div className="flex gap-2">
//             <Button onClick={handleBorrow}>Borrow</Button>
//             <Button variant="outline" onClick={handleRepay}>
//               Repay
//             </Button>
//           </div>
//         </CardContent>
//       </Card>

//       <Card>
//         <CardContent className="p-4 space-y-4">
//           <h2 className="text-xl font-semibold">Your Position</h2>
//           <Button onClick={fetchUserPosition}>Fetch Details</Button>
//           {userPosition && (
//             <div className="space-y-4">
//               <div>
//                 <h3 className="font-semibold">Total Borrowed:</h3>
//                 <p>{ethers.formatUnits(userPosition.totalBorrowed, 6)} USDC</p>
//               </div>

//               <div>
//                 <h3 className="font-semibold">NFT Collaterals:</h3>
//                 {userPosition?.nftCollaterals.map((nft:any, index:number) => (
//                   <div key={index} className="border rounded p-2 mb-2">
//                     <p>
//                       <strong>Token:</strong> {nft.token}
//                     </p>
//                     <p>
//                       <strong>Token ID:</strong> {nft.tokenId.toString()}
//                     </p>
//                     <p>
//                       <strong>Borrowed Amount:</strong>{" "}
//                       {ethers.formatUnits(nft.borrowedAmount, 6)} USDC
//                     </p>
//                     <p>
//                       <strong>Collateral Value:</strong>{" "}
//                       {ethers.formatUnits(nft.collateralValue, 8)} USDC
//                     </p>
//                   </div>
//                 ))}
//               </div>

//               <div>
//                 <h3 className="font-semibold">ERC20 Collaterals:</h3>
//                 {userPosition.erc20Collaterals.map((erc: { token: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; amount: ethers.BigNumberish; borrowedAmount: ethers.BigNumberish; collateralValue: ethers.BigNumberish; }, index: Key | null | undefined) => (
//                   <div key={index} className="border rounded p-2 mb-2">
//                     <p>
//                       <strong>Token:</strong> {erc.token}
//                     </p>
//                     <p>
//                       <strong>Amount:</strong>{" "}
//                       {ethers.formatUnits(erc.amount, 18)}
//                     </p>
//                     <p>
//                       <strong>Borrowed Amount:</strong>{" "}
//                       {ethers.formatUnits(erc.borrowedAmount, 6)} USDC
//                     </p>
//                     <p>
//                       <strong>Collateral Value:</strong>{" "}
//                       {ethers.formatUnits(erc.collateralValue, 8)} USD
//                     </p>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ConnectButton } from "@/components/ConnectWallet";
import { BorrowingABI, NFTABI, ERC20ABI, ORACLEABI } from "@/constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, DollarSign } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Contract } from "ethers";

// const BORROWING_POOL_ADDRESS = "0x77Bae75cc8d10f756CCc244E8C6473BE46Fc7d62";
// const LIQUIDNFTADDRESS = "0xB1BD1a5793b561D4788B11728af02A3Cf1979219";
// const ERC20ADDRESS = "0x59b8592C40edB9E7eD92b10Cc3ec370Af9A6180e";
// const MOCKUSDCADDRESS = "0xb0574922Ae124B374fc699820deeC7a1eD226f3E";

const BORROWING_POOL_ADDRESS = "0xa671d60190E5B2C35A2633d7e1d88c56397C3B11";
const LIQUIDNFTADDRESS = "0xdE17F26f6B14c9a105418a0F92118a502c5600C8";
const ERC20ADDRESS = "0x5485Eea6466Bfb3167C1ACf0209aC4790B88CDB3";
const MOCKUSDCADDRESS = "0x5C846F946016B1862a42824d0ef18C2a5689549c";
const ORACLEPRICEADDRESS = "0x180aa7e86f0c502bC952FfB0e758E9Ab43893cfb";

export default function BorrowPage() {
  const { address } = useAccount();
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [liquidNFTContract, setLiquidNFTContract] =
    useState<ethers.Contract | null>(null);
  const [lpTokenContract, setLPTokenContract] =
    useState<ethers.Contract | null>(null);
  const [mockUsdcContract, setMockUsdcContract] =
    useState<ethers.Contract | null>(null);
  const [oraclePriceContract, setOraclePriceContract] =
    useState<ethers.Contract | null>(null);
  const [selectedNFT, setSelectedNFT] = useState<string>(LIQUIDNFTADDRESS);
  const [selectedERC20, setSelectedERC20] = useState<string>(ERC20ADDRESS);
  const [nftTokenId, setNftTokenId] = useState("");
  const [erc20Amount, setErc20Amount] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [collateralType, setCollateralType] = useState<"nft" | "erc20">("nft");
  const [collateralIndex, setCollateralIndex] = useState(0);
  const [userPosition, setUserPosition] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("deposit");

  useEffect(() => {
    const loadContract = async () => {
      if (typeof window.ethereum !== "undefined") {
        try {
          const browserProvider = new ethers.BrowserProvider(window.ethereum);
          const signer = await browserProvider.getSigner();

          const pool = new ethers.Contract(
            BORROWING_POOL_ADDRESS,
            BorrowingABI,
            signer
          );

          const liquidNFT = new ethers.Contract(
            LIQUIDNFTADDRESS,
            NFTABI,
            signer
          );
          const erc20Contract = new ethers.Contract(
            ERC20ADDRESS,
            ERC20ABI,
            signer
          );
          const _mockUsdcContract = new ethers.Contract(
            MOCKUSDCADDRESS,
            ERC20ABI,
            signer
          );
          const oracleContract = new ethers.Contract(
            ORACLEPRICEADDRESS,
            ORACLEABI,
            signer
          );

          setMockUsdcContract(_mockUsdcContract);
          setLiquidNFTContract(liquidNFT);
          setLPTokenContract(erc20Contract);
          setProvider(browserProvider);
          setContract(pool);
          setOraclePriceContract(oracleContract);

          // Fetch user position on init
          if (address) {
            fetchUserPosition();
          }
        } catch (error) {
          console.error("Failed to load contracts:", error);
        }
      }
    };

    loadContract();
  }, [address]);

  const handleAddNFTCollateral = async () => {
    if (!contract || !selectedNFT || !nftTokenId || !liquidNFTContract) return;

    setLoading(true);
    try {
      const approvedAddress = await liquidNFTContract.getApproved(nftTokenId);

      if (
        approvedAddress.toLowerCase() !== BORROWING_POOL_ADDRESS.toLowerCase()
      ) {
        const tx = await liquidNFTContract.approve(
          BORROWING_POOL_ADDRESS,
          nftTokenId
        );
        await tx.wait();
      }

      const tx = await contract.addNFTCollateral(selectedNFT, nftTokenId);
      await tx.wait();

      toast({
        title: "NFT Collateral Added",
        description: `Successfully added NFT #${nftTokenId} as collateral`,
      });

      fetchUserPosition();
    } catch (error) {
      console.error("Failed to add NFT collateral:", error);
      toast({
        title: "Error Adding Collateral",
        description: "Transaction failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDepositERC20 = async () => {
    if (!contract || !selectedERC20 || !erc20Amount || !lpTokenContract) return;

    setLoading(true);
    try {
      const parsedAmount = ethers.parseUnits(erc20Amount, 18);
      const approveTx = await lpTokenContract.approve(
        BORROWING_POOL_ADDRESS,
        parsedAmount
      );
      await approveTx.wait();

      const tx = await contract.addERC20Collateral(selectedERC20, parsedAmount);
      await tx.wait();

      toast({
        title: "ERC20 Collateral Added",
        description: `Successfully added ${erc20Amount} tokens as collateral`,
      });

      fetchUserPosition();
    } catch (error) {
      console.error("Deposit failed:", error);
      toast({
        title: "Error Adding Collateral",
        description: "Transaction failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveNFTCollateral = async (index: number) => {
    if (!contract) return;

    setLoading(true);
    try {
      const tx = await contract.removeNFTCollateral(index);
      await tx.wait();

      toast({
        title: "NFT Collateral Removed",
        description: "Successfully removed NFT collateral",
      });

      fetchUserPosition();
    } catch (error) {
      console.error("Failed to remove NFT collateral:", error);
      toast({
        title: "Error Removing Collateral",
        description:
          "Transaction failed. Make sure all borrowed amount is repaid.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveERC20Collateral = async (index: number) => {
    if (!contract) return;

    setLoading(true);
    try {
      const tx = await contract.removeERC20Collateral(index);
      await tx.wait();

      toast({
        title: "ERC20 Collateral Removed",
        description: "Successfully removed ERC20 collateral",
      });

      fetchUserPosition();
    } catch (error) {
      console.error("Failed to remove ERC20 collateral:", error);
      toast({
        title: "Error Removing Collateral",
        description:
          "Transaction failed. Make sure all borrowed amount is repaid.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = async () => {
    if (!contract || !borrowAmount) return;

    setLoading(true);
    try {
      if (collateralType === "nft") {
        const tx = await contract.borrowNFT(
          collateralIndex,
          ethers.parseUnits(borrowAmount, 6)
        );
        await tx.wait();
      } else {
        const tx = await contract.borrowERC20(
          collateralIndex,
          ethers.parseUnits(borrowAmount, 6)
        );
        await tx.wait();
      }

      toast({
        title: "Borrowed Successfully",
        description: `Successfully borrowed ${borrowAmount} USDC`,
      });

      fetchUserPosition();
    } catch (error) {
      console.error("Borrow failed:", error);
      toast({
        title: "Error Borrowing",
        description:
          "Transaction failed. Check your collateral and borrow amount.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRepay = async () => {
    if (!contract || !borrowAmount || !mockUsdcContract) return;

    setLoading(true);
    try {
      const amount = ethers.parseUnits(borrowAmount, 6);

      const approveTx = await mockUsdcContract.approve(
        BORROWING_POOL_ADDRESS,
        amount
      );
      await approveTx.wait();

      if (collateralType === "nft") {
        const repayTx = await contract.repayNFT(collateralIndex, amount);
        await repayTx.wait();
      } else {
        const repayTx = await contract.repayERC20(collateralIndex, amount);
        await repayTx.wait();
      }

      toast({
        title: "Repaid Successfully",
        description: `Successfully repaid ${borrowAmount} USDC`,
      });

      fetchUserPosition();
    } catch (error) {
      console.error("Repayment failed:", error);
      toast({
        title: "Error Repaying",
        description: "Transaction failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // const fetchUserPosition = async () => {
  //   if (!contract || !address) return;

  //   try {
  //     const nftCollaterals = await contract.getNFTCollaterals(address);
  //     const erc20Collaterals = await contract.getERC20Collaterals(address);
  //     const totalBorrowed = await contract.getTotalBorrowed(address);

  //     setUserPosition({
  //       nftCollaterals,
  //       erc20Collaterals,
  //       totalBorrowed,
  //     });
  //   } catch (error) {
  //     console.error("Failed to fetch user position:", error);
  //   }
  // };

  const fetchUserPosition = async () => {
    if (!contract || !address || !oraclePriceContract) return;

    try {
      const nftCollateralsRaw = await contract.getNFTCollaterals(address);
      const erc20CollateralsRaw = await contract.getERC20Collaterals(address);
      const totalBorrowed = await contract.getTotalBorrowed(address);

      const liquidationThreshold = await contract.LIQUIDATION_THRESHOLD();
      const usdcDecimals = await contract.USDC_DECIMALS();
      const priceDecimals = await contract.PRICE_DECIMALS();

      const usdcDecimalsBigInt = BigInt(usdcDecimals);
      const priceDecimalsBigInt = BigInt(priceDecimals);

      // Step 1: Normalize raw NFT collaterals
      const nftCollaterals = nftCollateralsRaw.map((col: any) => ({
        token: col[0],
        tokenId: col[1],
        borrowedAmount: col[2],
        collateralValue: col[3],
        isLiquidatable: col[4],
      }));

      const updatedNFTCollaterals = await Promise.all(
        nftCollaterals.map(async (col:any) => {
          const currentPrice = await oraclePriceContract.getPrice(col.token);

          const collateralValue =
            currentPrice > BigInt(0) ? currentPrice : col.collateralValue;

          const liquidationValue =
            (currentPrice *
              BigInt(10) ** usdcDecimalsBigInt *
              liquidationThreshold) /
            (BigInt(100) * BigInt(10) ** priceDecimalsBigInt);

          const isLiquidatable = col.borrowedAmount > liquidationValue;

          return {
            ...col,
            collateralValue,
            isLiquidatable,
          };
        })
      );

      // Step 2: Normalize raw ERC20 collaterals
      const erc20Collaterals = erc20CollateralsRaw.map((col: any) => ({
        token: col[0],
        amount: col[1],
        borrowedAmount: col[2],
        collateralValue: col[3],
        isLiquidatable: col[4],
      }));

      const updatedERC20Collaterals = await Promise.all(
        erc20Collaterals.map(async (col:any) => {
          const currentPrice = await oraclePriceContract.getPrice(col.token);
          let updatedValue = col.collateralValue;

          if (currentPrice > BigInt(0)) {
            const tokenContract = new ethers.Contract(
              col.token,
              ["function decimals() view returns (uint8)"],
              provider
            );
            const decimals = await tokenContract.decimals();
            updatedValue =
              (BigInt(currentPrice) * col.amount) /
              BigInt(10) ** BigInt(decimals);
          }

          const liquidationValue =
            (updatedValue *
              BigInt(10) ** usdcDecimalsBigInt *
              liquidationThreshold) /
            (BigInt(100) * BigInt(10) ** priceDecimalsBigInt);

          const isLiquidatable = col.borrowedAmount > liquidationValue;

          return {
            ...col,
            collateralValue: updatedValue,
            isLiquidatable,
          };
        })
      );

      console.log({
        nftCollaterals: updatedNFTCollaterals,
        erc20Collaterals: updatedERC20Collaterals,
        totalBorrowed,
      });

      setUserPosition({
        nftCollaterals: updatedNFTCollaterals,
        erc20Collaterals: updatedERC20Collaterals,
        totalBorrowed,
      });
    } catch (error) {
      console.error(
        "Failed to fetch user position with real-time values:",
        error
      );
    }
  };

  // Calculate health factor for a position
  const calculateHealthFactor = (
    borrowed: ethers.BigNumberish,
    collateralValue: ethers.BigNumberish
  ) => {
    console.log({ borrowed, collateralValue });

    if (ethers?.toBigInt(borrowed) === BigInt(0)) return 100;

    const borrowedAmount = ethers?.toBigInt(borrowed);
    const collateral = ethers.toBigInt(collateralValue);

   
    const adjustedCollateral =
      (collateral * BigInt(1000000)) / BigInt(100000000);

    const maxBorrow = (adjustedCollateral * BigInt(70)) / BigInt(100);

    if (maxBorrow === BigInt(0)) return 0;

    const usagePercentage = (borrowedAmount * BigInt(100)) / maxBorrow;

    return Number(usagePercentage);
  };

  const getHealthColor = (healthFactor: number) => {
    if (healthFactor >= 95) return "text-red-500";
    if (healthFactor >= 85) return "text-amber-500";
    return "text-green-500";
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Borrowing Pool</h1>
        <ConnectButton />
      </div>

      {!address ? (
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4" />
          <AlertTitle>Connect your wallet</AlertTitle>
          <AlertDescription>
            Connect your wallet to access the borrowing pool features.
          </AlertDescription>
        </Alert>
      ) : (
        <Tabs
          defaultValue="deposit"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="deposit">Deposit Collateral</TabsTrigger>
            <TabsTrigger value="borrow">Borrow & Repay</TabsTrigger>
            <TabsTrigger value="position">Your Position</TabsTrigger>
          </TabsList>

          <TabsContent value="deposit">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Add Collateral</CardTitle>
                <CardDescription>
                  Deposit NFTs or ERC20 tokens as collateral to borrow against
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 items-center">
                  <Select
                    defaultValue={collateralType}
                    onValueChange={(v) =>
                      setCollateralType(v as "nft" | "erc20")
                    }
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nft">NFT</SelectItem>
                      <SelectItem value="erc20">ERC20 Token</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {collateralType === "nft" ? (
                  <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="text-lg font-medium">NFT Collateral</h3>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        NFT Contract Address
                      </label>
                      <Input
                        placeholder="NFT Address"
                        value={selectedNFT}
                        onChange={(e) => setSelectedNFT(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Token ID</label>
                      <Input
                        placeholder="Token ID"
                        onChange={(e) => setNftTokenId(e.target.value)}
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleAddNFTCollateral}
                      disabled={loading}
                    >
                      {loading ? "Processing..." : "Add NFT Collateral"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="text-lg font-medium">ERC20 Collateral</h3>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        ERC20 Token Address
                      </label>
                      <Input
                        placeholder="ERC20 Address"
                        value={selectedERC20}
                        onChange={(e) => setSelectedERC20(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Amount</label>
                      <Input
                        placeholder="Amount"
                        onChange={(e) => setErc20Amount(e.target.value)}
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleDepositERC20}
                      disabled={loading}
                    >
                      {loading ? "Processing..." : "Add ERC20 Collateral"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="borrow">
            <Card>
              <CardHeader>
                <CardTitle>Borrow & Repay</CardTitle>
                <CardDescription>
                  Borrow USDC against your collateral or repay your loan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Action Type</label>
                  <Select
                    defaultValue={collateralType}
                    onValueChange={(v) =>
                      setCollateralType(v as "nft" | "erc20")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select collateral type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nft">NFT Collateral</SelectItem>
                      <SelectItem value="erc20">ERC20 Collateral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Collateral Index
                  </label>
                  <Input
                    type="number"
                    placeholder="Collateral Index"
                    min="0"
                    onChange={(e) => setCollateralIndex(Number(e.target.value))}
                  />
                  <p className="text-xs text-gray-500">
                    The index of your collateral. Check &quot;Your
                    Position&quot; tab to find the index.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount (USDC)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      className="pl-10"
                      placeholder="Amount"
                      onChange={(e) => setBorrowAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    className="flex-1"
                    onClick={handleBorrow}
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "Borrow"}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleRepay}
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "Repay"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="position">
            <Card>
              <CardHeader>
                <div className="flex justify-between">
                  <div>
                    <CardTitle>Your Position</CardTitle>
                    <CardDescription>
                      Overview of your collaterals and loans
                    </CardDescription>
                  </div>
                  <Button onClick={fetchUserPosition}>Refresh</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {userPosition ? (
                  <>
                    {/* Total Borrowed */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">
                          Total Borrowed
                        </h3>
                        <span className="text-xl font-bold">
                          {ethers.formatUnits(userPosition.totalBorrowed, 6)}{" "}
                          USDC
                        </span>
                      </div>
                    </div>

                    {/* NFT Collaterals */}
                    {userPosition.nftCollaterals.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">
                          NFT Collaterals
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {userPosition.nftCollaterals.map(
                            (nft: any, index: number) => {
                              const {
                                token,
                                tokenId,
                                borrowedAmount,
                                collateralValue,
                                isLiquidatable,
                              } = nft;
                              const healthFactor = calculateHealthFactor(
                                borrowedAmount,
                                collateralValue
                              );
                              const healthColor = getHealthColor(healthFactor);

                              return (
                                <Card key={index} className="overflow-hidden">
                                  <div className="p-4">
                                    <div className="flex justify-between items-center mb-2">
                                      <h4 className="font-semibold">
                                        NFT #{tokenId.toString()}
                                      </h4>
                                      {isLiquidatable && (
                                        <Badge variant="destructive">
                                          Liquidatable
                                        </Badge>
                                      )}
                                    </div>

                                    <div className="space-y-2 text-sm">
                                      <p>
                                        Token Address: {token.slice(0, 6)}...
                                        {token.slice(-4)}
                                      </p>
                                      <div className="flex justify-between">
                                        <span>Borrowed Amount:</span>
                                        <span>
                                          {ethers.formatUnits(
                                            borrowedAmount,
                                            6
                                          )}{" "}
                                          USDC
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Collateral Value:</span>
                                        <span>
                                          {ethers.formatUnits(
                                            collateralValue,
                                            8
                                          )}{" "}
                                          USDC
                                        </span>
                                      </div>

                                      <div className="mt-2">
                                        <div className="flex justify-between mb-1">
                                          <span>Health:</span>
                                          <span className={healthColor}>
                                            {healthFactor}%
                                          </span>
                                        </div>
                                        <Progress
                                          value={healthFactor}
                                          className="h-2"
                                        />
                                      </div>
                                    </div>

                                    <div className="mt-4">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={() =>
                                          handleRemoveNFTCollateral(index)
                                        }
                                        disabled={
                                          Number(borrowedAmount) > 0 ||
                                          isLiquidatable
                                        }
                                      >
                                        {Number(borrowedAmount) > 0
                                          ? "Repay First"
                                          : "Remove Collateral"}
                                      </Button>
                                    </div>
                                  </div>
                                </Card>
                              );
                            }
                          )}
                        </div>
                      </div>
                    )}

                    {/* ERC20 Collaterals */}
                    {userPosition.erc20Collaterals.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">
                          ERC20 Collaterals
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {userPosition.erc20Collaterals.map(
                            (erc: any, index: number) => {
                              const {
                                token,
                                amount,
                                borrowedAmount,
                                collateralValue,
                                isLiquidatable,
                              } = erc;
                              const healthFactor = calculateHealthFactor(
                                borrowedAmount,
                                collateralValue
                              );
                              const healthColor = getHealthColor(healthFactor);

                              return (
                                <Card key={index} className="overflow-hidden">
                                  <div className="p-4">
                                    <div className="flex justify-between items-center mb-2">
                                      <h4 className="font-semibold">
                                        ERC20 Token
                                      </h4>
                                      {isLiquidatable && (
                                        <Badge variant="destructive">
                                          Liquidatable
                                        </Badge>
                                      )}
                                    </div>

                                    <div className="space-y-2 text-sm">
                                      <p>
                                        Token Address: {token.slice(0, 6)}...
                                        {token.slice(-4)}
                                      </p>
                                      <div className="flex justify-between">
                                        <span>Amount:</span>
                                        <span>
                                          {ethers.formatUnits(amount, 18)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Borrowed Amount:</span>
                                        <span>
                                          {ethers.formatUnits(
                                            borrowedAmount,
                                            6
                                          )}{" "}
                                          USDC
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Collateral Value:</span>
                                        <span>
                                          {ethers.formatUnits(
                                            collateralValue,
                                            8
                                          )}{" "}
                                          USDC
                                        </span>
                                      </div>

                                      <div className="mt-2">
                                        <div className="flex justify-between mb-1">
                                          <span>Health:</span>
                                          <span className={healthColor}>
                                            {healthFactor}%
                                          </span>
                                        </div>
                                        <Progress
                                          value={healthFactor}
                                          className="h-2"
                                        />
                                      </div>
                                    </div>

                                    <div className="mt-4">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={() =>
                                          handleRemoveERC20Collateral(index)
                                        }
                                        disabled={
                                          Number(borrowedAmount) > 0 ||
                                          isLiquidatable
                                        }
                                      >
                                        {Number(borrowedAmount) > 0
                                          ? "Repay First"
                                          : "Remove Collateral"}
                                      </Button>
                                    </div>
                                  </div>
                                </Card>
                              );
                            }
                          )}
                        </div>
                      </div>
                    )}

                    {/* No Collateral Message */}
                    {userPosition.nftCollaterals.length === 0 &&
                      userPosition.erc20Collaterals.length === 0 && (
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertTitle>No collateral</AlertTitle>
                          <AlertDescription>
                            You don&apos;t have any collateral deposited. Go to
                            the &quot;Deposit Collateral&quot; tab to add some.
                          </AlertDescription>
                        </Alert>
                      )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      Loading your position data...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
