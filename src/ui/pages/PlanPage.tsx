import { useSafeLiveQuery as useLiveQuery } from '../hooks/useSafeLiveQuery'
import { Link } from 'react-router-dom'
import { db } from '../../db/db'
import { typeAccuracy } from '../../db/queries'
import { buildPlan, daysBetween } from '../../engine/plan'
import { useSettings } from '../hooks/useSettings'
import { Card, PageTitle } from '../components/ui'

export function PlanPage() {
  const { settings } = useSettings()
  const acc = useLiveQuery(typeAccuracy, [], {})
  const lessons = useLiveQuery(() => db.lessons.toArray(), [], [])
  const today = new Date().toISOString().slice(0, 10)
  if (!settings.testDate || daysBetween(today, settings.testDate) <= 0)
    return (
      <div>
        <PageTitle>Study plan</PageTitle>
        <p className="text-sm">Set a future test date and your minutes per day in <Link className="underline" to="/settings">Settings</Link> to generate a plan.</p>
      </div>
    )
  const plan = buildPlan({ today, testDate: settings.testDate, minutesPerDay: settings.minutesPerDay, accuracy: acc, lessonsDone: lessons.filter((l) => l.readAt).map((l) => l.type) })
  return (
    <div className="space-y-4">
      <PageTitle sub={`${plan.length} days until ${settings.testDate}, ${settings.minutesPerDay} minutes a day. The plan re-balances toward your weakest areas as results come in.`}>Study plan</PageTitle>
      <ol className="space-y-2">
        {plan.map((d, i) => (
          <li key={d.date}>
            <Card as="div" className={i === 0 ? 'border-sky-300 dark:border-sky-800' : ''}>
              <div className="mb-1 flex justify-between text-sm"><span className="font-semibold">{i === 0 ? 'Today' : d.date}</span><span className="text-slate-600 dark:text-slate-400">{d.minutes} min</span></div>
              <ul className="text-sm">{d.items.map((it, k) => <li key={k} className="flex justify-between"><span>{it.label}</span><span className="tabular-nums text-slate-600 dark:text-slate-400">{it.minutes} min</span></li>)}</ul>
            </Card>
          </li>
        ))}
      </ol>
    </div>
  )
}
