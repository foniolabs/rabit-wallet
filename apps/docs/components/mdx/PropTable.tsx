import type { ReactNode } from 'react'

export type PropRow = {
  name: string
  type: string
  default?: string
  required?: boolean
  description: ReactNode
}

export function PropTable({ rows }: { rows: PropRow[] }) {
  return (
    <div className="rabit-props">
      <table>
        <thead>
          <tr>
            <th>Prop</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <td>
                <code className="name">
                  {r.name}
                  {r.required && <span className="req" title="Required">*</span>}
                </code>
              </td>
              <td>
                <code className="type">{r.type}</code>
              </td>
              <td>{r.default ? <code className="def">{r.default}</code> : <span className="dim">—</span>}</td>
              <td className="desc">{r.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <style>{`
        .rabit-props {
          margin: 16px 0;
          border: 1px solid var(--rabit-border);
          border-radius: 12px;
          overflow: auto;
        }
        .rabit-props table {
          width: 100%;
          margin: 0;
          border-collapse: collapse;
          font-size: 13px;
        }
        .rabit-props thead {
          background: rgba(255,255,255,0.03);
        }
        .rabit-props th {
          padding: 10px 14px;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(120,120,128,0.95);
          border-bottom: 1px solid var(--rabit-border);
        }
        .rabit-props td {
          padding: 12px 14px;
          border-top: 1px solid var(--rabit-border);
          vertical-align: top;
        }
        .rabit-props code {
          font-size: 12px;
          padding: 2px 6px;
          border-radius: 5px;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--rabit-border);
        }
        .rabit-props code.name { color: #295B4F; }
        .rabit-props code.type { color: #5BA8FF; }
        .rabit-props code.def { color: rgba(120,120,128,0.95); }
        .rabit-props .req {
          margin-left: 4px;
          color: #f87171;
          font-weight: 700;
        }
        .rabit-props .dim { color: rgba(120,120,128,0.6); }
        .rabit-props .desc { line-height: 1.55; }
      `}</style>
    </div>
  )
}
