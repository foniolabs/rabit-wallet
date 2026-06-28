// MUST be imported before any @rabit / Solana code so Buffer/process exist.
import { Buffer } from 'buffer';

if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}
if (typeof globalThis.process === 'undefined') {
  // @ts-expect-error minimal shim
  globalThis.process = { env: {} };
}
