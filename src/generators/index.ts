import type { Difficulty, Question, QuestionType } from '../types'
import { numberSequence } from './numberSequence'
import { letterSequence } from './letterSequence'
import { figure } from './figure'
import { arithmetic } from './arithmetic'
import { logic } from './logic'
import { verbal } from './verbal'

export const ALL_GENERATORS = [numberSequence, letterSequence, figure, arithmetic, logic, verbal]

export const GENERATORS: Partial<Record<QuestionType, (typeof ALL_GENERATORS)[number]>> = Object.fromEntries(
  ALL_GENERATORS.map((g) => [g.type, g]),
)

export function generateQuestion(type: QuestionType, seed: number, difficulty: Difficulty, ruleId?: string): Question {
  const g = GENERATORS[type]
  if (!g) throw new Error(`no generator for ${type}`)
  return g.generate(seed, difficulty, ruleId)
}

/** Rebuild a question from its id (`type:rule:difficulty:seed`). */
export function questionFromId(id: string): Question {
  const [type, ruleId, d, seed] = id.split(':')
  return generateQuestion(type as QuestionType, Number(seed), Number(d) as Difficulty, ruleId)
}

export function allRules(): { type: QuestionType; id: string; name: string; minDifficulty: Difficulty }[] {
  return ALL_GENERATORS.flatMap((g) => g.families.map((f) => ({ type: g.type, id: f.id, name: f.name, minDifficulty: f.minDifficulty })))
}
