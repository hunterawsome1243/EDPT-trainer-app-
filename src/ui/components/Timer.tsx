import { useEffect, useRef, useState } from 'react'
import { fmtTime } from './ui'

/** Count-down timer. Calls onExpire exactly once. */
export function Countdown({ endsAt, onExpire, warnAtMs = 5 * 60 * 1000 }: { endsAt: number; onExpire: () => void; warnAtMs?: number }) {
  const [now, setNow] = useState(Date.now())
  const fired = useRef(false)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [])
  const left = endsAt - now
  useEffect(() => {
    if (left <= 0 && !fired.current) {
      fired.current = true
      onExpire()
    }
  }, [left, onExpire])
  const warn = left <= warnAtMs
  return (
    <div role="timer" aria-live={warn ? 'polite' : 'off'} className={`rounded-md px-2 py-1 font-mono text-lg tabular-nums ${warn ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200' : 'bg-slate-100 dark:bg-slate-800'}`}>
      {fmtTime(left)}
    </div>
  )
}

/** Count-up stopwatch for untimed modes. */
export function Stopwatch({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  return <div role="timer" className="rounded-md bg-slate-100 px-2 py-1 font-mono text-lg tabular-nums dark:bg-slate-800">{fmtTime(now - startedAt)}</div>
}
