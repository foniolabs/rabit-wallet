import { Theme } from '../types';
import { lightTheme } from './light';

export const blueTheme: Theme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    primary: '#3B82F6',
    accent: '#EFF6FF',
  },
};

export const greenTheme: Theme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    primary: '#10B981',
    accent: '#ECFDF5',
  },
};

export const purpleTheme: Theme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    primary: '#8B5CF6',
    accent: '#F5F3FF',
  },
};

export const roundedTheme: Theme = {
  ...lightTheme,
  borderRadius: '24px',
};

export const compactTheme: Theme = {
  ...lightTheme,
  borderRadius: '6px',
};
