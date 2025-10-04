import React from 'react';

interface TransactionModalProps {
  className?: string;
}

export function TransactionModal({ className }: TransactionModalProps) {
  return (
    <div className={`rabit-transactionmodal ${className || ''}`}>
      <p>TransactionModal component - Coming soon!</p>
    </div>
  );
}
