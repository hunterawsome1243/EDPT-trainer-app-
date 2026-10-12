import { useId } from 'react'
import type { FigureSpec, Shape } from '../../types'

/*
 * Renders a FigureSpec as SVG in a unit cell. Coordinates in the spec are
 * 0..1; the viewBox is 100×100. Fill patterns are defined once per figure.
 */

function polygon(kind: Shape['kind'], cx: number, cy: number, r: number): string {
  const pts: [number, number][] = []
  const n = kind === 'triangle' ? 3 : kind === 'pentagon' ? 5 : kind === 'star' ? 10 : 4
  for (let i = 0; i < n; i++) {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n
    const rr = kind === 'star' && i % 2 === 1 ? r * 0.45 : r
    pts.push([cx + rr * Math.cos(ang), cy + rr * Math.sin(ang)])
  }
  return pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ')
}

/**
 * `size` is the default pixel size; `className` may carry responsive width classes (e.g. "w-16 sm:w-22")
 * which take precedence, so stimulus rows can shrink on phones without a second render path.
 */
export function Figure({ spec, size = 96, className = '', highlight = false }: { spec: FigureSpec; size?: number; className?: string; highlight?: boolean }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={spec.alt}
      style={{ width: size, height: 'auto' }}
      className={`aspect-square max-w-full rounded-md border bg-white ${highlight ? 'border-sky-500' : 'border-slate-300 dark:border-slate-600'} ${className}`}
    >
      <defs>
        <pattern id={`h-${uid}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#0f172a" strokeWidth="2" />
        </pattern>
        <pattern id={`d-${uid}`} width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.6" fill="#0f172a" />
        </pattern>
      </defs>
      {spec.shapes.map((s, i) => {
        const cx = (s.x ?? 0.5) * 100
        const cy = (s.y ?? 0.5) * 100
        const r = ((s.size ?? 0.5) * 100) / 2
        const fill = s.fill === 'solid' ? '#0f172a' : s.fill === 'hatch' ? `url(#h-${uid})` : s.fill === 'dots' ? `url(#d-${uid})` : 'white'
        const common = { fill, stroke: '#0f172a', strokeWidth: 3, strokeDasharray: s.stroke === 'dashed' ? '5 4' : undefined, transform: `rotate(${s.rotation ?? 0} ${cx} ${cy})` }
        switch (s.kind) {
          case 'circle':
            return <circle key={i} cx={cx} cy={cy} r={r} {...common} />
          case 'dot':
            return <circle key={i} cx={cx} cy={cy} r={r} {...common} strokeWidth={2} />
          case 'square':
            return <rect key={i} x={cx - r * 0.9} y={cy - r * 0.9} width={r * 1.8} height={r * 1.8} {...common} />
          case 'diamond':
            return <rect key={i} x={cx - r * 0.75} y={cy - r * 0.75} width={r * 1.5} height={r * 1.5} {...common} transform={`rotate(${45 + (s.rotation ?? 0)} ${cx} ${cy})`} />
          case 'triangle':
          case 'pentagon':
          case 'star':
            return <polygon key={i} points={polygon(s.kind, cx, cy, r)} {...common} />
          case 'line':
            return <line key={i} x1={cx - r} y1={cy} x2={cx + r} y2={cy} {...common} strokeWidth={5} strokeLinecap="round" />
          case 'arrow': {
            // arrow pointing up at rotation 0
            const d = `M ${cx} ${cy - r} L ${cx + r * 0.6} ${cy - r * 0.2} L ${cx + r * 0.25} ${cy - r * 0.2} L ${cx + r * 0.25} ${cy + r} L ${cx - r * 0.25} ${cy + r} L ${cx - r * 0.25} ${cy - r * 0.2} L ${cx - r * 0.6} ${cy - r * 0.2} Z`
            return <path key={i} d={d} {...common} strokeLinejoin="round" />
          }
          default:
            return null
        }
      })}
    </svg>
  )
}
