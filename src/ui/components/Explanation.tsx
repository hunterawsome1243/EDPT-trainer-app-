import type { Question } from '../../types'

export function Explanation({ q, correct }: { q: Question; correct: boolean | null }) {
  return (
    <div className={`rounded-lg border p-3 text-sm ${correct ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30' : 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30'}`} aria-live="polite">
      <div className="mb-1 font-semibold">{correct === null ? 'Skipped' : correct ? 'Correct' : `Not quite. The answer is ${q.correctOptionId}.`}</div>
      <dl className="space-y-1">
        <div><dt className="inline font-semibold">Pattern: </dt><dd className="inline">{q.explanation.pattern}</dd></div>
        <div><dt className="inline font-semibold">How to spot it: </dt><dd className="inline">{q.explanation.howToSpot}</dd></div>
        <div><dt className="inline font-semibold">Trap: </dt><dd className="inline">{q.explanation.trap}</dd></div>
      </dl>
    </div>
  )
}
