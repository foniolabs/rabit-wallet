import React from 'react';

interface SocialAuthProps {
  className?: string;
}

export function SocialAuth({ className }: SocialAuthProps) {
  return (
    <div className={`rabit-socialauth ${className || ''}`}>
      <p>SocialAuth component - Coming soon!</p>
    </div>
  );
}
