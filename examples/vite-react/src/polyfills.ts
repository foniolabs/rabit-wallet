// IMPORTANT: keep this file's body as side-effect-only assignments.
//
// Why a separate module: ESM hoists all `import` statements to the top of a
// module before any non-import code runs. If we put the `globalThis.Buffer = …`
// assignment alongside other imports in main.tsx, every transitive import
// (including @solana/spl-token, which references Buffer at module load) runs
// FIRST, before the assignment.
//
// By isolating the assignment in its own module and importing it as the very
// first import in main.tsx, the loader fully evaluates this file (assignment
// included) before moving on to the next import. That puts Buffer onto
// globalThis before anything Solana-related loads.

import { Buffer } from 'buffer';

if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

if (typeof globalThis.process === 'undefined') {
  // @ts-expect-error minimal shim — Solana libs only read process.env
  globalThis.process = { env: {} };
}
