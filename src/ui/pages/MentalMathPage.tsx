import { useEffect, useRef, useState } from 'react'
import { useSafeLiveQuery as useLiveQuery } from '../hooks/useSafeLiveQuery'
import { db } from '../../db/db'
import { MENTAL_DRILLS, checkAnswer, resolveAnswer, type MentalDrill, type MentalItem } from '../../content/mentalMath'
import { createRng, randomSeed } from '../../generators/rng'
import { Button, Card, PageTitle, inputCls } from '../components/ui'

export function MentalMathPage() {
  const [active, setActive] = useState<MentalDrill | null>(null)
  const history = useLiveQuery(() => db.mentalMath.orderBy('at').reverse().limit(10).toArray(), [], [])
  return (
    <div className="space-y-4">
      <PageTitle sub="Short timed drills. Type the answer and press Enter. Aim for speed first, then accuracy.">Mental-math drills</PageTitle>
      {active ? (
        <Drill drill={active} onDone={() => setActive(null)} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {MENTAL_DRILLS.map((d) => (
            <Card key={d.id} as="div">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{d.name}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">{d.description} {d.seconds} seconds.</div>
                </div>
                <Button onClick={() => setActive(d)}>Start</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      {!active && history.length > 0 && (
        <Card>
          <h2 className="mb-2 font-semibold">Recent results</h2>
          <ul className="text-sm">
            {history.map((h) => (
              <li key={h.id} className="flex justify-between border-t border-slate-200 py-1 first:border-0 dark:border-slate-800">
                <span>{MENTAL_DRILLS.find((d) => d.id === h.drill)?.name ?? h.drill}</span>
                <span className="tabular-nums text-slate-500 dark:text-slate-400">{h.correct}/{h.total} in {h.seconds}s</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

function Drill({ drill, onDone }: { drill: MentalDrill; onDone: () => void }) {
  const rng = useRef(createRng(randomSeed()))
  const [item, setItem] = useState<MentalItem>(() => drill.make(rng.current))
  const [input, setInput] = useState('')
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [left, setLeft] = useState(drill.seconds)
  const [finished, setFinished] = useState(false)
  const [last, setLast] = useState<string | null>(null)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    ref.current?.focus()
    const id = setInterval(() => setLeft((l) => l - 1), 1000)
    return () => clearInterval(id)
  }, [])
  useEffect(() => {
    if (left <= 0 && !finished) {
      setFinished(true)
      db.mentalMath.add({ drill: drill.id, correct: score.correct, total: score.total, seconds: drill.seconds, at: Date.now() })
    }
  }, [left, finished, drill, score])
  const submit = () => {
    if (!input.trim()) return
    const ok = checkAnswer(item, input)
    setScore((s) => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }))
    setLast(ok ? 'Correct' : `${item.prompt} = ${resolveAnswer(item)}`)
    setItem(drill.make(rng.current))
    setInput('')
  }
  if (finished)
    return (
      <Card>
        <h2 className="text-lg font-semibold">{drill.name}: {score.correct} / {score.total}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">{score.total ? `${Math.round((drill.seconds / score.total) * 10) / 10} seconds per item.` : 'No answers recorded.'}</p>
        <div className="mt-3 flex gap-2"><Button onClick={onDone}>Back</Button></div>
      </Card>
    )
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-semibold">{drill.name}</span>
        <span role="timer" className="font-mono tabular-nums">{left}s</span>
      </div>
      <div className="mb-3 text-3xl font-bold" aria-live="polite">{item.prompt}</div>
      <form onSubmit={(e) => { e.preventDefault(); submit() }} className="flex gap-2">
        <input ref={ref} value={input} onChange={(e) => setInput(e.target.value)} inputMode={drill.id === 'alphabet' ? 'text' : 'decimal'} aria-label="Your answer" className={inputCls} autoComplete="off" />
        <Button type="submit">Enter</Button>
      </form>
      <div className="mt-2 flex justify-between text-sm">
        <span aria-live="polite" className={last === 'Correct' ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}>{last}</span>
        <span className="tabular-nums text-slate-500 dark:text-slate-400">{score.correct}/{score.total}</span>
      </div>
      <Button variant="ghost" className="mt-2" onClick={onDone}>Quit</Button>
    </Card>
  )
}
