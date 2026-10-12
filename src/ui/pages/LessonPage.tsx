import { useEffect, useMemo, useRef, useState } from 'react'
import { useSafeLiveQuery as useLiveQuery } from '../hooks/useSafeLiveQuery'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { db } from '../../db/db'
import { LESSONS, LESSON_ORDER } from '../../content/lessons'
import { generateQuestion } from '../../generators'
import { randomSeed } from '../../generators/rng'
import { recordAttempt } from '../../db/queries'
import type { Difficulty, Question, QuestionType } from '../../types'
import { Button, Card, PageTitle } from '../components/ui'
import { QuestionView } from '../components/QuestionView'
import { Explanation } from '../components/Explanation'

const MASTERY_COUNT = 10
const MASTERY_PASS = 0.7

export function LessonPage() {
  const { type } = useParams()
  const lesson = LESSONS[type as QuestionType]
  const progress = useLiveQuery(() => (type ? db.lessons.get(type as QuestionType) : undefined), [type])
  useEffect(() => {
    if (!lesson) return
    db.lessons.get(lesson.type).then((p) => {
      if (!p) return db.lessons.put({ type: lesson.type, tier: 1, readAt: Date.now() })
      if (!p.readAt) return db.lessons.put({ ...p, readAt: Date.now() })
    }).catch(() => {})
  }, [lesson])
  if (!lesson) return <p>Unknown module.</p>
  const idx = LESSON_ORDER.indexOf(lesson.type)
  const next = LESSON_ORDER[idx + 1]
  const tier = progress?.tier ?? 1
  return (
    <article className="space-y-5">
      <PageTitle sub={lesson.intro}>{lesson.title}</PageTitle>
      {lesson.sections.map((s) => (
        <section key={s.heading}>
          <h2 className="mb-1 text-lg font-semibold">{s.heading}</h2>
          {s.paragraphs.map((p, i) => <p key={i} className="mb-2 text-sm leading-relaxed">{p}</p>)}
          {s.bullets && <ul className="list-disc space-y-1 pl-5 text-sm">{s.bullets.map((b) => <li key={b}>{b}</li>)}</ul>}
        </section>
      ))}
      <section>
        <h2 className="mb-2 text-lg font-semibold">Worked examples</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {lesson.examples.map((e) => (
            <Card key={e.stem} as="div">
              <div className="font-mono text-sm font-semibold">{e.stem}</div>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">{e.steps.map((st) => <li key={st}>{st}</li>)}</ol>
              <div className="mt-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">Answer: {e.answer}</div>
            </Card>
          ))}
        </div>
      </section>
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <h2 className="mb-1 font-semibold">Spot it in 10 seconds</h2>
          <ol className="list-decimal space-y-1 pl-5 text-sm">{lesson.checklist.map((c) => <li key={c}>{c}</li>)}</ol>
        </Card>
        <Card>
          <h2 className="mb-1 font-semibold">Common traps</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">{lesson.traps.map((c) => <li key={c}>{c}</li>)}</ul>
        </Card>
      </div>
      <section>
        <h2 className="mb-2 text-lg font-semibold">Rules in this module</h2>
        <ul className="grid gap-1 text-sm sm:grid-cols-2">{lesson.rules.map((r) => <li key={r.id} className="rounded bg-slate-100 px-2 py-1 dark:bg-slate-800"><span className="font-mono text-xs text-slate-600 dark:text-slate-400">{r.id}</span> · {r.summary}</li>)}</ul>
      </section>
      <MasteryCheck type={lesson.type} tier={tier} next={next} />
    </article>
  )
}

function MasteryCheck({ type, tier, next }: { type: QuestionType; tier: number; next?: QuestionType }) {
  const navigate = useNavigate()
  const [qs, setQs] = useState<Question[] | null>(null)
  const [i, setI] = useState(0)
  const [chosen, setChosen] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  // Results are keyed by question index so a duplicate submit can never change the count.
  const [results, setResults] = useState<(boolean | undefined)[]>([])
  const [startedAt, setStartedAt] = useState(0)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const inFlight = useRef(false)
  // The tier this run was started at, and whether its unlock has been written: the unlock effect
  // must run once per completed check, not again when the live `tier` value changes under it.
  const runTier = useRef(tier)
  const unlockSaved = useRef(false)
  const d = Math.min(5, tier) as Difficulty
  const start = () => {
    runTier.current = tier
    unlockSaved.current = false
    setQs(Array.from({ length: MASTERY_COUNT }, () => generateQuestion(type, randomSeed(), d)))
    setI(0); setChosen(null); setRevealed(false); setResults([]); setStartedAt(Date.now()); setNote(''); inFlight.current = false
  }
  const q = qs?.[i]
  const done = qs && i >= qs.length
  const correctCount = results.filter((r) => r === true).length
  const passed = useMemo(() => !!done && correctCount / MASTERY_COUNT >= MASTERY_PASS, [done, correctCount])
  useEffect(() => {
    if (!done || !passed || unlockSaved.current) return
    unlockSaved.current = true
    const unlocked = Math.min(5, runTier.current + 1)
    db.lessons.get(type).then((p) => db.lessons.put({ type, tier: Math.max(p?.tier ?? 1, unlocked), readAt: p?.readAt ?? Date.now(), masteryPassedAt: Date.now() })).catch(() => setNote('Passed, but the result could not be saved (storage is unavailable).'))
  }, [done, passed, type])
  const submit = async () => {
    if (!q || chosen === null || revealed || inFlight.current) return
    inFlight.current = true
    setBusy(true)
    const correct = chosen === q.correctOptionId
    const idx = i
    try {
      await recordAttempt(q, chosen, Date.now() - startedAt)
    } catch {
      setNote('Answers are not being saved (storage is unavailable).')
    }
    setResults((r) => { const n = r.slice(); n[idx] = correct; return n })
    setRevealed(true)
    setBusy(false)
  }
  const nextQ = () => { inFlight.current = false; setI((x) => x + 1); setChosen(null); setRevealed(false); setStartedAt(Date.now()) }
  return (
    <Card className="border-sky-300 dark:border-sky-800">
      <h2 className="font-semibold">Mastery check · tier {tier}</h2>
      <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">{MASTERY_COUNT} questions at difficulty {d}. Score {Math.round(MASTERY_PASS * 100)}% or better to unlock the next tier{tier >= 5 ? ' (already at the top tier)' : ''}.</p>
      {!qs && <Button onClick={start}>Start mastery check</Button>}
      {q && !done && (
        <div className="space-y-3">
          <QuestionView question={q} chosen={chosen} onChoose={(id) => !revealed && !busy && setChosen(id)} reveal={revealed} disabled={revealed || busy} index={i} total={qs!.length} />
          {revealed && <Explanation q={q} correct={chosen === q.correctOptionId} />}
          {note && <p className="text-sm text-amber-700 dark:text-amber-300">{note}</p>}
          <div className="flex gap-2">
            {!revealed ? <Button onClick={submit} disabled={chosen === null || busy}>Check</Button> : <Button onClick={nextQ}>{i + 1 < qs!.length ? 'Next' : 'Finish'}</Button>}
          </div>
        </div>
      )}
      {done && (
        <div className="space-y-2">
          <p className="text-lg font-semibold">{correctCount} / {MASTERY_COUNT} correct · {passed ? 'Passed' : 'Not yet'}</p>
          {note && <p className="text-sm text-amber-700 dark:text-amber-300">{note}</p>}
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={start}>Try again</Button>
            {passed && next && <Button onClick={() => navigate(`/learn/${next}`)}>Next module: {LESSONS[next].title}</Button>}
            {!passed && <Link className="self-center text-sm underline" to={`/practice?type=${type}`}>Drill this type</Link>}
          </div>
        </div>
      )}
    </Card>
  )
}
