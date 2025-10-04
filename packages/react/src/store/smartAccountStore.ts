import { SmartAccountState } from '../types';

type SmartAccountAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ACCOUNT'; payload: { address: string; isDeployed: boolean } }
  | { type: 'SET_ERROR'; payload: Error }
  | { type: 'RESET_STATE' };

export const initialSmartAccountState: SmartAccountState = {
  address: null,
  isDeployed: false,
  isLoading: false,
  error: null,
};

export function smartAccountReducer(
  state: SmartAccountState,
  action: SmartAccountAction
): SmartAccountState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload, error: null };
    
    case 'SET_ACCOUNT':
      return {
        ...state,
        address: action.payload.address,
        isDeployed: action.payload.isDeployed,
        isLoading: false,
        error: null,
      };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'RESET_STATE':
      return initialSmartAccountState;
    
    default:
      return state;
  }
}
