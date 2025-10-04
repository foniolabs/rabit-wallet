export interface SmartAccountConfig {
  autoCreate?: boolean;
  bundlerUrl?: string;
  paymasterUrl?: string;
  factory?: string;
  implementation?: string;
  sponsorGas?: boolean;
}

export interface SmartAccountState {
  address: string | null;
  isDeployed: boolean;
  isLoading: boolean;
  error: Error | null;
}
