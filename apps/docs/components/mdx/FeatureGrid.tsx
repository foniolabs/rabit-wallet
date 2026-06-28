import type { ReactNode } from 'react'

export function FeatureGrid({ children }: { children: ReactNode }) {
  return (
    <div className="rabit-grid">
      {children}
      <style>{`
        .rabit-grid {
          display: grid;
          gap: 1px;
          margin: 24px 0;
          border: 1px solid var(--rabit-border, rgba(255,255,255,0.08));
          border-radius: 14px;
          overflow: hidden;
          background: var(--rabit-border, rgba(255,255,255,0.08));
          grid-template-columns: 1fr;
        }
        @media (min-width: 720px) { .rabit-grid { grid-template-columns: 1fr 1fr; } }
      `}</style>
    </div>
  )
}

export function Feature({
  icon,
  title,
  children,
}: {
  icon?: string
  title: string
  children: ReactNode
}) {
  return (
    <div className="rabit-feature">
      {icon && <div className="rabit-feature__icon">{icon}</div>}
      <h4 className="rabit-feature__title">{title}</h4>
      <div className="rabit-feature__body">{children}</div>
      <style>{`
        .rabit-feature {
          padding: 20px 22px;
          background: white;
          transition: background 160ms ease;
        }
        :is(html.dark) .rabit-feature { background: #0E0E12; }
        .rabit-feature:hover { background: rgba(255,122,26,0.04); }
        :is(html.dark) .rabit-feature:hover { background: rgba(255,122,26,0.06); }
        .rabit-feature__icon {
          display: inline-grid;
          place-items: center;
          width: 32px;
          height: 32px;
          margin-bottom: 12px;
          font-size: 16px;
          border-radius: 8px;
          background: rgba(255,122,26,0.10);
          color: #FF7A1A;
          border: 1px solid rgba(255,122,26,0.20);
        }
        .rabit-feature__title {
          margin: 0 0 6px;
          font-size: 15px;
          font-weight: 600;
        }
        .rabit-feature__body { font-size: 14px; line-height: 1.6; opacity: 0.78; }
        .rabit-feature__body p { margin: 0; }
      `}</style>
    </div>
  )
}
