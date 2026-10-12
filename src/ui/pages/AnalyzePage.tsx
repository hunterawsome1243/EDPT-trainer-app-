import { useSafeLiveQuery as useLiveQuery } from '../hooks/useSafeLiveQuery'
import { dailyTrend, examSessions, ruleAggregates } from '../../db/queries'
import { computeReadiness, targetPercentFor } from '../../engine/readiness'
import { CUTOFFS, SECONDS_PER_QUESTION } from '../../content/reference'
import { QUESTION_TYPES, QUESTION_TYPE_LABELS } from '../../types'
import { useSettings } from '../hooks/useSettings'
import { Card, LinkButton, PageTitle, Progress } from '../components/ui'

function LineChart({ points, yLabel, max = 1, fmt, emptyText = 'Need at least two days of data.' }: { points: { x: string; y: number }[]; yLabel: string; max?: number; fmt: (y: number) => string; emptyText?: string }) {
  if (points.length < 2) return <p className="text-sm text-slate-600 dark:text-slate-400">{emptyText}</p>
  const W = 320, H = 120, P = 24
  const xs = (i: number) => P + (i / (points.length - 1)) * (W - 2 * P)
  const ys = (y: number) => H - P - (Math.min(y, max) / max) * (H - 2 * P)
  const d = points.map((p, i) => `${i ? 'L' : 'M'} ${xs(i).toFixed(1)} ${ys(p.y).toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-md" role="img" aria-label={`${yLabel} over time: ${points.map((p) => `${p.x} ${fmt(p.y)}`).join(', ')}`}>
      <line x1={P} y1={H - P} x2={W - P} y2={H - P} stroke="currentColor" strokeOpacity={0.3} />
      <line x1={P} y1={P} x2={P} y2={H - P} stroke="currentColor" strokeOpacity={0.3} />
      <path d={d} fill="none" stroke="#0284c7" strokeWidth={2} />
      {points.map((p, i) => <circle key={p.x} cx={xs(i)} cy={ys(p.y)} r={3} fill="#0284c7"><title>{p.x}: {fmt(p.y)}</title></circle>)}
      <text x={P} y={P - 8} fontSize={9} fill="currentColor" opacity={0.7}>{fmt(max)}</text>
      <text x={P} y={H - 6} fontSize={9} fill="currentColor" opacity={0.7}>{points[0]!.x.slice(5)}</text>
      <text x={W - P} y={H - 6} fontSize={9} textAnchor="end" fill="currentColor" opacity={0.7}>{points[points.length - 1]!.x.slice(5)}</text>
    </svg>
  )
}

export function AnalyzePage() {
  const { settings } = useSettings()
  const aggs = useLiveQuery(ruleAggregates, [], [])
  const trend = useLiveQuery(() => dailyTrend(60), [], [])
  const exams = useLiveQuery(examSessions, [], [])
  const cutoff = CUTOFFS.find((c) => c.afsc === settings.targetAfsc)?.minScore ?? 71
  const target = targetPercentFor(cutoff)
  const readiness = computeReadiness(aggs, target)
  const heat = (acc: number) => (acc >= 0.85 ? 'bg-emerald-200 dark:bg-emerald-900' : acc >= 0.7 ? 'bg-lime-200 dark:bg-lime-900' : acc >= 0.5 ? 'bg-amber-200 dark:bg-amber-900' : 'bg-red-200 dark:bg-red-900')
  return (
    <div className="space-y-4">
      <PageTitle sub={`Readiness compares your accuracy and pacing with the ~${target}% you likely need for a ${cutoff} on ${settings.targetAfsc}.`}>Analyze</PageTitle>
      <Card>
        <div className="flex items-baseline justify-between"><h2 className="font-semibold">Readiness: {readiness.score}/100 · {readiness.label}</h2></div>
        <Progress value={readiness.score / 100} label="Readiness" />
        <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
          <div><div className="font-semibold">{Math.round(readiness.accuracy * 100)}%</div>accuracy</div>
          <div><div className="font-semibold">{Math.round(readiness.pacing * 100)}%</div>pacing</div>
          <div><div className="font-semibold">{Math.round(readiness.coverage * 100)}%</div>coverage</div>
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card><h2 className="mb-2 font-semibold">Daily accuracy</h2><LineChart points={trend.map((d) => ({ x: d.date, y: d.accuracy }))} yLabel="Accuracy" fmt={(y) => `${Math.round(y * 100)}%`} /></Card>
        <Card><h2 className="mb-2 font-semibold">Seconds per question</h2><LineChart points={trend.map((d) => ({ x: d.date, y: d.avgSec }))} yLabel="Seconds per question" max={120} fmt={(y) => `${Math.round(y)}s`} /><p className="text-xs text-slate-600 dark:text-slate-400">Target: under {Math.round(SECONDS_PER_QUESTION)}s.</p></Card>
      </div>
      {exams.length > 0 && (
        <Card>
          <h2 className="mb-2 font-semibold">Simulation scores</h2>
          <LineChart points={exams.map((s) => ({ x: new Date(s.startedAt).toISOString().slice(0, 10), y: s.correctCount / s.questionCount }))} yLabel="Simulation accuracy" fmt={(y) => `${Math.round(y * 100)}%`} emptyText="Complete two simulations to see a trend." />
        </Card>
      )}
      <Card>
        <h2 className="mb-2 font-semibold">Rule heatmap</h2>
        {aggs.length === 0 ? <p className="text-sm text-slate-600 dark:text-slate-400">No attempts yet.</p> : QUESTION_TYPES.map((t) => {
          const rs = aggs.filter((r) => r.type === t).sort((a, b) => a.correct / a.total - b.correct / b.total)
          if (!rs.length) return null
          return (
            <div key={t} className="mb-3">
              <h3 className="mb-1 text-sm font-semibold">{QUESTION_TYPE_LABELS[t]}</h3>
              <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                {rs.map((r) => (
                  <div key={r.ruleId} className={`flex items-center justify-between rounded px-2 py-1 text-xs ${heat(r.correct / r.total)}`}>
                    <span className="font-mono">{r.ruleId}</span>
                    <span className="tabular-nums">{Math.round((r.correct / r.total) * 100)}% · {Math.round(r.avgSec)}s · n={r.total}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </Card>
      <div className="flex gap-2"><LinkButton to="/plan" variant="secondary">Study plan</LinkButton><LinkButton to="/practice">Practice weak areas</LinkButton></div>
    </div>
  )
}
