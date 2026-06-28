// MUST be the first import in main.tsx — sets up Buffer/process before any
// transitive Solana import tries to read them.
import { Buffer } from 'buffer';

if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}
if (typeof globalThis.process === 'undefined') {
  // @ts-expect-error minimal shim
  globalThis.process = { env: {} };
}
