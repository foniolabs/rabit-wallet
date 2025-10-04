import React from 'react';

interface WalletButtonProps {
  className?: string;
}

export function WalletButton({ className }: WalletButtonProps) {
  return (
    <div className={`rabit-walletbutton ${className || ''}`}>
      <p>WalletButton component - Coming soon!</p>
    </div>
  );
}
