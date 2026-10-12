import { useSafeLiveQuery as useLiveQuery } from '../hooks/useSafeLiveQuery'
import { Link } from 'react-router-dom'
import { db } from '../../db/db'
import { LESSONS, LESSON_ORDER } from '../../content/lessons'
import { Card, PageTitle } from '../components/ui'

export function LearnPage() {
  const progress = useLiveQuery(() => db.lessons.toArray(), [], [])
  return (
    <div className="space-y-4">
      <PageTitle sub="Work through the modules in order. Each ends with a mastery check that unlocks the next difficulty tier.">Learn</PageTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link to="/learn/strategy" className="rounded-xl border border-sky-300 bg-sky-50 p-4 hover:bg-sky-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 dark:border-sky-800 dark:bg-sky-950/30 dark:hover:bg-sky-950/60">
          <div className="font-semibold">Test strategy</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Pacing, skipping, elimination, guessing, test day.</div>
        </Link>
        <Link to="/learn/mental-math" className="rounded-xl border border-slate-200 bg-white p-4 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800">
          <div className="font-semibold">Mental-math drills</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Timed tables, percentages, fractions, squares.</div>
        </Link>
      </div>
      <h2 className="pt-2 text-lg font-semibold">Modules</h2>
      <ol className="grid gap-3 sm:grid-cols-2">
        {LESSON_ORDER.map((t, i) => {
          const l = LESSONS[t]
          const p = progress.find((x) => x.type === t)
          return (
            <li key={t}>
              <Link to={`/learn/${t}`} className="block rounded-xl border border-slate-200 bg-white p-4 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{i + 1}. {l.title}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{p?.masteryPassedAt ? `Tier ${p.tier} unlocked` : p?.readAt ? 'Read' : 'Not started'}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{l.intro}</p>
              </Link>
            </li>
          )
        })}
      </ol>
      <Card>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link className="underline" to="/learn/rules">Rule library</Link>
          <Link className="underline" to="/learn/glossary">Glossary</Link>
          <Link className="underline" to="/reference">Exam facts and cutoffs</Link>
        </div>
      </Card>
    </div>
  )
}
