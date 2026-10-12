/*
 * SM-2 style scheduler applied to *rules* (not individual questions): when a
 * rule is missed it comes back soon; each correct review stretches the gap.
 */

export interface ReviewState {
  key: string // `${type}/${ruleId}`
  easiness: number // >= 1.3
  interval: number // days
  repetitions: number
  due: number // epoch ms
  lastReviewed: number
}

const DAY = 86_400_000

export function initialReview(key: string, now: number): ReviewState {
  return { key, easiness: 2.5, interval: 0, repetitions: 0, due: now, lastReviewed: now }
}

/**
 * quality: 0 = wrong, 3 = correct but slow, 5 = correct and fast.
 */
export function review(state: ReviewState, quality: 0 | 3 | 5, now: number): ReviewState {
  let { easiness, interval, repetitions } = state
  if (quality < 3) {
    repetitions = 0
    interval = 0 // due again today
  } else {
    if (repetitions === 0) interval = 1
    else if (repetitions === 1) interval = 3
    else interval = Math.round(interval * easiness)
    repetitions += 1
  }
  easiness = Math.max(1.3, easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
  const due = interval === 0 ? now + 10 * 60 * 1000 : now + interval * DAY
  return { ...state, easiness, interval, repetitions, due, lastReviewed: now }
}

export function qualityFor(correct: boolean, timeMs: number, budgetMs: number): 0 | 3 | 5 {
  if (!correct) return 0
  return timeMs <= budgetMs ? 5 : 3
}

/** Rules due now, soonest first. */
export function dueRules(states: ReviewState[], now: number): ReviewState[] {
  return states.filter((s) => s.due <= now).sort((a, b) => a.due - b.due)
}
