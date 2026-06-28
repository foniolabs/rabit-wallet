/**
 * PinPad — a 4-digit numeric PIN input with reusable presentation.
 * Used by both PinSetup and PinUnlock.
 */

import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../theme.js';

export interface PinPadProps {
  /** Length of the PIN. Defaults to 4. */
  length?: number;
  /** Called when all digits are filled. */
  onComplete?: (pin: string) => void;
  /** Externally driven value (clears on parent reset). */
  value?: string;
  /** Notify parent on each change so it can drive UI state. */
  onChange?: (pin: string) => void;
  /** Hide digits (default true). Set to false for "show" toggle. */
  masked?: boolean;
  /** Disable input (during async work). */
  disabled?: boolean;
  /** Auto-focus on mount. */
  autoFocus?: boolean;
}

export function PinPad({
  length = 4,
  onComplete,
  value,
  onChange,
  masked = true,
  disabled = false,
  autoFocus = true,
}: PinPadProps) {
  const theme = useTheme();
  const [internal, setInternal] = useState('');
  const pin = value ?? internal;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const setPin = (next: string) => {
    if (value === undefined) setInternal(next);
    onChange?.(next);
    if (next.length === length) onComplete?.(next);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, length);
    setPin(cleaned);
  };

  const cells = Array.from({ length }, (_, i) => i);

  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'center' }}>
      <input
        ref={inputRef}
        value={pin}
        onChange={handleChange}
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={length}
        disabled={disabled}
        autoComplete="one-time-code"
        style={{
          position: 'absolute',
          left: '-9999px',
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: 'none',
        }}
        aria-label="PIN"
      />
      <div
        onClick={() => inputRef.current?.focus()}
        style={{ display: 'flex', gap: 12, cursor: disabled ? 'not-allowed' : 'text' }}
      >
        {cells.map((i) => {
          const filled = i < pin.length;
          return (
            <div
              key={i}
              style={{
                width: 48,
                height: 56,
                borderRadius: theme.radius.md,
                border: `1.5px solid ${i === pin.length ? theme.colors.primary : theme.colors.border}`,
                background: theme.colors.surface,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: masked ? 28 : 24,
                fontWeight: 600,
                color: theme.colors.text,
                fontFamily: theme.fonts.monospace,
                transition: 'border-color 0.12s ease',
              }}
            >
              {filled ? (masked ? '•' : pin[i]) : ''}
            </div>
          );
        })}
      </div>
    </div>
  );
}
