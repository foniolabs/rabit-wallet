export interface Theme {
  colors: {
    primary: string;
    background: string;
    foreground: string;
    muted: string;
    border: string;
    accent: string;
  };
  borderRadius: string;
  fontFamily: string;
  shadow?: string;
}

export type ThemeMode = 'light' | 'dark';
