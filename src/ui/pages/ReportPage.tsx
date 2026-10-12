import { useSafeLiveQuery as useLiveQuery } from '../hooks/useSafeLiveQuery'
import { useParams } from 'react-router-dom'
import { db } from '../../db/db'
import { buildReport } from '../../engine/scoring'
import { questionFromId } from '../../generators'
import { CUTOFFS, DISCLAIMER, SECONDS_PER_QUESTION } from '../../content/reference'
import { QUESTION_TYPES, QUESTION_TYPE_LABELS } from '../../types'
import { useSettings } from '../hooks/useSettings'
import { Card, Disclaimer, LinkButton, PageTitle, Stat, fmtTime, pct } from '../components/ui'
import { QuestionView } from '../components/QuestionView'
import { Explanation } from '../components/Explanation'

export function ReportPage() {
  const { id } = useParams()
  const { settings } = useSettings()
  const sid = Number(id)
  const session = useLiveQuery(() => db.sessions.get(sid), [sid])
  const attempts = useLiveQuery(() => db.attempts.where('sessionId').equals(sid).toArray(), [sid], [])
  if (!session) return <p className="text-sm text-slate-600 dark:text-slate-400">Loading report…</p>
  const r = buildReport(attempts, settings.guessingPenalty)
  const cutoff = CUTOFFS.find((c) => c.afsc === settings.targetAfsc)
  const wrong = attempts.filter((a) => !a.correct)
  return (
    <div className="space-y-4">
      <PageTitle sub={`${session.mode === 'exam' ? (session.length === 1 ? 'Full-length' : session.length === 0.5 ? 'Half-length' : 'Quarter-length') + ' simulation' : 'Practice session'} · ${new Date(session.startedAt).toLocaleString()}`}>Report</PageTitle>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Raw score" value={`${r.raw} / ${r.total}`} hint={`${Math.round(r.percent)}% · ${r.skipped} skipped`} />
        <Stat label="Estimated EDPT band" value={`${r.estimate.low}–${r.estimate.high}`} hint={cutoff ? `${cutoff.afsc} cutoff ${cutoff.minScore}` : 'estimate only'} />
        <Stat label="Time used" value={fmtTime(session.totalTimeMs)} hint={`${r.total ? Math.round(r.totalTimeMs / r.total / 1000) : 0}s per question`} />
        <Stat label="Right but slow" value={r.rightButSlow.length} hint={`over ${Math.round(SECONDS_PER_QUESTION * 1.5)}s`} />
      </div>
      <Card>
        <h2 className="mb-2 font-semibold">By section</h2>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-600 dark:text-slate-400"><th className="py-1">Section</th><th className="text-right">Correct</th><th className="text-right">Accuracy</th><th className="text-right">Avg time</th></tr></thead>
          <tbody>
            {QUESTION_TYPES.filter((t) => r.byType[t].total > 0).map((t) => {
              const s = r.byType[t]
              return <tr key={t} className="border-t border-slate-200 dark:border-slate-800"><td className="py-1">{QUESTION_TYPE_LABELS[t]}</td><td className="text-right tabular-nums">{s.correct}/{s.total}</td><td className="text-right tabular-nums">{pct(s.correct, s.total)}</td><td className={`text-right tabular-nums ${s.avgSec > SECONDS_PER_QUESTION ? 'text-amber-700 dark:text-amber-300' : ''}`}>{Math.round(s.avgSec)}s</td></tr>
            })}
          </tbody>
        </table>
      </Card>
      {r.missedRules.length > 0 && (
        <Card>
          <h2 className="mb-2 font-semibold">Rules missed</h2>
          <ul className="grid gap-1 text-sm sm:grid-cols-2">{r.missedRules.map((m) => <li key={`${m.type}/${m.ruleId}`} className="flex justify-between rounded bg-slate-100 px-2 py-1 dark:bg-slate-800"><span>{QUESTION_TYPE_LABELS[m.type]} · <span className="font-mono text-xs">{m.ruleId}</span></span><span className="tabular-nums">× {m.missed}</span></li>)}</ul>
          <div className="mt-3"><LinkButton to="/practice" variant="secondary">Drill these (Practice → Re-do mistakes)</LinkButton></div>
        </Card>
      )}
      {wrong.length > 0 && (
        <Card>
          <h2 className="mb-2 font-semibold">Missed questions</h2>
          <ol className="space-y-4">
            {wrong.map((a) => {
              let q
              try { q = questionFromId(a.questionId) } catch { return null }
              return (
                <li key={a.id} className="border-t border-slate-200 pt-3 first:border-0 first:pt-0 dark:border-slate-800">
                  <QuestionView question={q} chosen={a.chosenOptionId} onChoose={() => {}} reveal disabled />
                  <div className="mt-2"><Explanation q={q} correct={a.chosenOptionId === null ? null : false} /></div>
                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">Time: {fmtTime(a.timeMs)}</div>
                </li>
              )
            })}
          </ol>
        </Card>
      )}
      <div className="flex gap-2"><LinkButton to="/simulate">Back to Simulate</LinkButton><LinkButton to="/analyze" variant="secondary">Analytics</LinkButton></div>
      <Disclaimer text={DISCLAIMER} />
    </div>
  )
}
