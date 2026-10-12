import type { Attempt, QuestionType } from '../types'
import { QUESTION_TYPES } from '../types'
import { EXAM, SECONDS_PER_QUESTION, estimateScore } from '../content/reference'

export interface SectionStats {
  correct: number
  total: number
  timeMs: number
  /** average seconds per question */
  avgSec: number
  accuracy: number
}

export interface Report {
  total: number
  correct: number
  skipped: number
  /** raw score under the configured scoring model */
  raw: number
  percent: number
  estimate: { low: number; high: number }
  byType: Record<QuestionType, SectionStats>
  byRule: Record<string, SectionStats & { type: QuestionType }>
  /** correct answers that took longer than 1.5× the per-question budget */
  rightButSlow: Attempt[]
  missedRules: { ruleId: string; type: QuestionType; missed: number }[]
  totalTimeMs: number
}

export function rawScore(attempts: Attempt[], penalty: boolean = EXAM.guessingPenalty): number {
  let s = 0
  for (const a of attempts) {
    if (a.correct) s += 1
    else if (penalty && a.chosenOptionId !== null) s -= 0.25
  }
  return Math.max(0, s)
}

function stats(list: Attempt[]): SectionStats {
  const total = list.length
  const correct = list.filter((a) => a.correct).length
  const timeMs = list.reduce((s, a) => s + a.timeMs, 0)
  return { correct, total, timeMs, avgSec: total ? timeMs / total / 1000 : 0, accuracy: total ? correct / total : 0 }
}

export function buildReport(attempts: Attempt[], penalty: boolean = EXAM.guessingPenalty): Report {
  const byType = {} as Record<QuestionType, SectionStats>
  for (const t of QUESTION_TYPES) byType[t] = stats(attempts.filter((a) => a.type === t))
  const byRule: Report['byRule'] = {}
  for (const a of attempts) {
    const k = `${a.type}/${a.ruleId}`
    if (!byRule[k]) byRule[k] = { ...stats(attempts.filter((x) => x.type === a.type && x.ruleId === a.ruleId)), type: a.type }
  }
  const total = attempts.length
  const correct = attempts.filter((a) => a.correct).length
  const raw = rawScore(attempts, penalty)
  const percent = total ? (raw / total) * 100 : 0
  const slowMs = SECONDS_PER_QUESTION * 1.5 * 1000
  const missed = new Map<string, number>()
  for (const a of attempts) if (!a.correct) missed.set(`${a.type}/${a.ruleId}`, (missed.get(`${a.type}/${a.ruleId}`) ?? 0) + 1)
  return {
    total,
    correct,
    skipped: attempts.filter((a) => a.chosenOptionId === null).length,
    raw,
    percent,
    estimate: estimateScore(percent),
    byType,
    byRule,
    rightButSlow: attempts.filter((a) => a.correct && a.timeMs > slowMs),
    missedRules: [...missed.entries()]
      .map(([k, n]) => ({ ruleId: k.split('/')[1]!, type: k.split('/')[0] as QuestionType, missed: n }))
      .sort((a, b) => b.missed - a.missed),
    totalTimeMs: attempts.reduce((s, a) => s + a.timeMs, 0),
  }
}
