import type { ReactNode } from 'react'

export function Hero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string
  title: string
  description?: string
  children?: ReactNode
}) {
  return (
    <div className="rabit-hero">
      {eyebrow && <span className="rabit-hero__eyebrow">{eyebrow}</span>}
      <h1 className="rabit-hero__title">{title}</h1>
      {description && <p className="rabit-hero__desc">{description}</p>}
      {children && <div className="rabit-hero__cta">{children}</div>}
      <style>{`
        .rabit-hero {
          position: relative;
          overflow: hidden;
          border-radius: 24px;
          padding: 40px 34px;
          margin: 10px 0 28px;
          border: 1px solid var(--rabit-border);
          background:
            radial-gradient(ellipse 55% 90% at 100% 0%, rgba(255,158,109,0.28), transparent 70%),
            radial-gradient(ellipse 55% 90% at 0% 100%, rgba(122,108,240,0.16), transparent 70%),
            var(--rabit-card);
          box-shadow: 0 1px 2px rgba(24,21,9,0.05), 0 24px 56px -28px rgba(24,21,9,0.2);
        }
        .rabit-hero__eyebrow {
          display: inline-flex;
          align-items: center;
          padding: 5px 12px;
          margin-bottom: 16px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.02em;
          color: var(--rabit-accent);
          background: color-mix(in srgb, var(--rabit-accent) 9%, transparent);
          border: 1px solid color-mix(in srgb, var(--rabit-accent) 22%, transparent);
          border-radius: 999px;
        }
        .rabit-hero__title {
          font-family: var(--font-serif), Georgia, serif;
          font-optical-sizing: auto;
          font-size: 40px;
          font-weight: 600;
          letter-spacing: -0.025em;
          line-height: 1.04;
          margin: 0;
          color: var(--rabit-ink);
        }
        .rabit-hero__desc {
          margin: 14px 0 0;
          font-size: 16.5px;
          line-height: 1.6;
          color: var(--rabit-muted);
          max-width: 640px;
        }
        .rabit-hero__cta {
          margin-top: 22px;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
      `}</style>
    </div>
  )
}
