/**
 * Theme tokens — what every built-in component reads from.
 *
 * Devs override via `RabitConfig.theme.colors` / `borderRadius` / `fonts`,
 * and `useTheme()` merges defaults + overrides into a flat token object.
 */

import { useMemo } from 'react';
import type { ThemeConfig } from '@rabit/types';
import { useRabitContext } from './provider.js';

export interface ResolvedTheme {
  colors: {
    primary: string;
    primaryText: string;
    accent: string;
    background: string;
    surface: string;
    surfaceMuted: string;
    border: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    error: string;
    success: string;
    warning: string;
    warningText: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
  };
  fonts: {
    body: string;
    monospace: string;
  };
  shadow: string;
}

const RADIUS_MAP = {
  none: { sm: '0px', md: '0px', lg: '0px' },
  small: { sm: '4px', md: '6px', lg: '10px' },
  medium: { sm: '6px', md: '10px', lg: '14px' },
  large: { sm: '10px', md: '16px', lg: '24px' },
} as const;

const DEFAULT_BODY_FONT =
  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif';
const DEFAULT_MONO_FONT = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

export function buildTheme(config?: ThemeConfig): ResolvedTheme {
  const radiusKey = (config?.borderRadius ?? 'large') as keyof typeof RADIUS_MAP;
  const radius = RADIUS_MAP[radiusKey] ?? RADIUS_MAP.large;

  return {
    colors: {
      // Default theme: British Racing Green (deep, premium, dark).
      primary: config?.colors?.primary ?? '#569F8C',
      primaryText: config?.colors?.primaryText ?? '#071A14',
      accent: config?.colors?.secondary ?? '#295B4F',
      background: config?.colors?.background ?? '#0A1512',
      surface: config?.colors?.surface ?? '#101F1A',
      surfaceMuted: '#162F29',
      border: config?.colors?.border ?? '#21403A',
      text: config?.colors?.text ?? '#ECF5F1',
      textSecondary: config?.colors?.textSecondary ?? '#7FA89D',
      textMuted: '#4A6B62',
      error: config?.colors?.error ?? '#FF6B6B',
      success: config?.colors?.success ?? '#5AD0A6',
      warning: config?.colors?.warning ?? '#F5C451',
      warningText: '#F5C451',
    },
    radius,
    fonts: {
      body: config?.fonts?.body ?? DEFAULT_BODY_FONT,
      monospace: config?.fonts?.monospace ?? DEFAULT_MONO_FONT,
    },
    shadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
  };
}

/**
 * Get the merged theme tokens. Built-in components use this; consumer apps
 * can also call it to style their own UI consistently with Rabit components.
 */
export function useTheme(): ResolvedTheme {
  const { config } = useRabitContext();
  return useMemo(() => buildTheme(config.theme), [config.theme]);
}
