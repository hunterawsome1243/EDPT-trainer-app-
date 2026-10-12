import { CUTOFFS, DISCLAIMER, EXAM, SECONDS_PER_QUESTION } from '../../content/reference'
import { Card, Disclaimer, PageTitle } from '../components/ui'

export function ReferencePage() {
  return (
    <div className="space-y-4">
      <PageTitle>Exam facts</PageTitle>
      <Disclaimer text={DISCLAIMER} />
      <Card>
        <h2 className="mb-2 font-semibold">{EXAM.name}</h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div><dt className="text-slate-500 dark:text-slate-400">Questions</dt><dd className="font-semibold">about {EXAM.questionCount}</dd></div>
          <div><dt className="text-slate-500 dark:text-slate-400">Time</dt><dd className="font-semibold">about {EXAM.timeLimitMinutes} minutes ({Math.round(SECONDS_PER_QUESTION)} s per item)</dd></div>
          <div><dt className="text-slate-500 dark:text-slate-400">Calculator</dt><dd className="font-semibold">{EXAM.calculatorAllowed ? 'Allowed' : 'Not allowed'}</dd></div>
          <div><dt className="text-slate-500 dark:text-slate-400">Scratch paper</dt><dd className="font-semibold">{EXAM.scratchPaperAllowed ? 'Allowed' : 'Not allowed'}</dd></div>
          <div className="sm:col-span-2"><dt className="text-slate-500 dark:text-slate-400">Retest</dt><dd>{EXAM.retestPolicy}</dd></div>
        </dl>
      </Card>
      <Card>
        <h2 className="mb-2 font-semibold">Commonly cited minimum scores</h2>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-500 dark:text-slate-400"><th className="py-1">AFSC</th><th>Career field</th><th className="text-right">Min</th></tr></thead>
          <tbody>
            {CUTOFFS.map((c) => (
              <tr key={c.afsc} className="border-t border-slate-200 dark:border-slate-800"><td className="py-1 font-mono">{c.afsc}</td><td>{c.title}{c.note && <span className="block text-xs text-slate-500 dark:text-slate-400">{c.note}</span>}</td><td className="text-right font-semibold tabular-nums">{c.minScore}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">To change these values, edit src/content/reference.ts.</p>
      </Card>
      <Card>
        <h2 className="mb-2 font-semibold">Question types covered</h2>
        <ul className="list-disc pl-5 text-sm">
          <li>Number sequences and letter sequences</li>
          <li>Figure sequences, figure analogies and odd-one-out</li>
          <li>Arithmetic reasoning word problems</li>
          <li>Logical reasoning: syllogisms, conditionals, ordering, sets</li>
          <li>Reading comprehension and verbal analogies</li>
        </ul>
      </Card>
    </div>
  )
}
