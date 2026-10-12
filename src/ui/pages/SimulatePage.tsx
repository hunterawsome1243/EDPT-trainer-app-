import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '../../db/db'
import { examSessions } from '../../db/queries'
import { EXAM, DISCLAIMER } from '../../content/reference'
import { randomSeed } from '../../generators/rng'
import { useSettings } from '../hooks/useSettings'
import { Button, Card, Disclaimer, PageTitle } from '../components/ui'

export function SimulatePage() {
  const navigate = useNavigate()
  const { settings, update } = useSettings()
  const saved = useLiveQuery(() => db.savedExam.get('current'), [])
  const past = useLiveQuery(examSessions, [], [])
  const start = async (length: number) => {
    await db.savedExam.put({ id: 'current', seed: randomSeed(), length, startedAt: Date.now(), index: 0, answers: {}, scratch: '', noBacktrack: settings.noBacktrack })
    navigate('/simulate/exam')
  }
  const lengths = [
    { v: 1, label: 'Full length', desc: `${EXAM.questionCount} questions · ${EXAM.timeLimitMinutes} min` },
    { v: 0.5, label: 'Half length', desc: `${EXAM.questionCount / 2} questions · ${EXAM.timeLimitMinutes / 2} min` },
    { v: 0.25, label: 'Quarter length', desc: `${EXAM.questionCount / 4} questions · ${Math.round(EXAM.timeLimitMinutes / 4)} min` },
  ]
  return (
    <div className="space-y-4">
      <PageTitle sub="Real format, real clock, no feedback until the end. Treat it like test day: quiet room, scratch paper, no calculator.">Simulate</PageTitle>
      {saved && (
        <Card className="border-amber-300 dark:border-amber-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><div className="font-semibold">Exam in progress</div><div className="text-sm text-slate-600 dark:text-slate-400">Started {new Date(saved.startedAt).toLocaleString()} · question {saved.index + 1}. The clock kept running.</div></div>
            <div className="flex gap-2"><Button onClick={() => navigate('/simulate/exam')}>Resume</Button><Button variant="danger" onClick={() => db.savedExam.delete('current')}>Discard</Button></div>
          </div>
        </Card>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        {lengths.map((l) => (
          <Card key={l.v} as="div">
            <div className="font-semibold">{l.label}</div>
            <div className="mb-3 text-sm text-slate-600 dark:text-slate-400">{l.desc}</div>
            <Button onClick={() => start(l.v)} disabled={!!saved}>Start</Button>
          </Card>
        ))}
      </div>
      <Card>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={settings.noBacktrack} onChange={(e) => update('noBacktrack', e.target.checked)} /> No backtracking (cannot return to earlier questions)</label>
        <p className="mt-1 text-xs text-slate-500">Scoring model: {settings.guessingPenalty ? 'wrong answers subtract ¼ point' : 'no penalty for wrong answers'} (change in Settings).</p>
      </Card>
      {past.length > 0 && (
        <Card>
          <h2 className="mb-2 font-semibold">Past simulations</h2>
          <ul className="text-sm">
            {[...past].reverse().map((s) => (
              <li key={s.id} className="flex items-center justify-between border-t border-slate-200 py-1 first:border-0 dark:border-slate-800">
                <span>{new Date(s.startedAt).toLocaleDateString()} · {s.length === 1 ? 'Full' : s.length === 0.5 ? 'Half' : 'Quarter'}</span>
                <span className="tabular-nums">{Math.round((s.correctCount / s.questionCount) * 100)}% {s.estimatedScore ? `· est. ~${s.estimatedScore}` : ''} <button className="ml-2 underline" onClick={() => navigate(`/report/${s.id}`)}>Report</button></span>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Disclaimer text={DISCLAIMER} />
    </div>
  )
}
