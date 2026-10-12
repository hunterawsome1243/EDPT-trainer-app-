import { STRATEGY_TITLE, strategySections } from '../../content/strategy'
import { useSettings } from '../hooks/useSettings'
import { DISCLAIMER } from '../../content/reference'
import { Disclaimer, PageTitle } from '../components/ui'

export function StrategyPage() {
  const { settings } = useSettings()
  const sections = strategySections(settings.guessingPenalty)
  return (
    <article className="space-y-5">
      <PageTitle sub="How to take the test, not just how to answer the questions.">{STRATEGY_TITLE}</PageTitle>
      {sections.map((s) => (
        <section key={s.heading}>
          <h2 className="mb-1 text-lg font-semibold">{s.heading}</h2>
          {s.paragraphs.map((p, i) => <p key={i} className="mb-2 text-sm leading-relaxed">{p}</p>)}
          {s.bullets && <ul className="list-disc space-y-1 pl-5 text-sm">{s.bullets.map((b) => <li key={b}>{b}</li>)}</ul>}
        </section>
      ))}
      <Disclaimer text={DISCLAIMER} />
    </article>
  )
}
