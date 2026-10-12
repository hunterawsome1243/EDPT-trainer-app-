import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { db } from '../../db/db'
import { autoDifficulty, recentMistakes, recordAttempt, ruleAggregates } from '../../db/queries'
import { generateQuestion, questionFromId } from '../../generators'
import { randomSeed } from '../../generators/rng'
import { dueRules } from '../../engine/spaced'
import type { Attempt, Difficulty, Question, QuestionType } from '../../types'
import { QUESTION_TYPE_LABELS } from '../../types'
import { buildReport } from '../../engine/scoring'
import type { PracticeConfig } from './PracticePage'
import { Button, Card, LinkButton, PageTitle, fmtTime, pct } from '../components/ui'
import { QuestionView } from '../components/QuestionView'
import { Explanation } from '../components/Explanation'
import { Countdown, Stopwatch } from '../components/Timer'
import { ScratchPad } from '../components/ScratchPad'
import { useSettings } from '../hooks/useSettings'

async function buildQuestions(cfg: PracticeConfig): Promise<Question[]> {
  const out: Question[] = []
  const d = async (t: QuestionType): Promise<Difficulty> => (cfg.difficulty === 'auto' ? autoDifficulty(t) : cfg.difficulty)
  if (cfg.source === 'mistakes') {
    const m = await recentMistakes(cfg.count)
    for (const a of m) {
      try { out.push(questionFromId(a.questionId)) } catch { /* rule removed */ }
    }
  } else if (cfg.source === 'review') {
    const due = dueRules(await db.reviews.toArray(), Date.now())
    const keys = due.length ? due.map((r) => r.key) : []
    for (let i = 0; keys.length && out.length < cfg.count; i++) {
      const [t, rule] = keys[i % keys.length]!.split('/') as [QuestionType, string]
      out.push(generateQuestion(t, randomSeed(), await d(t), rule))
    }
  } else if (cfg.source === 'weak') {
    const aggs = (await ruleAggregates()).filter((r) => cfg.types.includes(r.type) && r.total >= 2).sort((a, b) => a.correct / a.total - b.correct / b.total)
    const weak = aggs.slice(0, 6)
    for (let i = 0; weak.length && out.length < cfg.count; i++) {
      const r = weak[i % weak.length]!
      out.push(generateQuestion(r.type, randomSeed(), await d(r.type), r.ruleId))
    }
  }
  // fill with new questions (also the 'new' source and any empty fallback)
  const types = cfg.types.length ? cfg.types : (['number-sequence'] as QuestionType[])
  const diffs = new Map<QuestionType, Difficulty>()
  for (const t of types) diffs.set(t, await d(t))
  for (let i = 0; out.length < cfg.count; i++) {
    const t = types[i % types.length]!
    out.push(generateQuestion(t, randomSeed(), diffs.get(t)!, cfg.ruleId))
  }
  return out
}

export function PracticeSessionPage() {
  const navigate = useNavigate()
  const loc = useLocation()
  const cfg = loc.state as PracticeConfig | null
  const { settings } = useSettings()
  const [qs, setQs] = useState<Question[] | null>(null)
  const [i, setI] = useState(0)
  const [chosen, setChosen] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [scratch, setScratch] = useState('')
  const [startedAt, setStartedAt] = useState(Date.now())
  const sessionId = useRef<number | undefined>(undefined)
  const sessionStart = useRef(Date.now())

  useEffect(() => {
    if (!cfg) { navigate('/practice', { replace: true }); return }
    buildQuestions(cfg).then((q) => { setQs(q); setStartedAt(Date.now()) })
    db.sessions.add({ mode: cfg.timing === 'per-question' ? 'timed-practice' : 'practice', startedAt: Date.now(), questionCount: cfg.count, correctCount: 0, totalTimeMs: 0, byType: {} }).then((id) => { sessionId.current = id })
  }, [cfg, navigate])

  const q = qs?.[i]
  const done = qs !== null && i >= qs.length

  const commit = useCallback(async (choice: string | null) => {
    if (!q || revealed) return
    const a = await recordAttempt(q, choice, Date.now() - startedAt, sessionId.current)
    setAttempts((x) => [...x, a])
    setRevealed(true)
    if (!cfg?.instantFeedback) {
      setI((x) => x + 1); setChosen(null); setRevealed(false); setStartedAt(Date.now())
    }
  }, [q, revealed, startedAt, cfg])

  const next = () => { setI((x) => x + 1); setChosen(null); setRevealed(false); setStartedAt(Date.now()) }

  // finalize session record
  useEffect(() => {
    if (!done || sessionId.current === undefined) return
    const r = buildReport(attempts, settings.guessingPenalty)
    db.sessions.update(sessionId.current, { finishedAt: Date.now(), questionCount: attempts.length, correctCount: r.correct, totalTimeMs: Date.now() - sessionStart.current, byType: Object.fromEntries(Object.entries(r.byType).filter(([, v]) => v.total > 0).map(([k, v]) => [k, { correct: v.correct, total: v.total, timeMs: v.timeMs }])) })
  }, [done, attempts, settings.guessingPenalty])

  // keyboard: Enter submits / advances
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.tagName === 'TEXTAREA') return
      if (e.key === 'Enter') {
        if (!revealed && chosen !== null) commit(chosen)
        else if (revealed) next()
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [revealed, chosen, commit])

  if (!cfg) return null
  if (!qs) return <p className="p-4 text-sm text-slate-500">Preparing questions…</p>

  if (done) {
    const r = buildReport(attempts, settings.guessingPenalty)
    return (
      <div className="space-y-4">
        <PageTitle>Session complete</PageTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          <Card><div className="text-xs text-slate-500">Score</div><div className="text-2xl font-bold">{r.correct} / {r.total} ({Math.round(r.percent)}%)</div></Card>
          <Card><div className="text-xs text-slate-500">Average time</div><div className="text-2xl font-bold">{r.total ? Math.round(r.totalTimeMs / r.total / 1000) : 0}s</div></Card>
          <Card><div className="text-xs text-slate-500">Right but slow</div><div className="text-2xl font-bold">{r.rightButSlow.length}</div></Card>
        </div>
        {r.missedRules.length > 0 && (
          <Card>
            <h2 className="mb-1 font-semibold">Rules missed</h2>
            <ul className="text-sm">{r.missedRules.map((m) => <li key={`${m.type}/${m.ruleId}`}>{QUESTION_TYPE_LABELS[m.type]} · <span className="font-mono">{m.ruleId}</span> × {m.missed}</li>)}</ul>
          </Card>
        )}
        <Card>
          <h2 className="mb-2 font-semibold">Review each question</h2>
          <ol className="space-y-4">
            {qs.map((qq, k) => {
              const a = attempts[k]
              return (
                <li key={qq.id} className="border-t border-slate-200 pt-3 first:border-0 first:pt-0 dark:border-slate-800">
                  <QuestionView question={qq} chosen={a?.chosenOptionId ?? null} onChoose={() => {}} reveal disabled index={k} total={qs.length} />
                  <div className="mt-2"><Explanation q={qq} correct={a ? (a.chosenOptionId === null ? null : a.correct) : null} /></div>
                  {a && <div className="mt-1 text-xs text-slate-500">Time: {fmtTime(a.timeMs)}</div>}
                </li>
              )
            })}
          </ol>
        </Card>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigate('/practice/session', { state: cfg, replace: true })}>Again</Button>
          <LinkButton to="/practice" variant="secondary">Change settings</LinkButton>
          <LinkButton to="/analyze" variant="ghost">Analytics</LinkButton>
        </div>
      </div>
    )
  }

  if (!q) return null
  const answered = attempts.length
  const correctSoFar = attempts.filter((a) => a.correct).length
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" onClick={() => navigate('/practice')}>Quit</Button>
        <div className="text-sm tabular-nums text-slate-500">{pct(correctSoFar, answered)} so far</div>
        {cfg.timing === 'per-question' && !revealed ? <Countdown key={q.id} endsAt={startedAt + cfg.secondsPerQuestion * 1000} onExpire={() => commit(chosen)} warnAtMs={10_000} /> : <Stopwatch startedAt={startedAt} />}
      </div>
      <Card>
        <QuestionView question={q} chosen={chosen} onChoose={(id) => !revealed && setChosen(id)} reveal={revealed} disabled={revealed} index={i} total={qs.length} />
        {revealed && <div className="mt-3"><Explanation q={q} correct={chosen === null ? null : chosen === q.correctOptionId} /></div>}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {!revealed ? (
            <>
              <Button onClick={() => commit(chosen)} disabled={chosen === null}>Submit</Button>
              <Button variant="secondary" onClick={() => commit(null)}>Skip</Button>
            </>
          ) : (
            <Button onClick={next}>{i + 1 < qs.length ? 'Next' : 'Finish'}</Button>
          )}
          <span className="text-xs text-slate-500">Keys: A–E to choose, Enter to submit</span>
        </div>
      </Card>
      <ScratchPad value={scratch} onChange={setScratch} />
    </div>
  )
}
