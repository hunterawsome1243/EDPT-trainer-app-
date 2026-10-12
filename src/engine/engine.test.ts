import { describe, expect, it } from 'vitest'
import { allocate, buildExam, examTimeLimitMs } from './exam'
import { buildReport, rawScore } from './scoring'
import { dueRules, initialReview, qualityFor, review } from './spaced'
import { computeReadiness, targetPercentFor } from './readiness'
import { buildPlan, daysBetween } from './plan'
import { EXAM } from '../content/reference'
import type { Attempt } from '../types'

describe('exam assembly', () => {
  it('allocates exactly the requested total', () => {
    for (const total of [120, 60, 30, 7]) {
      const c = allocate(total)
      expect(Object.values(c).reduce((a, b) => a + b, 0)).toBe(total)
    }
  })
  it('builds a full exam with the configured count, deterministically', () => {
    const a = buildExam({ length: 1, seed: 99 })
    const b = buildExam({ length: 1, seed: 99 })
    expect(a).toHaveLength(EXAM.questionCount)
    expect(a.map((q) => q.id)).toEqual(b.map((q) => q.id))
    expect(new Set(a.map((q) => q.id)).size).toBe(a.length)
  })
  it('builds half and quarter exams', () => {
    expect(buildExam({ length: 0.5, seed: 1 })).toHaveLength(EXAM.questionCount / 2)
    expect(buildExam({ length: 0.25, seed: 1 })).toHaveLength(EXAM.questionCount / 4)
    expect(examTimeLimitMs(0.5)).toBe(EXAM.timeLimitMinutes * 30 * 1000)
  })
})

const att = (over: Partial<Attempt>): Attempt => ({ questionId: 'x', type: 'arithmetic', ruleId: 'average', difficulty: 2, correct: true, timeMs: 20_000, chosenOptionId: 'A', at: 0, ...over })

describe('scoring', () => {
  it('counts correct answers and applies the optional penalty', () => {
    const list = [att({}), att({ correct: false }), att({ correct: false, chosenOptionId: null })]
    expect(rawScore(list, false)).toBe(1)
    expect(rawScore(list, true)).toBe(0.75)
  })
  it('builds a report with per-type and per-rule stats', () => {
    const list = [att({}), att({ correct: false, ruleId: 'percent-of' }), att({ type: 'logic', ruleId: 'syllogism', timeMs: 90_000 })]
    const r = buildReport(list, false)
    expect(r.total).toBe(3)
    expect(r.correct).toBe(2)
    expect(r.byType.arithmetic.total).toBe(2)
    expect(r.byRule['arithmetic/percent-of']!.accuracy).toBe(0)
    expect(r.rightButSlow).toHaveLength(1)
    expect(r.missedRules[0]).toMatchObject({ ruleId: 'percent-of', missed: 1 })
    expect(r.estimate.low).toBeLessThanOrEqual(r.estimate.high)
  })
})

describe('spaced repetition', () => {
  it('brings a missed rule back the same day and stretches gaps on success', () => {
    const now = 1_000_000
    let s = initialReview('k', now)
    s = review(s, 0, now)
    expect(s.due - now).toBeLessThan(86_400_000)
    s = review(s, 5, now)
    expect(s.interval).toBe(1)
    s = review(s, 5, now)
    expect(s.interval).toBe(3)
    s = review(s, 5, now)
    expect(s.interval).toBeGreaterThan(3)
    expect(s.easiness).toBeGreaterThanOrEqual(1.3)
  })
  it('maps correctness and speed to quality', () => {
    expect(qualityFor(false, 1, 10)).toBe(0)
    expect(qualityFor(true, 5, 10)).toBe(5)
    expect(qualityFor(true, 15, 10)).toBe(3)
  })
  it('lists due rules soonest first', () => {
    const a = { ...initialReview('a', 0), due: 50 }
    const b = { ...initialReview('b', 0), due: 10 }
    const c = { ...initialReview('c', 0), due: 500 }
    expect(dueRules([a, b, c], 100).map((x) => x.key)).toEqual(['b', 'a'])
  })
})

describe('readiness', () => {
  it('is Not started with no data and grows with accuracy', () => {
    expect(computeReadiness([], 60).label).toBe('Not started')
    const good = computeReadiness(
      ['number-sequence', 'letter-sequence', 'figure', 'arithmetic', 'logic', 'verbal'].map((t) => ({ type: t as never, ruleId: 'r', correct: 18, total: 20, avgSec: 30 })),
      60,
    )
    expect(good.score).toBeGreaterThan(85)
    const poor = computeReadiness([{ type: 'logic', ruleId: 'r', correct: 2, total: 10, avgSec: 90 }], 60)
    expect(poor.score).toBeLessThan(good.score)
  })
  it('derives a sensible target percent', () => {
    expect(targetPercentFor(71)).toBeGreaterThanOrEqual(55)
    expect(targetPercentFor(71)).toBeLessThanOrEqual(70)
  })
})

describe('study plan', () => {
  it('covers every day up to the test and schedules simulations', () => {
    const plan = buildPlan({ today: '2026-01-01', testDate: '2026-01-15', minutesPerDay: 60, accuracy: {}, lessonsDone: [] })
    expect(plan).toHaveLength(14)
    expect(daysBetween('2026-01-01', '2026-01-15')).toBe(14)
    expect(plan.some((d) => d.items.some((i) => i.kind === 'exam'))).toBe(true)
    expect(plan[0]!.items[0]!.kind).toBe('learn')
    expect(plan[13]!.items[0]!.kind).toBe('rest')
    for (const d of plan) expect(d.minutes).toBeLessThanOrEqual(61)
  })
})
