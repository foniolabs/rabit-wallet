import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1.25rem', sm: '1.5rem', lg: '2rem' },
      screens: { '2xl': '1160px' },
    },
    extend: {
      colors: {
        // British Racing Green brand scale.
        brand: {
          100: '#DCEFEA',
          300: '#569F8C',
          500: '#295B4F',
          700: '#162F29',
          900: '#0A1512',
        },
        // Light, faintly-green "paper" base.
        paper: {
          DEFAULT: '#F1F6F4',
          raised: '#F8FBFA',
        },
        card: '#FFFFFF',
        ink: {
          DEFAULT: '#0A1512',
          muted: '#3F5A52',
          subtle: '#7C948C',
        },
        line: {
          DEFAULT: 'rgba(10,21,18,0.08)',
          strong: 'rgba(10,21,18,0.14)',
        },
        accent: {
          DEFAULT: '#295B4F',
          hover: '#1F4A40',
          soft: 'rgba(41,91,79,0.10)',
        },
        // Secondary tints (kept as class names, retuned to the green family).
        iris: '#3E7D6E',
        mint: '#569F8C',
        peach: '#7FB8A8',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Plasma is the brand display face (used via the .serif helper + headings).
        serif: ['var(--font-display)', 'ui-serif', 'Georgia', 'serif'],
        display: ['var(--font-display)', 'ui-serif', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        'display-2xl': ['clamp(2.75rem, 6vw, 5.25rem)', { lineHeight: '1.0', letterSpacing: '-0.02em' }],
        'display-xl': ['clamp(2.25rem, 4.5vw, 3.75rem)', { lineHeight: '1.04', letterSpacing: '-0.018em' }],
        'display-lg': ['clamp(1.875rem, 3.2vw, 2.75rem)', { lineHeight: '1.1', letterSpacing: '-0.015em' }],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(10,21,18,0.04), 0 8px 24px -12px rgba(10,21,18,0.14)',
        card: '0 1px 2px rgba(10,21,18,0.05), 0 24px 56px -28px rgba(10,21,18,0.22)',
        lifted: '0 2px 4px rgba(10,21,18,0.06), 0 44px 88px -36px rgba(10,21,18,0.32)',
        glow: '0 14px 44px -14px rgba(41,91,79,0.5)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.22,1,0.36,1) forwards',
        float: 'float 6s ease-in-out infinite',
        marquee: 'marquee 30s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config
