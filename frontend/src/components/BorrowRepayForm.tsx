// components/BorrowRepayForm.tsx
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface BorrowRepayFormProps {
  onBorrow: (index: number, amount: string) => void;
  onRepay: (index: number, amount: string) => void;
}

export default function BorrowRepayForm({ onBorrow, onRepay }: BorrowRepayFormProps) {
  const [index, setIndex] = useState(0);
  const [amount, setAmount] = useState('');

  return (
    <div className="space-y-2">
      <Input placeholder="Collateral Index" onChange={(e) => setIndex(Number(e.target.value))} />
      <Input placeholder="Amount (USDC)" onChange={(e) => setAmount(e.target.value)} />
      <div className="flex gap-2">
        <Button onClick={() => onBorrow(index, amount)}>Borrow</Button>
        <Button variant="outline" onClick={() => onRepay(index, amount)}>Repay</Button>
      </div>
    </div>
  );
}
