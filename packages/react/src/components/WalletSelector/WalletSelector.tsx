import React from 'react';
import clsx from 'clsx';
import { ConnectorInfo } from '../../types';

interface WalletSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (connectorId: string) => void;
  connectors: ConnectorInfo[];
  className?: string;
}

export function WalletSelector({
  open,
  onClose,
  onSelect,
  connectors,
  className,
}: WalletSelectorProps) {
  if (!open) return null;

  return (
    <div className="rabit-modal-overlay" onClick={onClose}>
      <div
        className={clsx('rabit-wallet-selector', className)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rabit-wallet-selector__header">
          <h3>Connect a Wallet</h3>
          <button onClick={onClose} className="rabit-close-button">
            ✕
          </button>
        </div>
        
        <div className="rabit-wallet-selector__content">
          <div className="rabit-wallet-selector__options">
            {connectors.map((connector) => (
              <button
                key={connector.id}
                onClick={() => onSelect(connector.id)}
                disabled={!connector.ready}
                className={clsx(
                  'rabit-wallet-option',
                  {
                    'rabit-wallet-option--disabled': !connector.ready,
                    'rabit-wallet-option--popular': connector.popular,
                  }
                )}
              >
                <div className="rabit-wallet-option__icon">
                  {connector.icon ? (
                    <img src={connector.icon} alt={connector.name} />
                  ) : (
                    <div className="rabit-wallet-option__placeholder" />
                  )}
                </div>
                <div className="rabit-wallet-option__content">
                  <span className="rabit-wallet-option__name">
                    {connector.name}
                  </span>
                  {!connector.ready && (
                    <span className="rabit-wallet-option__status">
                      Not Detected
                    </span>
                  )}
                  {connector.popular && (
                    <span className="rabit-wallet-option__badge">
                      Popular
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
          
          <div className="rabit-wallet-selector__footer">
            <p className="rabit-wallet-selector__help">
              New to Ethereum wallets?{' '}
              <a
                href="https://ethereum.org/wallets/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn more
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
