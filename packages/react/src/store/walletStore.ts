import { WalletState } from '../types';
import { getStorageItem } from '../utils/storage';

type WalletAction =
  | { type: 'SET_CONNECTING'; payload: boolean }
  | { type: 'SET_ACCOUNT'; payload: { address: string | null; isConnected: boolean; chainId: number | null } }
  | { type: 'SET_ERROR'; payload: Error }
  | { type: 'SET_RECENT_CONNECTOR'; payload: string }
  | { type: 'RESET_STATE' };

export const initialWalletState: WalletState = {
  address: null,
  isConnected: false,
  isConnecting: false,
  chainId: null,
  error: null,
  recentConnector: getStorageItem('rabit.recentConnector'),
};

export function walletReducer(state: WalletState, action: WalletAction): WalletState {
  switch (action.type) {
    case 'SET_CONNECTING':
      return { ...state, isConnecting: action.payload, error: null };
    
    case 'SET_ACCOUNT':
      return {
        ...state,
        address: action.payload.address,
        isConnected: action.payload.isConnected,
        chainId: action.payload.chainId,
        error: null,
      };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isConnecting: false };
    
    case 'SET_RECENT_CONNECTOR':
      return { ...state, recentConnector: action.payload };
    
    case 'RESET_STATE':
      return {
        ...initialWalletState,
        recentConnector: null,
      };
    
    default:
      return state;
  }
}
