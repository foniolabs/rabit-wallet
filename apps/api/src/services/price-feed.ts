/**
 * PriceFeed — fetches live exchange rates from CoinGecko
 *
 * Supports: ETH, BTC, SOL, USDC, USDT
 * Caches rates for 60 seconds to avoid hitting rate limits
 */

// CoinGecko IDs for supported assets
const COINGECKO_IDS: Record<string, string> = {
  ETH: 'ethereum',
  BTC: 'bitcoin',
  SOL: 'solana',
  USDC: 'usd-coin',
  USDT: 'tether',
  MATIC: 'matic-network',
};

// Supported fiat currencies
const SUPPORTED_FIATS = [
  'usd', 'ngn', 'eur', 'gbp', 'ghs', 'kes',
  'zar', 'egp', 'inr', 'brl', 'xof', 'xaf',
];

interface CachedRates {
  rates: Record<string, Record<string, number>>;
  fetchedAt: number;
}

const CACHE_TTL_MS = 60_000; // 1 minute
let cache: CachedRates | null = null;

/**
 * Fetch live rates from CoinGecko (free API, no key required)
 * Returns: { ETH: { usd: 3200, ngn: 5100000, ... }, BTC: { ... }, ... }
 */
export async function fetchRates(): Promise<Record<string, Record<string, number>>> {
  // Return cached if fresh
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.rates;
  }

  const ids = Object.values(COINGECKO_IDS).join(',');
  const currencies = SUPPORTED_FIATS.join(',');

  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${currencies}`;

  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();

    // Map CoinGecko IDs back to symbols
    const rates: Record<string, Record<string, number>> = {};

    for (const [symbol, geckoId] of Object.entries(COINGECKO_IDS)) {
      const symbolRates = data[geckoId];
      if (symbolRates) {
        rates[symbol] = {};
        for (const fiat of SUPPORTED_FIATS) {
          if (symbolRates[fiat] !== undefined) {
            rates[symbol][fiat.toUpperCase()] = symbolRates[fiat];
          }
        }
      }
    }

    cache = { rates, fetchedAt: Date.now() };
    return rates;
  } catch (error) {
    // If fetch fails and we have stale cache, return it
    if (cache) {
      return cache.rates;
    }

    // Last resort: return hardcoded fallback so the API doesn't completely break
    return getFallbackRates();
  }
}

/**
 * Get the rate for a specific crypto/fiat pair
 */
export async function getRate(crypto: string, fiat: string): Promise<number | null> {
  const rates = await fetchRates();
  const symbol = crypto.toUpperCase();
  const currency = fiat.toUpperCase();

  return rates[symbol]?.[currency] ?? null;
}

/**
 * Get all supported crypto assets
 */
export function getSupportedCryptoSymbols(): string[] {
  return Object.keys(COINGECKO_IDS);
}

/**
 * Fallback rates if CoinGecko is unreachable
 */
function getFallbackRates(): Record<string, Record<string, number>> {
  return {
    ETH: { USD: 3200, NGN: 5120000, EUR: 2950, GBP: 2550, GHS: 48000, KES: 412000 },
    BTC: { USD: 67000, NGN: 107200000, EUR: 61500, GBP: 53000, GHS: 1005000, KES: 8600000 },
    SOL: { USD: 150, NGN: 240000, EUR: 138, GBP: 119, GHS: 2250, KES: 19300 },
    USDC: { USD: 1, NGN: 1600, EUR: 0.92, GBP: 0.79, GHS: 15, KES: 129 },
    USDT: { USD: 1, NGN: 1600, EUR: 0.92, GBP: 0.79, GHS: 15, KES: 129 },
    MATIC: { USD: 0.7, NGN: 1120, EUR: 0.64, GBP: 0.55, GHS: 10.5, KES: 90 },
  };
}
