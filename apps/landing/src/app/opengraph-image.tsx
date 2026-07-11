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
            'radial-gradient(60% 45% at 12% -5%, rgba(127,184,168,0.45), transparent 70%), radial-gradient(55% 45% at 100% 5%, rgba(86,159,140,0.30), transparent 70%), #F1F6F4',
          color: '#0A1512',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 13,
              background: '#0A1512',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              fontWeight: 700,
              color: '#F1F6F4',
            }}
          >
            R
          </div>
          <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.01em' }}>Rabit</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              fontSize: 82,
              fontWeight: 600,
              letterSpacing: '-0.03em',
              lineHeight: 1.02,
              maxWidth: 1000,
            }}
          >
            A wallet your users never have to think about.
          </div>
          <div style={{ fontSize: 27, color: '#6C6656', maxWidth: 920, lineHeight: 1.4 }}>
            Non-custodial embedded wallet — email login, EVM + Solana, on-ramp. One npm install.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div
            style={{
              padding: '12px 22px',
              borderRadius: 999,
              border: '1px solid rgba(10,21,18,0.14)',
              background: '#FFFFFF',
              fontFamily: 'monospace',
              fontSize: 22,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{ color: '#295B4F' }}>$</span>
            <span style={{ color: '#0A1512' }}>npm install rabitwallet</span>
          </div>
          <div style={{ fontSize: 22, color: '#7C948C' }}>rabitwallet.xyz</div>
        </div>
      </div>
    ),
    { ...size },
  )
}
