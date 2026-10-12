import type { Difficulty, Question, QuestionType } from '../types'
import { QUESTION_TYPES } from '../types'
import { generateQuestion } from '../generators'
import { createRng } from '../generators/rng'
import { EXAM, SECTION_MIX } from '../content/reference'

export interface ExamSpec {
  /** 1, 0.5 or 0.25 */
  length: number
  seed: number
  /** Difficulty profile; a real exam ramps up. */
  difficultyBias?: number
}

/** Build the list of questions for a simulated exam, mirroring the section mix. */
export function buildExam(spec: ExamSpec): Question[] {
  const total = Math.round(EXAM.questionCount * spec.length)
  const rng = createRng(spec.seed)
  const counts = allocate(total)
  const questions: Question[] = []
  for (const type of QUESTION_TYPES) {
    const n = counts[type]
    for (let i = 0; i < n; i++) {
      // ramp difficulty through each section: early items easy, later items hard
      const frac = n <= 1 ? 0.5 : i / (n - 1)
      const base = 1 + frac * 4 + (spec.difficultyBias ?? 0)
      const d = Math.max(1, Math.min(5, Math.round(base + (rng.next() - 0.5)))) as Difficulty
      questions.push(generateQuestion(type, rng.int(1, 2 ** 31 - 1), d))
    }
  }
  // Real tests interleave sections loosely; shuffle within blocks of ~10 for realism.
  return blockShuffle(questions, rng, 10)
}

export function allocate(total: number): Record<QuestionType, number> {
  const out = {} as Record<QuestionType, number>
  let assigned = 0
  for (const type of QUESTION_TYPES) {
    out[type] = Math.floor(total * SECTION_MIX[type])
    assigned += out[type]
  }
  // distribute remainder to largest fractional parts
  const rem = QUESTION_TYPES.map((t) => [t, total * SECTION_MIX[t] - out[t]] as const).sort((a, b) => b[1] - a[1])
  for (let i = 0; assigned < total; i++, assigned++) out[rem[i % rem.length]![0]] += 1
  return out
}

function blockShuffle<T>(arr: T[], rng: { shuffle: <U>(a: readonly U[]) => U[] }, block: number): T[] {
  const out: T[] = []
  for (let i = 0; i < arr.length; i += block) out.push(...rng.shuffle(arr.slice(i, i + block)))
  return out
}

export function examTimeLimitMs(length: number): number {
  return Math.round(EXAM.timeLimitMinutes * 60 * 1000 * length)
}
