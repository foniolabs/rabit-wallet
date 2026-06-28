import { ImageResponse } from 'next/og'
import { siteConfig } from '@/lib/site'

export const runtime = 'edge'
export const alt = siteConfig.title
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 80,
          background:
            'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255,122,26,0.25), transparent 70%), #08080A',
          color: '#FAFAFA',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #FF7A1A, #FF8A33)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 800,
              color: 'white',
            }}
          >
            R
          </div>
          <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.01em' }}>
            Rabit
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              fontSize: 84,
              fontWeight: 700,
              letterSpacing: '-0.04em',
              lineHeight: 1.05,
              maxWidth: 1000,
            }}
          >
            The wallet SDK that actually works.
          </div>
          <div style={{ fontSize: 28, color: '#A1A1AA', maxWidth: 900, lineHeight: 1.4 }}>
            Drop-in auth, smart accounts, and on-ramp for Vite and Next.js.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div
            style={{
              padding: '12px 22px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(20,20,25,0.7)',
              fontFamily: 'monospace',
              fontSize: 22,
              color: '#A1A1AA',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{ color: '#71717A' }}>$</span>
            <span style={{ color: '#FAFAFA' }}>npm i @rabit/react</span>
          </div>
          <div style={{ fontSize: 22, color: '#71717A' }}>rabit.dev</div>
        </div>
      </div>
    ),
    { ...size },
  )
}
