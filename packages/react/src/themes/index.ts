export * from './light';
export * from './dark';
export * from './variants';

import { Theme } from '../types';
import { lightTheme } from './light';

export function createTheme(overrides: Partial<Theme>): Theme {
  return {
    ...lightTheme,
    ...overrides,
    colors: {
      ...lightTheme.colors,
      ...overrides.colors,
    },
  };
}
