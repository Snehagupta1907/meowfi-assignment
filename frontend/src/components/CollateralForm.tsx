// components/CollateralForm.tsx
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CollateralFormProps {
  type: 'nft' | 'erc20';
  onSubmit: (data: { address: string; tokenId?: string; amount?: string }) => void;
}

export default function CollateralForm({ type, onSubmit }: CollateralFormProps) {
  const [address, setAddress] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = () => {
    if (type === 'nft') {
      onSubmit({ address, tokenId });
    } else {
      onSubmit({ address, amount });
    }
  };

  return (
    <div className="space-y-2">
      <Input placeholder={`${type.toUpperCase()} Address`} onChange={(e) => setAddress(e.target.value)} />
      {type === 'nft' ? (
        <Input placeholder="Token ID" onChange={(e) => setTokenId(e.target.value)} />
      ) : (
        <Input placeholder="Amount" onChange={(e) => setAmount(e.target.value)} />
      )}
      <Button onClick={handleSubmit}>Add {type.toUpperCase()} Collateral</Button>
    </div>
  );
}
