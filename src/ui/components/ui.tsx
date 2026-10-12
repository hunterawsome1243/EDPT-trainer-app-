import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function PageTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <header className="mb-4">
      <h1 className="text-2xl font-bold tracking-tight">{children}</h1>
      {sub && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{sub}</p>}
    </header>
  )
}

export function Card({ children, className = '', as: Tag = 'section' }: { children: ReactNode; className?: string; as?: 'section' | 'div' | 'article' }) {
  return <Tag className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}>{children}</Tag>
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
const V: Record<Variant, string> = {
  primary: 'bg-sky-700 text-white hover:bg-sky-800 disabled:bg-slate-300 disabled:text-slate-700 dark:disabled:bg-slate-700 dark:disabled:text-slate-300',
  secondary: 'bg-slate-200 text-slate-900 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
  ghost: 'bg-transparent text-sky-700 hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-slate-800',
  danger: 'bg-red-600 text-white hover:bg-red-700',
}

export function Button({ variant = 'primary', className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...rest}
      className={`inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed ${V[variant]} ${className}`}
    />
  )
}

export function LinkButton({ to, children, variant = 'primary', className = '' }: { to: string; children: ReactNode; variant?: Variant; className?: string }) {
  return (
    <Link to={to} className={`inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${V[variant]} ${className}`}>
      {children}
    </Link>
  )
}

export function Disclaimer({ text }: { text: string }) {
  return (
    <p role="note" className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
      {text}
    </p>
  )
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-800">
      <div className="text-xs text-slate-600 dark:text-slate-400">{label}</div>
      <div className="text-xl font-bold tabular-nums">{value}</div>
      {hint && <div className="text-xs text-slate-600 dark:text-slate-400">{hint}</div>}
    </div>
  )
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-600 dark:text-slate-400">{hint}</span>}
    </label>
  )
}

export const inputCls = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline focus:outline-2 focus:outline-sky-500 dark:border-slate-700 dark:bg-slate-800'

export function Progress({ value, label }: { value: number; label?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  return (
    <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label} className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
      <div className="h-full rounded-full bg-sky-600 transition-[width]" style={{ width: `${pct}%` }} />
    </div>
  )
}

export function fmtTime(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

export function pct(n: number, d: number): string {
  return d ? `${Math.round((n / d) * 100)}%` : '–'
}
