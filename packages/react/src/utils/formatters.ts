import { formatUnits } from 'viem';

export function formatAddress(address: string, chars = 4): string {
  if (!address) return '';
  if (address.length < chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatBalance(
  value: string | number | bigint,
  symbol?: string,
  decimals = 4
): string {
  if (!value) return '0';
  
  let num: number;
  
  if (typeof value === 'bigint') {
    num = parseFloat(formatUnits(value, 18));
  } else if (typeof value === 'string') {
    num = parseFloat(value);
  } else {
    num = value;
  }
  
  if (isNaN(num)) return '0';
  
  if (num >= 1e9) {
    return `${(num / 1e9).toFixed(2)}B${symbol ? ` ${symbol}` : ''}`;
  } else if (num >= 1e6) {
    return `${(num / 1e6).toFixed(2)}M${symbol ? ` ${symbol}` : ''}`;
  } else if (num >= 1e3) {
    return `${(num / 1e3).toFixed(2)}K${symbol ? ` ${symbol}` : ''}`;
  }
  
  const formatted = num.toFixed(decimals).replace(/\.?0+$/, '');
  return symbol ? `${formatted} ${symbol}` : formatted;
}

export function formatCurrency(
  value: number | string,
  currency = 'USD',
  locale = 'en-US'
): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '$0.00';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(num);
}

export function formatTimeAgo(timestamp: number | Date): string {
  const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}
