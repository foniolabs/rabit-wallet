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
          border-radius: 16px;
          padding: 36px 32px;
          margin: 8px 0 24px;
          border: 1px solid rgba(255,122,26,0.18);
          background:
            radial-gradient(ellipse 60% 90% at 100% 0%, rgba(255,122,26,0.18), transparent 70%),
            radial-gradient(ellipse 60% 90% at 0% 100%, rgba(120,80,255,0.10), transparent 70%),
            linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0));
        }
        :is(html.dark) .rabit-hero {
          background:
            radial-gradient(ellipse 60% 90% at 100% 0%, rgba(255,122,26,0.18), transparent 70%),
            radial-gradient(ellipse 60% 90% at 0% 100%, rgba(120,80,255,0.10), transparent 70%),
            linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0));
        }
        .rabit-hero__eyebrow {
          display: inline-block;
          padding: 4px 10px;
          margin-bottom: 14px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #FF7A1A;
          background: rgba(255,122,26,0.08);
          border: 1px solid rgba(255,122,26,0.25);
          border-radius: 999px;
        }
        .rabit-hero__title {
          font-size: 36px;
          font-weight: 700;
          letter-spacing: -0.025em;
          line-height: 1.1;
          margin: 0;
          background: linear-gradient(135deg, #FF7A1A 0%, #FFB579 60%, #FF7A1A 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .rabit-hero__desc {
          margin: 12px 0 0;
          font-size: 16px;
          line-height: 1.6;
          color: var(--nx-colors-gray-600);
        }
        :is(html.dark) .rabit-hero__desc { color: rgba(250,250,250,0.7); }
        .rabit-hero__cta {
          margin-top: 20px;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
      `}</style>
    </div>
  )
}
