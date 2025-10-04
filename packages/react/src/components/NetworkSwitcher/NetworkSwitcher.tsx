import React from 'react';

interface NetworkSwitcherProps {
  className?: string;
}

export function NetworkSwitcher({ className }: NetworkSwitcherProps) {
  return (
    <div className={`rabit-networkswitcher ${className || ''}`}>
      <p>NetworkSwitcher component - Coming soon!</p>
    </div>
  );
}
