export function isValidAddress(address: string): boolean {
  if (!address) return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function isValidTxHash(hash: string): boolean {
  if (!hash) return false;
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

export function isValidChainId(chainId: number): boolean {
  return chainId > 0 && Number.isInteger(chainId);
}

export function isValidUrl(url: string): boolean {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidNumber(value: string | number): boolean {
  if (typeof value === 'number') {
    return !isNaN(value) && isFinite(value);
  }
  
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return !isNaN(num) && isFinite(num);
  }
  
  return false;
}

export function isPositiveNumber(value: string | number): boolean {
  if (!isValidNumber(value)) return false;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return num > 0;
}
