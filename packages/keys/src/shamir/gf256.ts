/**
 * Galois Field GF(256) arithmetic for Shamir Secret Sharing
 *
 * Uses the irreducible polynomial x^8 + x^4 + x^3 + x + 1 (0x11B)
 * This is the same field used in AES.
 *
 * Addition in GF(256) = XOR
 * Multiplication uses log/exp lookup tables for speed
 */

// Precomputed log and exp tables for GF(256) with generator 3
const EXP_TABLE = new Uint8Array(512);
const LOG_TABLE = new Uint8Array(256);

// Initialize tables
(function initTables() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    LOG_TABLE[x] = i;
    // Multiply by generator (3) in GF(256)
    x = x ^ (x << 1);
    if (x & 0x100) {
      x ^= 0x11b; // reduce by irreducible polynomial
    }
  }
  // Fill the rest of exp table for easy modular access
  for (let i = 255; i < 512; i++) {
    EXP_TABLE[i] = EXP_TABLE[i - 255];
  }
})();

/**
 * Add two elements in GF(256) — XOR
 */
export function gf256Add(a: number, b: number): number {
  return a ^ b;
}

/**
 * Subtract two elements in GF(256) — same as add (XOR)
 */
export function gf256Sub(a: number, b: number): number {
  return a ^ b;
}

/**
 * Multiply two elements in GF(256)
 */
export function gf256Mul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP_TABLE[LOG_TABLE[a] + LOG_TABLE[b]];
}

/**
 * Compute multiplicative inverse in GF(256)
 */
export function gf256Inv(a: number): number {
  if (a === 0) throw new Error('Cannot invert zero in GF(256)');
  return EXP_TABLE[255 - LOG_TABLE[a]];
}

/**
 * Divide two elements in GF(256)
 */
export function gf256Div(a: number, b: number): number {
  if (b === 0) throw new Error('Division by zero in GF(256)');
  if (a === 0) return 0;
  return EXP_TABLE[(LOG_TABLE[a] + 255 - LOG_TABLE[b]) % 255];
}

/**
 * Evaluate a polynomial at a given point in GF(256)
 * coefficients[0] is the constant term (the secret)
 */
export function gf256EvalPolynomial(coefficients: Uint8Array, x: number): number {
  if (x === 0) throw new Error('Cannot evaluate at x=0');

  let result = 0;
  // Horner's method for efficient evaluation
  for (let i = coefficients.length - 1; i >= 0; i--) {
    result = gf256Add(gf256Mul(result, x), coefficients[i]);
  }
  return result;
}

/**
 * Lagrange interpolation at x=0 to recover the secret
 * Given points (x_i, y_i), recovers f(0) which is the secret
 */
export function gf256Interpolate(
  xs: Uint8Array,
  ys: Uint8Array
): number {
  const k = xs.length;
  if (k !== ys.length) throw new Error('xs and ys must have same length');

  let secret = 0;

  for (let i = 0; i < k; i++) {
    let numerator = 1;
    let denominator = 1;

    for (let j = 0; j < k; j++) {
      if (i === j) continue;
      // Evaluating at x=0, so (0 - x_j) = x_j in GF(256) since -x = x
      numerator = gf256Mul(numerator, xs[j]);
      denominator = gf256Mul(denominator, gf256Sub(xs[i], xs[j]));
    }

    // Lagrange basis polynomial L_i(0) = numerator / denominator
    const lagrange = gf256Div(numerator, denominator);
    secret = gf256Add(secret, gf256Mul(ys[i], lagrange));
  }

  return secret;
}
