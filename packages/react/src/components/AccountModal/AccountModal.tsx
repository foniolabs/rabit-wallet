import React from 'react';
import { useWallet } from '../../hooks/useWallet';
import { useBalance } from '../../hooks/useBalance';
import { useSmartAccount } from '../../hooks/useSmartAccount';
import { formatAddress, formatBalance, copyToClipboard } from '../../utils';
import clsx from 'clsx';

interface AccountModalProps {
  open: boolean;
  onClose: () => void;
  className?: string;
}

export function AccountModal({ open, onClose, className }: AccountModalProps) {
  const { address, disconnect } = useWallet();
  const { data: balance } = useBalance({ 
    address: address || undefined // Fix: convert null to undefined
  });
  const { address: smartAccountAddress, isDeployed } = useSmartAccount();

  const handleCopyAddress = async () => {
    if (address) {
      const success = await copyToClipboard(address);
      if (success) {
        console.log('Address copied!');
      }
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    onClose();
  };

  if (!open || !address) return null;

  return (
    <div className="rabit-modal-overlay" onClick={onClose}>
      <div
        className={clsx('rabit-account-modal', className)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rabit-account-modal__header">
          <h3>Account</h3>
          <button onClick={onClose} className="rabit-close-button">
            ✕
          </button>
        </div>
        
        <div className="rabit-account-modal__content">
          {/* Account Info */}
          <div className="rabit-account-info">
            <div className="rabit-account-avatar">
              <div className="rabit-avatar-gradient" />
            </div>
            
            <div className="rabit-account-details">
              <div className="rabit-account-address">
                {formatAddress(address)}
              </div>
              <div className="rabit-account-actions">
                <button
                  onClick={handleCopyAddress}
                  className="rabit-action-button"
                  title="Copy address"
                >
                  📋
                </button>
                <button
                  onClick={() => window.open(`https://etherscan.io/address/${address}`, '_blank')}
                  className="rabit-action-button"
                  title="View on explorer"
                >
                  🔗
                </button>
              </div>
            </div>
          </div>

          {/* Balance */}
          {balance && (
            <div className="rabit-balance-section">
              <div className="rabit-balance-amount">
                {formatBalance(balance.formatted, balance.symbol)}
              </div>
              <div className="rabit-balance-label">Balance</div>
            </div>
          )}

          {/* Smart Account Info */}
          {smartAccountAddress && (
            <div className="rabit-smart-account">
              <div className="rabit-smart-account-header">
                <h4>Smart Account</h4>
                <span className={clsx('rabit-status', {
                  'rabit-status--deployed': isDeployed,
                  'rabit-status--undeployed': !isDeployed
                })}>
                  {isDeployed ? 'Deployed' : 'Not Deployed'}
                </span>
              </div>
              <div className="rabit-smart-account-address">
                {formatAddress(smartAccountAddress)}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="rabit-account-actions">
            <button
              onClick={handleDisconnect}
              className="rabit-disconnect-button"
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
