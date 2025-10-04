import React, { useState } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { useConnect } from '../../hooks/useConnect';
import { WalletSelector } from '../WalletSelector';
import { AccountModal } from '../AccountModal';
import clsx from 'clsx';
import { formatAddress } from '../../utils/formatters';

interface ConnectButtonProps {
  className?: string;
  label?: string;
  showBalance?: boolean;
  accountModalOpen?: boolean;
  onAccountModalChange?: (open: boolean) => void;
}

export function ConnectButton({
  className,
  label = 'Connect Wallet',
  showBalance = true,
  accountModalOpen,
  onAccountModalChange,
}: ConnectButtonProps) {
  const { address, isConnected, isConnecting } = useWallet();
  const { connect, connectors, isLoading } = useConnect();
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  const handleClick = () => {
    if (isConnected) {
      const modalOpen = accountModalOpen ?? isAccountModalOpen;
      const setModalOpen = onAccountModalChange ?? setIsAccountModalOpen;
      setModalOpen(!modalOpen);
    } else {
      setShowWalletSelector(true);
    }
  };

  const handleConnect = async (connectorId: string) => {
    try {
      await connect(connectorId);
      setShowWalletSelector(false);
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  if (isConnected && address) {
    return (
      <>
        <button
          onClick={handleClick}
          className={clsx(
            'rabit-connect-button rabit-connect-button--connected',
            className
          )}
        >
          <div className="rabit-connect-button__content">
            <div className="rabit-connect-button__avatar">
              <div className="rabit-avatar-gradient" />
            </div>
            <div className="rabit-connect-button__info">
              <div className="rabit-connect-button__address">
                {formatAddress(address)}
              </div>
              {showBalance && (
                <div className="rabit-connect-button__balance">
                  {/* Balance will be shown here */}
                </div>
              )}
            </div>
          </div>
        </button>
        
        <AccountModal
          open={accountModalOpen ?? isAccountModalOpen}
          onClose={() => {
            const setModalOpen = onAccountModalChange ?? setIsAccountModalOpen;
            setModalOpen(false);
          }}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isConnecting || isLoading}
        className={clsx(
          'rabit-connect-button',
          {
            'rabit-connect-button--loading': isConnecting || isLoading,
          },
          className
        )}
      >
        {isConnecting || isLoading ? 'Connecting...' : label}
      </button>

      <WalletSelector
        open={showWalletSelector}
        onClose={() => setShowWalletSelector(false)}
        onSelect={handleConnect}
        connectors={connectors}
      />
    </>
  );
}
