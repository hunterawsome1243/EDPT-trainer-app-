import { useState } from 'react'
import { useSafeLiveQuery as useLiveQuery } from '../hooks/useSafeLiveQuery'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { db } from '../../db/db'
import { recentMistakes } from '../../db/queries'
import { dueRules } from '../../engine/spaced'
import { QUESTION_TYPES, QUESTION_TYPE_LABELS, type QuestionType } from '../../types'
import { SECONDS_PER_QUESTION } from '../../content/reference'
import { Button, Card, Field, PageTitle, inputCls } from '../components/ui'

export interface PracticeConfig {
  types: QuestionType[]
  source: 'new' | 'weak' | 'review' | 'mistakes'
  timing: 'untimed' | 'per-question'
  secondsPerQuestion: number
  difficulty: 'auto' | 1 | 2 | 3 | 4 | 5
  count: number
  ruleId?: string
  instantFeedback: boolean
}

export function PracticePage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const presetType = params.get('type') as QuestionType | null
  const presetRule = params.get('rule') ?? undefined
  const [cfg, setCfg] = useState<PracticeConfig>({
    types: presetType && QUESTION_TYPES.includes(presetType) ? [presetType] : [...QUESTION_TYPES],
    source: 'new',
    timing: 'untimed',
    secondsPerQuestion: Math.round(SECONDS_PER_QUESTION),
    difficulty: 'auto',
    count: 10,
    ruleId: presetRule,
    instantFeedback: true,
  })
  const due = useLiveQuery(async () => dueRules(await db.reviews.toArray(), Date.now()).length, [], 0)
  const mistakes = useLiveQuery(() => recentMistakes().then((m) => m.length), [], 0)
  const toggleType = (t: QuestionType) => setCfg((c) => ({ ...c, types: c.types.includes(t) ? c.types.filter((x) => x !== t) : [...c.types, t], ruleId: undefined }))
  const start = () => navigate('/practice/session', { state: cfg })
  const presets: { label: string; apply: Partial<PracticeConfig> }[] = [
    { label: 'Quick 10, untimed', apply: { source: 'new', timing: 'untimed', count: 10, instantFeedback: true } },
    { label: 'Timed 20, test pace', apply: { source: 'new', timing: 'per-question', count: 20, instantFeedback: false } },
    { label: `Review due (${due})`, apply: { source: 'review', timing: 'untimed', count: Math.max(5, Math.min(20, due)), instantFeedback: true } },
    { label: `Redo mistakes (${mistakes})`, apply: { source: 'mistakes', timing: 'untimed', count: Math.max(5, Math.min(20, mistakes)), instantFeedback: true } },
    { label: 'Weak areas only', apply: { source: 'weak', timing: 'per-question', count: 15, instantFeedback: true } },
  ]
  return (
    <div className="space-y-4">
      <PageTitle sub="Pick what to drill and how. Untimed with instant feedback to learn; timed without feedback to rehearse.">Practice</PageTitle>
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <Button key={p.label} variant="secondary" onClick={() => setCfg((c) => ({ ...c, ...p.apply }))}>{p.label}</Button>
        ))}
      </div>
      <Card>
        <h2 className="mb-2 font-semibold">Question types</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          {QUESTION_TYPES.map((t) => (
            <label key={t} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${cfg.types.includes(t) ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40' : 'border-slate-300 dark:border-slate-700'}`}>
              <input type="checkbox" checked={cfg.types.includes(t)} onChange={() => toggleType(t)} className="h-4 w-4" disabled={cfg.source !== 'new' && cfg.source !== 'weak'} />
              {QUESTION_TYPE_LABELS[t]}
            </label>
          ))}
        </div>
        {cfg.ruleId && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Drilling a single rule: <span className="font-mono">{cfg.ruleId}</span>. <button className="underline" onClick={() => setCfg((c) => ({ ...c, ruleId: undefined }))}>Clear</button></p>}
      </Card>
      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Source">
            <select className={inputCls} value={cfg.source} onChange={(e) => setCfg((c) => ({ ...c, source: e.target.value as PracticeConfig['source'] }))}>
              <option value="new">New questions</option>
              <option value="weak">Weakest rules only</option>
              <option value="review">Rules due for spaced review ({due})</option>
              <option value="mistakes">Re-do recent mistakes ({mistakes})</option>
            </select>
          </Field>
          <Field label="Timing">
            <select className={inputCls} value={cfg.timing} onChange={(e) => setCfg((c) => ({ ...c, timing: e.target.value as PracticeConfig['timing'] }))}>
              <option value="untimed">Untimed</option>
              <option value="per-question">Timed per question</option>
            </select>
          </Field>
          {cfg.timing === 'per-question' && (
            <Field label="Seconds per question" hint={`Test pace is about ${Math.round(SECONDS_PER_QUESTION)} s.`}>
              <input type="number" min={10} max={300} className={inputCls} value={cfg.secondsPerQuestion} onChange={(e) => setCfg((c) => ({ ...c, secondsPerQuestion: Number(e.target.value) || 45 }))} />
            </Field>
          )}
          <Field label="Difficulty">
            <select className={inputCls} value={String(cfg.difficulty)} onChange={(e) => setCfg((c) => ({ ...c, difficulty: e.target.value === 'auto' ? 'auto' : (Number(e.target.value) as 1 | 2 | 3 | 4 | 5) }))}>
              <option value="auto">Auto (adapts to your results)</option>
              {[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Number of questions">
            <input type="number" min={1} max={60} className={inputCls} value={cfg.count} onChange={(e) => setCfg((c) => ({ ...c, count: Math.max(1, Math.min(60, Number(e.target.value) || 10)) }))} />
          </Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={cfg.instantFeedback} onChange={(e) => setCfg((c) => ({ ...c, instantFeedback: e.target.checked }))} /> Show the explanation after each answer</label>
        </div>
        <div className="mt-4"><Button onClick={start} disabled={cfg.types.length === 0}>Start</Button></div>
      </Card>
    </div>
  )
}
