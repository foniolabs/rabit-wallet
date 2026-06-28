/**
 * Shamir Secret Sharing (2-of-3)
 *
 * Splits a secret (byte array) into 3 shares where any 2 can reconstruct it.
 * Each byte of the secret is independently split using GF(256) arithmetic.
 */

import { gf256EvalPolynomial, gf256Interpolate } from './gf256.js';
import { getSecureRandom } from '../utils/random.js';

export interface ShamirShare {
  /** Share index (1, 2, or 3) — never 0 */
  index: number;
  /** Share data */
  data: Uint8Array;
}

/**
 * Split a secret into `totalShares` shares with a reconstruction threshold.
 *
 * @param secret - The secret bytes to split
 * @param threshold - Minimum shares needed to reconstruct (default: 2)
 * @param totalShares - Total number of shares to generate (default: 3)
 * @returns Array of shares
 */
export function splitSecret(
  secret: Uint8Array,
  threshold: number = 2,
  totalShares: number = 3
): ShamirShare[] {
  if (threshold < 2) throw new Error('Threshold must be at least 2');
  if (totalShares < threshold) throw new Error('Total shares must be >= threshold');
  if (totalShares > 255) throw new Error('Maximum 255 shares supported');
  if (secret.length === 0) throw new Error('Secret cannot be empty');

  const shares: ShamirShare[] = [];

  // Initialize share data arrays
  for (let i = 0; i < totalShares; i++) {
    shares.push({
      index: i + 1, // Indices 1, 2, 3 (never 0, since that's the secret)
      data: new Uint8Array(secret.length),
    });
  }

  // For each byte of the secret, create a random polynomial and evaluate
  for (let byteIdx = 0; byteIdx < secret.length; byteIdx++) {
    // Polynomial coefficients: coefficients[0] = secret byte, rest are random
    const coefficients = new Uint8Array(threshold);
    coefficients[0] = secret[byteIdx];

    // Generate random coefficients for degree 1...(threshold-1)
    const randomBytes = getSecureRandom(threshold - 1);
    for (let i = 1; i < threshold; i++) {
      coefficients[i] = randomBytes[i - 1];
    }

    // Evaluate polynomial at each share's x-coordinate
    for (let shareIdx = 0; shareIdx < totalShares; shareIdx++) {
      const x = shares[shareIdx].index;
      shares[shareIdx].data[byteIdx] = gf256EvalPolynomial(coefficients, x);
    }
  }

  return shares;
}

/**
 * Reconstruct a secret from shares.
 * Requires at least `threshold` shares (default: 2).
 *
 * @param shares - Array of shares (must have at least `threshold` shares)
 * @returns The reconstructed secret bytes
 */
export function combineShares(shares: ShamirShare[]): Uint8Array {
  if (shares.length < 2) {
    throw new Error('Need at least 2 shares to reconstruct');
  }

  // Validate all shares have same length
  const dataLength = shares[0].data.length;
  for (const share of shares) {
    if (share.data.length !== dataLength) {
      throw new Error('All shares must have the same data length');
    }
  }

  // Check for duplicate indices
  const indices = new Set(shares.map(s => s.index));
  if (indices.size !== shares.length) {
    throw new Error('Duplicate share indices detected');
  }

  const secret = new Uint8Array(dataLength);
  const xs = new Uint8Array(shares.map(s => s.index));

  // For each byte position, interpolate to find the secret byte
  for (let byteIdx = 0; byteIdx < dataLength; byteIdx++) {
    const ys = new Uint8Array(shares.map(s => s.data[byteIdx]));
    secret[byteIdx] = gf256Interpolate(xs, ys);
  }

  return secret;
}
