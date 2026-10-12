import type { QuestionType } from '../types'
import { QUESTION_TYPES } from '../types'
import { SECONDS_PER_QUESTION } from '../content/reference'

export interface RuleAgg {
  type: QuestionType
  ruleId: string
  correct: number
  total: number
  avgSec: number
}

export interface Readiness {
  /** 0..100 */
  score: number
  accuracy: number // 0..1 weighted by section mix
  pacing: number // 0..1, 1 = within budget
  coverage: number // 0..1, fraction of question types with >= 10 attempts
  label: 'Not started' | 'Building' | 'Approaching' | 'On target' | 'Strong'
  weakest: RuleAgg[]
}

/** Combine accuracy, pacing and coverage into a single readiness number. */
export function computeReadiness(rules: RuleAgg[], targetPercent: number): Readiness {
  const byType = new Map<QuestionType, { c: number; t: number; time: number }>()
  for (const t of QUESTION_TYPES) byType.set(t, { c: 0, t: 0, time: 0 })
  for (const r of rules) {
    const b = byType.get(r.type)!
    b.c += r.correct
    b.t += r.total
    b.time += r.avgSec * r.total
  }
  let accSum = 0, n = 0, paceSum = 0, covered = 0
  for (const t of QUESTION_TYPES) {
    const b = byType.get(t)!
    if (b.t === 0) continue
    n += 1
    accSum += b.c / b.t
    const avg = b.time / b.t
    paceSum += Math.min(1, SECONDS_PER_QUESTION / Math.max(avg, 1))
    if (b.t >= 10) covered += 1
  }
  const accuracy = n ? accSum / n : 0
  const pacing = n ? paceSum / n : 0
  const coverage = covered / QUESTION_TYPES.length
  const target = targetPercent / 100
  const accPart = Math.min(1, accuracy / target)
  const score = Math.round(100 * (0.6 * accPart + 0.25 * pacing + 0.15 * coverage))
  const label: Readiness['label'] = n === 0 ? 'Not started' : score < 50 ? 'Building' : score < 75 ? 'Approaching' : score < 90 ? 'On target' : 'Strong'
  const weakest = rules
    .filter((r) => r.total >= 3)
    .sort((a, b) => a.correct / a.total - b.correct / b.total || b.avgSec - a.avgSec)
    .slice(0, 5)
  return { score, accuracy, pacing, coverage, label, weakest }
}

/** Percent correct on a simulation roughly needed for a given cutoff, inverse of estimateScore's midpoint. */
export function targetPercentFor(cutoff: number): number {
  return Math.min(95, Math.max(50, Math.round(cutoff / 1.3) + 5))
}
