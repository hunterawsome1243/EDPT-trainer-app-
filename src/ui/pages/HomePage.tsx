import { useSafeLiveQuery as useLiveQuery } from '../hooks/useSafeLiveQuery'
import { Link } from 'react-router-dom'
import { db } from '../../db/db'
import { dailyTrend, examSessions, ruleAggregates, streakDays } from '../../db/queries'
import { computeReadiness, targetPercentFor } from '../../engine/readiness'
import { buildPlan, daysBetween } from '../../engine/plan'
import { dueRules } from '../../engine/spaced'
import { CUTOFFS, DISCLAIMER } from '../../content/reference'
import { QUESTION_TYPE_LABELS } from '../../types'
import { useSettings } from '../hooks/useSettings'
import { Card, Disclaimer, LinkButton, PageTitle, Progress, Stat } from '../components/ui'

export function HomePage() {
  const { settings } = useSettings()
  const aggs = useLiveQuery(ruleAggregates, [], [])
  const exams = useLiveQuery(examSessions, [], [])
  const trend = useLiveQuery(() => dailyTrend(14), [], [])
  const streak = useLiveQuery(streakDays, [], 0)
  const reviews = useLiveQuery(() => db.reviews.toArray(), [], [])
  const lessons = useLiveQuery(() => db.lessons.toArray(), [], [])
  const cutoff = CUTOFFS.find((c) => c.afsc === settings.targetAfsc)?.minScore ?? 71
  const readiness = computeReadiness(aggs, targetPercentFor(cutoff))
  const due = dueRules(reviews, Date.now())
  const today = new Date().toISOString().slice(0, 10)
  const daysLeft = settings.testDate ? daysBetween(today, settings.testDate) : null
  const plan = settings.testDate && daysLeft !== null && daysLeft > 0
    ? buildPlan({ today, testDate: settings.testDate, minutesPerDay: settings.minutesPerDay, accuracy: {}, lessonsDone: lessons.filter((l) => l.readAt).map((l) => l.type) })[0]
    : null
  const totalAttempts = aggs.reduce((s, r) => s + r.total, 0)
  const lastExam = exams[exams.length - 1]

  return (
    <div className="space-y-4">
      <PageTitle sub={`Target: ${settings.targetAfsc} (cutoff ${cutoff}). ${daysLeft !== null ? (daysLeft > 0 ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} to test day.` : daysLeft === 0 ? 'Test day is today.' : 'Test date has passed; update it in Settings.') : 'Set a test date in Settings to get a daily plan.'}`}>
        EDPT Trainer
      </PageTitle>

      {!settings.onboarded && (
        <Card className="border-sky-300 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/30">
          <h2 className="font-semibold">New here?</h2>
          <p className="mt-1 text-sm">Start with the <Link className="underline" to="/learn/strategy">strategy guide</Link>, then work through the six Learn modules in order. Set your target career field and test date in <Link className="underline" to="/settings">Settings</Link> so the plan and readiness meter mean something.</p>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="mb-1 flex items-baseline justify-between"><span className="text-sm font-medium">Readiness</span><span className="text-xs text-slate-500 dark:text-slate-400">{readiness.label}</span></div>
          <div className="text-3xl font-bold tabular-nums">{readiness.score}<span className="text-base text-slate-500 dark:text-slate-400">/100</span></div>
          <Progress value={readiness.score / 100} label="Readiness" />
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Accuracy {Math.round(readiness.accuracy * 100)}% · pacing {Math.round(readiness.pacing * 100)}% · coverage {Math.round(readiness.coverage * 100)}%</p>
        </Card>
        <Stat label="Questions answered" value={totalAttempts} hint={`${streak} day streak`} />
        <Stat label="Last simulation" value={lastExam ? `${Math.round((lastExam.correctCount / lastExam.questionCount) * 100)}%` : '–'} hint={lastExam?.estimatedScore ? `est. ~${lastExam.estimatedScore}` : 'No simulation yet'} />
        <Stat label="Rules due for review" value={due.length} hint={due.length ? 'Practice → Review due' : 'All caught up'} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="mb-2 font-semibold">Today's plan</h2>
          {plan ? (
            <ul className="space-y-2">
              {plan.items.map((it, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800">
                  <span>{it.label}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{it.minutes} min</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-400">Set a future test date in Settings to generate a day-by-day plan. Until then, follow the Learn modules in order and run a timed drill each day.</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <LinkButton to="/practice">Practice</LinkButton>
            <LinkButton to="/simulate" variant="secondary">Simulate</LinkButton>
            <LinkButton to="/plan" variant="ghost">Full plan</LinkButton>
          </div>
        </Card>
        <Card>
          <h2 className="mb-2 font-semibold">Weakest areas</h2>
          {readiness.weakest.length ? (
            <ul className="space-y-1 text-sm">
              {readiness.weakest.map((r) => (
                <li key={`${r.type}/${r.ruleId}`} className="flex justify-between">
                  <span>{QUESTION_TYPE_LABELS[r.type]} · {r.ruleId}</span>
                  <span className="tabular-nums text-slate-500 dark:text-slate-400">{Math.round((r.correct / r.total) * 100)}% · {Math.round(r.avgSec)}s</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-400">Answer a few questions and your weakest rules will appear here.</p>
          )}
          {trend.length > 1 && (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Last 14 days: {trend.reduce((s, d) => s + d.count, 0)} questions, {Math.round((trend.reduce((s, d) => s + d.accuracy * d.count, 0) / trend.reduce((s, d) => s + d.count, 0)) * 100)}% correct.</p>
          )}
        </Card>
      </div>
      <Disclaimer text={DISCLAIMER} />
    </div>
  )
}
