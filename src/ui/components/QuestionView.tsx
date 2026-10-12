import { useEffect } from 'react'
import type { Question } from '../../types'
import { Figure } from './Figure'

interface Props {
  question: Question
  chosen: string | null
  onChoose: (id: string) => void
  /** when set, show correct/incorrect styling */
  reveal?: boolean
  disabled?: boolean
  index?: number
  total?: number
}

export function QuestionView({ question: q, chosen, onChoose, reveal = false, disabled = false, index, total }: Props) {
  // keyboard: A–E or 1–5 choose an option
  useEffect(() => {
    if (disabled) return
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.tagName === 'TEXTAREA' || (e.target as HTMLElement | null)?.tagName === 'INPUT') return
      const k = e.key.toUpperCase()
      const idx = 'ABCDE'.indexOf(k) >= 0 ? 'ABCDE'.indexOf(k) : '12345'.indexOf(k)
      if (idx >= 0 && idx < q.options.length) {
        e.preventDefault()
        onChoose(q.options[idx]!.id)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [q, onChoose, disabled])

  const isFigureOptions = q.options.some((o) => o.figure)
  return (
    <div className="space-y-4">
      {index !== undefined && total !== undefined && (
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Question {index + 1} of {total}
        </div>
      )}
      {q.passage && (
        <div className="rounded-lg bg-slate-100 p-3 text-sm leading-relaxed dark:bg-slate-800">
          <p>{q.passage}</p>
        </div>
      )}
      <h2 className="text-lg font-semibold">{q.prompt}</h2>
      {q.stem && <p className="font-mono text-xl tracking-wide" aria-label={`Series: ${q.stem}`}>{q.stem}</p>}
      {q.figures && q.figures.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" aria-label={q.figureLayout === 'analogy' ? 'Analogy figures A, B and C' : 'Figure sequence'}>
          {q.figures.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <Figure spec={f} size={88} className="w-16! sm:w-22!" />
                {q.figureLayout === 'analogy' && <span className="text-xs text-slate-500 dark:text-slate-400">{['A', 'B', 'C'][i]}</span>}
              </div>
              {q.figureLayout === 'analogy' && i === 0 && <span className="text-slate-400">→</span>}
              {q.figureLayout === 'analogy' && i === 1 && <span className="px-2 text-slate-400">::</span>}
              {q.figureLayout === 'analogy' && i === 2 && <span className="text-slate-400">→ ?</span>}
              {q.figureLayout === 'sequence' && i < q.figures!.length - 1 && <span className="text-slate-400">,</span>}
            </div>
          ))}
          {q.figureLayout === 'sequence' && <div className="flex aspect-square w-16 items-center justify-center rounded-md border border-dashed border-slate-400 text-2xl text-slate-500 sm:w-22 dark:text-slate-400">?</div>}
        </div>
      )}
      <div role="radiogroup" aria-label="Answer options" className={isFigureOptions ? 'grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5' : 'grid gap-2'}>
        {q.options.map((o) => {
          const selected = chosen === o.id
          const correct = reveal && o.id === q.correctOptionId
          const wrong = reveal && selected && !correct
          const cls = correct
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
            : wrong
              ? 'border-red-500 bg-red-50 dark:bg-red-950/40'
              : selected
                ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40'
                : 'border-slate-300 hover:border-sky-400 dark:border-slate-700'
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChoose(o.id)}
              className={`flex min-h-12 items-center gap-3 rounded-lg border-2 p-2 text-left text-base transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-default ${cls} ${isFigureOptions ? 'flex-col' : ''}`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-bold dark:bg-slate-700">{o.id}</span>
              {o.figure ? <Figure spec={o.figure} size={80} className="w-18! sm:w-20!" /> : <span className={q.type === 'number-sequence' || q.type === 'letter-sequence' ? 'font-mono text-lg' : ''}>{o.text}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
