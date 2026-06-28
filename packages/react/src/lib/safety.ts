/**
 * Safety heuristics shared by approval + send flows.
 *
 * Returns plain-English warning strings to feed into <TransactionPreview />.
 * Keep these conservative — false positives are fine, false negatives erode
 * trust.
 */

const MAX_UINT256 =
  115792089237316195423570985008687907853269984665640564039457584007913129639935n;

const NEAR_MAX_UINT256_THRESHOLD =
  // Anything above 2^200 in a uint256 approval is effectively unlimited.
  // This catches MaxUint256 and the "unlimited approval" heuristic libraries
  // sometimes encode as a slightly-smaller value.
  1n << 200n;

export interface SafetyContext {
  /** "approve" | "transfer" | "send" | etc. */
  kind: 'approve' | 'send_token' | 'send_native' | 'contract_call' | 'sign_message';
  /** For approvals: the encoded approval amount. */
  approvalAmount?: bigint;
  /** For sends: the amount being sent (raw, smallest unit). */
  sendAmount?: bigint;
  /** User's current balance of the asset, smallest unit. */
  currentBalance?: bigint;
  /** For raw message signing: the message text — flagged when it looks like a tx. */
  messageText?: string;
}

export function evaluateSafety(ctx: SafetyContext): string[] {
  const warnings: string[] = [];

  if (ctx.kind === 'approve' && ctx.approvalAmount != null) {
    if (ctx.approvalAmount >= NEAR_MAX_UINT256_THRESHOLD) {
      warnings.push(
        ctx.approvalAmount === MAX_UINT256
          ? 'This is an UNLIMITED approval — the spender can drain your entire balance, now and forever. Only do this if you fully trust the contract.'
          : 'This is effectively an unlimited approval. The spender can withdraw nearly any amount of this token whenever they want.'
      );
    }
  }

  if ((ctx.kind === 'send_token' || ctx.kind === 'send_native') && ctx.sendAmount != null && ctx.currentBalance != null && ctx.currentBalance > 0n) {
    // Send > 50% of balance → caution.
    const halfBalance = ctx.currentBalance / 2n;
    if (ctx.sendAmount > halfBalance) {
      const pct = Number((ctx.sendAmount * 100n) / ctx.currentBalance);
      warnings.push(`You're sending ${pct}% of your balance. Double-check the recipient address.`);
    }
  }

  if (ctx.kind === 'sign_message' && ctx.messageText) {
    const lower = ctx.messageText.toLowerCase();
    // dApps occasionally try to slip an executable-looking payload through
    // signMessage — flag obvious red flags.
    const suspicious = [
      '0x',
      'transfer',
      'approve',
      'send',
      'permit',
      'transferfrom',
    ].some((needle) => lower.includes(needle) && lower.length > 200);
    if (suspicious) {
      warnings.push(
        'This message contains transaction-like content. Make sure you understand what the dApp is asking you to authorize.'
      );
    }
  }

  return warnings;
}

export const APPROVAL_MAX_UINT256 = MAX_UINT256;
