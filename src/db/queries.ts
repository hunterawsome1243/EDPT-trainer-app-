import { db } from './db'
import type { Attempt, Difficulty, Question, QuestionType, SessionRecord } from '../types'
import { QUESTION_TYPES } from '../types'
import { initialReview, qualityFor, review } from '../engine/spaced'
import type { RuleAgg } from '../engine/readiness'
import { SECONDS_PER_QUESTION } from '../content/reference'

export async function recordAttempt(q: Question, chosen: string | null, timeMs: number, sessionId?: number): Promise<Attempt> {
  const correct = chosen !== null && chosen === q.correctOptionId
  const attempt: Attempt = { questionId: q.id, type: q.type, ruleId: q.ruleId, difficulty: q.difficulty, correct, timeMs, chosenOptionId: chosen, sessionId, at: Date.now() }
  attempt.id = await db.attempts.add(attempt)
  const key = `${q.type}/${q.ruleId}`
  const now = Date.now()
  const prev = (await db.reviews.get(key)) ?? initialReview(key, now)
  await db.reviews.put(review(prev, qualityFor(correct, timeMs, SECONDS_PER_QUESTION * 1000), now))
  return attempt
}

export async function ruleAggregates(): Promise<RuleAgg[]> {
  const all = await db.attempts.toArray()
  const m = new Map<string, RuleAgg & { time: number }>()
  for (const a of all) {
    const k = `${a.type}/${a.ruleId}`
    const r = m.get(k) ?? { type: a.type, ruleId: a.ruleId, correct: 0, total: 0, avgSec: 0, time: 0 }
    r.correct += a.correct ? 1 : 0
    r.total += 1
    r.time += a.timeMs
    m.set(k, r)
  }
  return [...m.values()].map(({ time, ...r }) => ({ ...r, avgSec: r.total ? time / r.total / 1000 : 0 }))
}

export async function typeAccuracy(): Promise<Partial<Record<QuestionType, number>>> {
  const aggs = await ruleAggregates()
  const out: Partial<Record<QuestionType, number>> = {}
  for (const t of QUESTION_TYPES) {
    const rs = aggs.filter((r) => r.type === t)
    const total = rs.reduce((s, r) => s + r.total, 0)
    if (total) out[t] = rs.reduce((s, r) => s + r.correct, 0) / total
  }
  return out
}

export interface DayPoint {
  date: string
  count: number
  accuracy: number
  avgSec: number
}

export async function dailyTrend(days = 30): Promise<DayPoint[]> {
  const since = Date.now() - days * 86_400_000
  const all = await db.attempts.where('at').above(since).toArray()
  const m = new Map<string, { c: number; t: number; time: number }>()
  for (const a of all) {
    const d = new Date(a.at).toISOString().slice(0, 10)
    const r = m.get(d) ?? { c: 0, t: 0, time: 0 }
    r.c += a.correct ? 1 : 0
    r.t += 1
    r.time += a.timeMs
    m.set(d, r)
  }
  return [...m.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, r]) => ({ date, count: r.t, accuracy: r.c / r.t, avgSec: r.time / r.t / 1000 }))
}

export async function examSessions(): Promise<SessionRecord[]> {
  return (await db.sessions.where('mode').equals('exam').toArray()).filter((s) => s.finishedAt).sort((a, b) => a.startedAt - b.startedAt)
}

export async function recentMistakes(limit = 40): Promise<Attempt[]> {
  const all = await db.attempts.orderBy('at').reverse().limit(400).toArray()
  const seen = new Set<string>()
  const out: Attempt[] = []
  for (const a of all) {
    if (a.correct || seen.has(a.questionId)) continue
    seen.add(a.questionId)
    out.push(a)
    if (out.length >= limit) break
  }
  return out
}

/** Suggested difficulty per type from recent performance: climb when ≥80% at the current level. */
export async function autoDifficulty(type: QuestionType): Promise<Difficulty> {
  const recent = (await db.attempts.where('type').equals(type).sortBy('at')).slice(-30)
  if (recent.length < 5) {
    const lp = await db.lessons.get(type)
    return (lp?.tier ?? 1) as Difficulty
  }
  const maxD = Math.max(...recent.map((a) => a.difficulty)) as Difficulty
  const atMax = recent.filter((a) => a.difficulty === maxD)
  const acc = atMax.length ? atMax.filter((a) => a.correct).length / atMax.length : 0
  if (atMax.length >= 5 && acc >= 0.8) return Math.min(5, maxD + 1) as Difficulty
  if (atMax.length >= 5 && acc < 0.4) return Math.max(1, maxD - 1) as Difficulty
  return maxD
}

export async function streakDays(): Promise<number> {
  const all = await db.attempts.orderBy('at').reverse().limit(2000).toArray()
  const days = new Set(all.map((a) => new Date(a.at).toISOString().slice(0, 10)))
  let n = 0
  const d = new Date()
  for (;;) {
    const k = d.toISOString().slice(0, 10)
    if (!days.has(k)) {
      if (n === 0) {
        d.setUTCDate(d.getUTCDate() - 1)
        if (!days.has(d.toISOString().slice(0, 10))) break
        continue
      }
      break
    }
    n += 1
    d.setUTCDate(d.getUTCDate() - 1)
  }
  return n
}
