import { Config } from 'wagmi';
import { Theme } from './theme';
import { WalletConfig } from './wallet';
import { SmartAccountConfig } from './smartAccount';
import { AuthConfig } from './auth';

export interface RabitConfig {
  wagmi: Config;
  theme?: Theme;
  wallet?: WalletConfig;
  smartAccount?: SmartAccountConfig;
  auth?: AuthConfig;
}
