import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ALL_GENERATORS } from '../../generators'
import { LESSONS } from '../../content/lessons'
import { QUESTION_TYPE_LABELS, type Question, type QuestionType } from '../../types'
import { Button, Card, PageTitle } from '../components/ui'
import { QuestionView } from '../components/QuestionView'
import { Explanation } from '../components/Explanation'
import { randomSeed } from '../../generators/rng'

export function RulesPage() {
  const [preview, setPreview] = useState<Question | null>(null)
  return (
    <div className="space-y-4">
      <PageTitle sub="Every rule family the generators know, with a one-line summary. Tap one to see a sample item with its explanation.">Rule library</PageTitle>
      {preview && (
        <Card className="border-sky-300 dark:border-sky-800">
          <QuestionView question={preview} chosen={preview.correctOptionId} onChoose={() => {}} reveal disabled />
          <div className="mt-3"><Explanation q={preview} correct={true} /></div>
          <div className="mt-3 flex gap-2"><Button variant="secondary" onClick={() => setPreview(null)}>Close</Button><Link className="self-center text-sm underline" to={`/practice?type=${preview.type}&rule=${preview.ruleId}`}>Drill this rule</Link></div>
        </Card>
      )}
      {ALL_GENERATORS.map((g) => (
        <section key={g.type}>
          <h2 className="mb-2 text-lg font-semibold">{QUESTION_TYPE_LABELS[g.type as QuestionType]}</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {g.families.map((f) => {
              const summary = LESSONS[g.type as QuestionType].rules.find((r) => r.id === f.id)?.summary
              return (
                <li key={f.id}>
                  <button type="button" onClick={() => setPreview(g.generate(randomSeed(), 3, f.id))} className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800">
                    <div className="flex items-center justify-between"><span className="font-medium">{f.name}</span><span className="text-xs text-slate-500">from tier {f.minDifficulty}</span></div>
                    {summary && <div className="text-sm text-slate-600 dark:text-slate-400">{summary}</div>}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
