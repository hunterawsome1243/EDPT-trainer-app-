import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, type SavedExam } from '../../db/db'
import { buildExam, examTimeLimitMs } from '../../engine/exam'
import { buildReport } from '../../engine/scoring'
import { recordAttempt } from '../../db/queries'
import { estimateScore } from '../../content/reference'
import { useSettings } from '../hooks/useSettings'
import { useFocusMode } from '../hooks/useFocus'
import { Button, Card } from '../components/ui'
import { QuestionView } from '../components/QuestionView'
import { Countdown } from '../components/Timer'
import { ScratchPad } from '../components/ScratchPad'

export function ExamPage() {
  const navigate = useNavigate()
  const { settings } = useSettings()
  const [exam, setExam] = useState<SavedExam | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [unsaved, setUnsaved] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const enteredAt = useRef(Date.now())
  const submittedRef = useRef(false)

  useEffect(() => {
    db.savedExam.get('current').then((e) => {
      if (!e) navigate('/simulate', { replace: true })
      else setExam(e)
    }).catch(() => navigate('/simulate', { replace: true }))
  }, [navigate])
  useFocusMode(true)

  const questions = useMemo(() => (exam ? buildExam({ length: exam.length, seed: exam.seed }) : []), [exam?.seed, exam?.length])
  const q = exam ? questions[exam.index] : undefined
  const endsAt = exam ? exam.startedAt + examTimeLimitMs(exam.length) : 0

  const persist = useCallback((next: SavedExam) => {
    setExam(next)
    db.savedExam.put(next).then(() => setUnsaved(false)).catch(() => setUnsaved(true))
  }, [])

  const addTime = (e: SavedExam, id: string) => {
    const prev = e.answers[id] ?? { chosen: null, timeMs: 0, flagged: false }
    const spent = Date.now() - enteredAt.current
    enteredAt.current = Date.now()
    return { ...e.answers, [id]: { ...prev, timeMs: prev.timeMs + spent } }
  }

  const choose = (id: string) => {
    if (!exam || !q) return
    const prev = exam.answers[q.id] ?? { chosen: null, timeMs: 0, flagged: false }
    persist({ ...exam, answers: { ...exam.answers, [q.id]: { ...prev, chosen: id } } })
  }
  const go = (idx: number) => {
    if (!exam || !q) return
    if (exam.noBacktrack && idx < exam.index) return
    const answers = addTime(exam, q.id)
    persist({ ...exam, answers, index: Math.max(0, Math.min(questions.length - 1, idx)) })
  }
  const flag = () => {
    if (!exam || !q) return
    const prev = exam.answers[q.id] ?? { chosen: null, timeMs: 0, flagged: false }
    persist({ ...exam, answers: { ...exam.answers, [q.id]: { ...prev, flagged: !prev.flagged } } })
  }

  const submit = useCallback(async () => {
    if (!exam || submittedRef.current) return
    submittedRef.current = true
    setSubmitting(true)
    setSubmitError('')
    try {
      const answers = q ? addTime(exam, q.id) : exam.answers
      // Time used is capped at the limit: a saved exam scored after its clock ran out is not "longer".
      const totalTimeMs = Math.min(Date.now() - exam.startedAt, examTimeLimitMs(exam.length))
      const sessionId = await db.sessions.add({ mode: 'exam', length: exam.length, startedAt: exam.startedAt, questionCount: questions.length, correctCount: 0, totalTimeMs, byType: {} })
      const attempts = []
      for (const qq of questions) {
        const a = answers[qq.id]
        attempts.push(await recordAttempt(qq, a?.chosen ?? null, a?.timeMs ?? 0, sessionId))
      }
      const r = buildReport(attempts, settings.guessingPenalty)
      const est = estimateScore(r.percent)
      await db.sessions.update(sessionId, { finishedAt: Date.now(), correctCount: r.correct, estimatedScore: Math.round((est.low + est.high) / 2), byType: Object.fromEntries(Object.entries(r.byType).filter(([, v]) => v.total > 0).map(([k, v]) => [k, { correct: v.correct, total: v.total, timeMs: v.timeMs }])) })
      await db.savedExam.delete('current')
      navigate(`/report/${sessionId}`, { replace: true })
    } catch (e) {
      // Let the person retry instead of leaving the exam stuck in "Scoring…".
      submittedRef.current = false
      setSubmitting(false)
      setSubmitError(`Could not save the result: ${(e as Error).message}. Your answers are still on screen; try again.`)
    }
  }, [exam, q, questions, navigate, settings.guessingPenalty])

  // keyboard navigation
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.tagName === 'TEXTAREA') return
      if (e.key === 'ArrowRight' || e.key === 'Enter') go((exam?.index ?? 0) + 1)
      if (e.key === 'ArrowLeft') go((exam?.index ?? 0) - 1)
      if (e.key.toLowerCase() === 'f') flag()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  })

  if (!exam || !q) return <p className="p-4 text-sm text-slate-500 dark:text-slate-400">Loading exam…</p>
  const a = exam.answers[q.id]
  const answeredCount = Object.values(exam.answers).filter((x) => x.chosen !== null).length
  const flagged = questions.map((qq, k) => (exam.answers[qq.id]?.flagged ? k : -1)).filter((k) => k >= 0)
  const isLast = exam.index === questions.length - 1

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <div className="sticky z-10 -mx-4 flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
        <div className="text-sm tabular-nums"><span className="font-semibold">{exam.index + 1}</span> / {questions.length} · {answeredCount} answered{unsaved && <span className="ml-2 rounded bg-amber-200 px-1.5 py-0.5 text-xs text-amber-900 dark:bg-amber-900 dark:text-amber-100" title="Progress is not being saved; a reload will lose it">not saved</span>}</div>
        <Countdown endsAt={endsAt} onExpire={submit} />
      </div>
      <Card>
        <QuestionView question={q} chosen={a?.chosen ?? null} onChoose={choose} />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {!exam.noBacktrack && <Button variant="secondary" onClick={() => go(exam.index - 1)} disabled={exam.index === 0}>Previous</Button>}
          <Button variant="secondary" onClick={flag} aria-pressed={!!a?.flagged}>{a?.flagged ? 'Unflag' : 'Flag for review'}</Button>
          {!isLast ? <Button onClick={() => go(exam.index + 1)}>Next</Button> : <Button onClick={() => setConfirm(true)}>Finish exam</Button>}
          {!isLast && <Button variant="ghost" onClick={() => setConfirm(true)}>Finish early</Button>}
        </div>
        {!exam.noBacktrack && flagged.length > 0 && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Flagged: {flagged.map((k) => <button key={k} className="mr-1 underline" onClick={() => go(k)}>{k + 1}</button>)}</p>
        )}
      </Card>
      <ScratchPad value={exam.scratch} onChange={(v) => persist({ ...exam, scratch: v })} />
      {!exam.noBacktrack && (
        <details className="text-sm">
          <summary className="cursor-pointer text-slate-500 dark:text-slate-400">Question map</summary>
          <div className="mt-2 grid grid-cols-10 gap-1 sm:grid-cols-15">
            {questions.map((qq, k) => {
              const ans = exam.answers[qq.id]
              return (
                <button key={qq.id} onClick={() => go(k)} aria-label={`Go to question ${k + 1}${ans?.chosen ? ', answered' : ''}${ans?.flagged ? ', flagged' : ''}`} className={`h-8 rounded text-xs tabular-nums ${k === exam.index ? 'ring-2 ring-sky-500' : ''} ${ans?.flagged ? 'bg-amber-200 dark:bg-amber-900' : ans?.chosen ? 'bg-sky-200 dark:bg-sky-900' : 'bg-slate-200 dark:bg-slate-800'}`}>{k + 1}</button>
              )
            })}
          </div>
        </details>
      )}
      {confirm && (
        <div role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-w-sm">
            <h2 id="confirm-title" className="font-semibold">Submit the exam?</h2>
            {submitError && <p role="alert" className="mt-1 text-sm text-red-700 dark:text-red-300">{submitError}</p>}
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{questions.length - answeredCount} unanswered. {settings.guessingPenalty ? 'Unanswered items score zero; wrong ones subtract.' : 'There is no penalty for guessing, so consider answering everything first.'}</p>
            <div className="mt-3 flex gap-2"><Button onClick={submit} disabled={submitting}>{submitting ? 'Scoring…' : 'Submit'}</Button><Button variant="secondary" onClick={() => setConfirm(false)}>Keep going</Button></div>
          </Card>
        </div>
      )}
    </div>
  )
}
