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
          border-radius: 16px;
          overflow: hidden;
          background: var(--rabit-border, rgba(255,255,255,0.08));
          grid-template-columns: 1fr;
        }
        @media (min-width: 720px) { .rabit-grid { grid-template-columns: 1fr 1fr; } }
      `}</style>
    </div>
  )
}

// Minimal, crisp line icons (BRG-tinted). Keyed by name so MDX stays clean.
const ICONS: Record<string, ReactNode> = {
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 16 9 5 9-5" />
    </>
  ),
  card: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </>
  ),
  code: (
    <>
      <path d="m8 6-5 6 5 6" />
      <path d="m16 6 5 6-5 6" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="8" r="4" />
      <path d="m11 11 8 8" />
      <path d="m17 17 2-2" />
      <path d="m14 14 2-2" />
    </>
  ),
  wallet: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <circle cx="16.5" cy="14.5" r="1" />
    </>
  ),
  swap: (
    <>
      <path d="M7 4 3 8l4 4" />
      <path d="M3 8h13" />
      <path d="m17 20 4-4-4-4" />
      <path d="M21 16H8" />
    </>
  ),
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
  const glyph = icon ? ICONS[icon] : null
  return (
    <div className="rabit-feature">
      {glyph && (
        <div className="rabit-feature__icon">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            {glyph}
          </svg>
        </div>
      )}
      <h4 className="rabit-feature__title">{title}</h4>
      <div className="rabit-feature__body">{children}</div>
      <style>{`
        .rabit-feature {
          padding: 22px 24px;
          background: var(--rabit-card, #fff);
          transition: background 160ms ease;
        }
        .rabit-feature:hover { background: color-mix(in srgb, var(--rabit-accent, #295B4F) 5%, transparent); }
        .rabit-feature__icon {
          display: inline-grid;
          place-items: center;
          width: 38px;
          height: 38px;
          margin-bottom: 14px;
          border-radius: 11px;
          background: color-mix(in srgb, var(--rabit-accent, #295B4F) 10%, transparent);
          color: var(--rabit-accent, #295B4F);
          border: 1px solid color-mix(in srgb, var(--rabit-accent, #295B4F) 22%, transparent);
        }
        .rabit-feature__title {
          margin: 0 0 6px;
          font-size: 15.5px;
          font-weight: 600;
        }
        .rabit-feature__body { font-size: 14px; line-height: 1.6; opacity: 0.8; }
        .rabit-feature__body p { margin: 0; }
      `}</style>
    </div>
  )
}
