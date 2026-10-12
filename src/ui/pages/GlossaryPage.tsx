import { GLOSSARY } from '../../content/glossary'
import { PageTitle } from '../components/ui'

export function GlossaryPage() {
  return (
    <div>
      <PageTitle>Glossary</PageTitle>
      <dl className="space-y-3">
        {GLOSSARY.map((g) => (
          <div key={g.term} className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <dt className="font-semibold">{g.term}</dt>
            <dd className="text-sm text-slate-700 dark:text-slate-300">{g.definition}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
