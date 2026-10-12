import type { QuestionType } from '../types'
import { QUESTION_TYPES, QUESTION_TYPE_LABELS } from '../types'

export interface PlanDay {
  date: string // YYYY-MM-DD
  minutes: number
  items: { kind: 'learn' | 'drill' | 'review' | 'exam' | 'mental-math' | 'rest'; type?: QuestionType; minutes: number; label: string }[]
}

export interface PlanInput {
  today: string
  testDate: string
  minutesPerDay: number
  /** accuracy per type 0..1, undefined when untested */
  accuracy: Partial<Record<QuestionType, number>>
  lessonsDone: QuestionType[]
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86_400_000)
}

/**
 * Build a day-by-day plan. Early days cover unlearned modules, middle days
 * drill the weakest areas, every 5th day is a timed simulation, and the last
 * two days are light review.
 */
export function buildPlan(input: PlanInput): PlanDay[] {
  const days = Math.max(1, daysBetween(input.today, input.testDate))
  const out: PlanDay[] = []
  const unlearned = QUESTION_TYPES.filter((t) => !input.lessonsDone.includes(t))
  const weakOrder = [...QUESTION_TYPES].sort((a, b) => (input.accuracy[a] ?? 0) - (input.accuracy[b] ?? 0))
  const m = input.minutesPerDay
  for (let i = 0; i < days; i++) {
    const date = addDays(input.today, i)
    const items: PlanDay['items'] = []
    const isLast = i >= days - 2 && days > 3
    const isExamDay = !isLast && i > 0 && i % 5 === 4
    if (i === days - 1) {
      items.push({ kind: 'rest', minutes: Math.min(20, m), label: 'Light review of the strategy guide. Sleep early.' })
    } else if (isLast) {
      items.push({ kind: 'review', minutes: Math.round(m * 0.6), label: 'Review missed rules' })
      items.push({ kind: 'mental-math', minutes: Math.round(m * 0.4), label: 'Mental-math warm-up' })
    } else if (isExamDay) {
      items.push({ kind: 'exam', minutes: Math.min(m, 95), label: m >= 90 ? 'Full-length timed simulation' : m >= 45 ? 'Half-length timed simulation' : 'Quarter-length timed simulation' })
    } else if (unlearned.length) {
      const t = unlearned.shift()!
      items.push({ kind: 'learn', type: t, minutes: Math.round(m * 0.5), label: `Learn: ${QUESTION_TYPE_LABELS[t]}` })
      items.push({ kind: 'drill', type: t, minutes: Math.round(m * 0.35), label: `Drill: ${QUESTION_TYPE_LABELS[t]}` })
      items.push({ kind: 'mental-math', minutes: Math.round(m * 0.15), label: 'Mental-math drill' })
    } else {
      const t = weakOrder[i % weakOrder.length]!
      items.push({ kind: 'review', minutes: Math.round(m * 0.25), label: 'Spaced review (due rules)' })
      items.push({ kind: 'drill', type: t, minutes: Math.round(m * 0.5), label: `Timed drill: ${QUESTION_TYPE_LABELS[t]}` })
      items.push({ kind: 'mental-math', minutes: Math.round(m * 0.25), label: 'Mental-math drill' })
    }
    out.push({ date, minutes: items.reduce((s, x) => s + x.minutes, 0), items })
  }
  return out
}
