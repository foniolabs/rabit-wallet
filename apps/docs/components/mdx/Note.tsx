import type { ReactNode } from 'react'

type Tone = 'info' | 'warn' | 'success' | 'tip'

const palette: Record<Tone, { color: string; bg: string; border: string; icon: string }> = {
  info: { color: '#5BA8FF', bg: 'rgba(91,168,255,0.08)', border: 'rgba(91,168,255,0.25)', icon: 'ℹ' },
  warn: { color: '#FFB454', bg: 'rgba(255,180,84,0.08)', border: 'rgba(255,180,84,0.25)', icon: '⚠' },
  success: { color: '#4ADE80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.25)', icon: '✓' },
  tip: { color: '#295B4F', bg: 'rgba(41,91,79,0.08)', border: 'rgba(41,91,79,0.25)', icon: '★' },
}

export function Note({
  tone = 'info',
  title,
  children,
}: {
  tone?: Tone
  title?: string
  children: ReactNode
}) {
  const p = palette[tone]
  return (
    <div className="rabit-note" style={{ borderColor: p.border, background: p.bg }}>
      <div className="rabit-note__icon" style={{ color: p.color }}>
        {p.icon}
      </div>
      <div className="rabit-note__body">
        {title && <p className="rabit-note__title" style={{ color: p.color }}>{title}</p>}
        <div>{children}</div>
      </div>
      <style>{`
        .rabit-note {
          display: flex;
          gap: 12px;
          margin: 16px 0;
          padding: 14px 16px;
          border: 1px solid;
          border-radius: 10px;
          font-size: 14px;
          line-height: 1.6;
        }
        .rabit-note__icon {
          flex-shrink: 0;
          width: 22px;
          height: 22px;
          display: grid;
          place-items: center;
          border-radius: 6px;
          font-weight: 700;
        }
        .rabit-note__body { flex: 1; min-width: 0; }
        .rabit-note__body > div > :first-child { margin-top: 0; }
        .rabit-note__body > div > :last-child { margin-bottom: 0; }
        .rabit-note__title {
          margin: 0 0 4px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.01em;
        }
      `}</style>
    </div>
  )
}
