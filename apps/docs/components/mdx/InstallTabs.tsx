'use client'

import { useState } from 'react'

const managers = ['npm', 'pnpm', 'yarn', 'bun'] as const
type Manager = (typeof managers)[number]

const verbs: Record<Manager, string> = {
  npm: 'npm install',
  pnpm: 'pnpm add',
  yarn: 'yarn add',
  bun: 'bun add',
}

export function InstallTabs({ pkg }: { pkg: string }) {
  const [active, setActive] = useState<Manager>('npm')
  const [copied, setCopied] = useState(false)
  const command = `${verbs[active]} ${pkg}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  return (
    <div className="rabit-itabs">
      <div className="rabit-itabs__row">
        {managers.map((m) => (
          <button
            key={m}
            onClick={() => setActive(m)}
            className={m === active ? 'is-active' : ''}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="rabit-itabs__cmd">
        <span className="prompt">$</span>
        <code>{command}</code>
        <button onClick={copy} aria-label="Copy command" className="copy">
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>
      <style>{`
        .rabit-itabs {
          margin: 16px 0;
          border: 1px solid var(--rabit-border);
          border-radius: 12px;
          overflow: hidden;
          background: rgba(255,255,255,0.02);
        }
        .rabit-itabs__row {
          display: flex;
          gap: 2px;
          padding: 4px;
          background: rgba(0,0,0,0.06);
          border-bottom: 1px solid var(--rabit-border);
        }
        :is(html.dark) .rabit-itabs__row { background: rgba(255,255,255,0.02); }
        .rabit-itabs__row button {
          flex: 0 0 auto;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 500;
          border-radius: 7px;
          color: rgba(120,120,128,0.95);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: color 120ms, background 120ms;
        }
        .rabit-itabs__row button:hover { color: inherit; }
        .rabit-itabs__row button.is-active {
          background: rgba(255,255,255,0.08);
          color: #295B4F;
        }
        :is(html.dark) .rabit-itabs__row button.is-active {
          background: rgba(255,255,255,0.06);
        }
        .rabit-itabs__cmd {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          font-family: ui-monospace, SFMono-Regular, monospace;
          font-size: 13px;
        }
        .rabit-itabs__cmd .prompt { color: rgba(120,120,128,0.7); }
        .rabit-itabs__cmd code { flex: 1; background: transparent; padding: 0; }
        .rabit-itabs__cmd .copy {
          margin-left: auto;
          padding: 4px 10px;
          font-size: 11px;
          font-family: inherit;
          border: 1px solid var(--rabit-border);
          border-radius: 6px;
          background: transparent;
          color: rgba(120,120,128,0.95);
          cursor: pointer;
          transition: all 120ms;
        }
        .rabit-itabs__cmd .copy:hover {
          border-color: rgba(41,91,79,0.5);
          color: #295B4F;
        }
      `}</style>
    </div>
  )
}
