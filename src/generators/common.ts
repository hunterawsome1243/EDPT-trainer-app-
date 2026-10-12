import type { Built, Difficulty, FigureSpec, Option, Question, QuestionType, Rng, RuleFamily } from '../types'
import { createRng, hashString } from './rng'

/**
 * Builds unique distractors by trying candidate producers in order and
 * finally falling back to jittered values. Never returns the correct answer
 * and never returns duplicates.
 */
export function uniqueDistractors(
  correct: string,
  candidates: (string | number)[],
  fallback: () => string | number,
  count = 3,
): string[] {
  const out: string[] = []
  const seen = new Set<string>([correct])
  const push = (v: string | number) => {
    const s = String(v)
    if (!seen.has(s) && s.trim() !== '' && s !== 'NaN' && s !== 'Infinity' && s !== '-Infinity') {
      seen.add(s)
      out.push(s)
    }
  }
  for (const c of candidates) {
    if (out.length >= count) break
    push(c)
  }
  let guard = 0
  while (out.length < count && guard++ < 200) push(fallback())
  if (out.length < count) throw new Error('could not build enough distractors')
  return out
}

function keyOf(v: string | FigureSpec): string {
  return typeof v === 'string' ? `t:${v}` : `f:${JSON.stringify(v.shapes)}`
}

/** Shared packaging: shuffle options by seed, assign ids, enforce invariants. */
export function packageQuestion(
  type: QuestionType,
  family: RuleFamily,
  difficulty: Difficulty,
  seed: number,
  built: Built,
): Question {
  const rng = createRng(hashString(`${type}:${family.id}:${difficulty}:${seed}:options`))
  const all: (string | FigureSpec)[] = [built.correct, ...built.distractors]
  const keys = all.map(keyOf)
  if (new Set(keys).size !== keys.length) {
    throw new Error(`duplicate options in ${type}/${family.id} seed=${seed} d=${difficulty}`)
  }
  if (built.distractors.length < 3) {
    throw new Error(`too few distractors in ${type}/${family.id}`)
  }
  const shuffled = rng.shuffle(all)
  const letters = ['A', 'B', 'C', 'D', 'E']
  const options: Option[] = shuffled.map((v, i) =>
    typeof v === 'string' ? { id: letters[i]!, text: v } : { id: letters[i]!, figure: v },
  )
  const correctIndex = shuffled.findIndex((v) => keyOf(v) === keyOf(built.correct))
  return {
    id: `${type}:${family.id}:${difficulty}:${seed}`,
    type,
    ruleId: family.id,
    difficulty,
    seed,
    prompt: built.prompt,
    stem: built.stem,
    passage: built.passage,
    figures: built.figures,
    figureLayout: built.figureLayout,
    options,
    correctOptionId: letters[correctIndex]!,
    explanation: built.explanation,
  }
}

/** Choose a family eligible at this difficulty, deterministically from the seed. */
export function chooseFamily(families: RuleFamily[], difficulty: Difficulty, seed: number, type: string): RuleFamily {
  const eligible = families.filter((f) => f.minDifficulty <= difficulty)
  const rng = createRng(hashString(`${type}:family:${seed}:${difficulty}`))
  return rng.pick(eligible)
}

export function makeGenerator(type: QuestionType, families: RuleFamily[]) {
  const byId = new Map(families.map((f) => [f.id, f]))
  function generate(seed: number, difficulty: Difficulty, ruleId?: string): Question {
    const family = ruleId ? byId.get(ruleId) : chooseFamily(families, difficulty, seed, type)
    if (!family) throw new Error(`unknown rule ${ruleId} for ${type}`)
    const d = Math.max(family.minDifficulty, difficulty) as Difficulty
    const rng = createRng(hashString(`${type}:${family.id}:${d}:${seed}`))
    // Retry a few times with derived seeds if a build throws on an unlucky draw.
    let lastErr: unknown
    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        const built = family.build(attempt === 0 ? rng : createRng(hashString(`${type}:${family.id}:${d}:${seed}:${attempt}`)), d)
        return packageQuestion(type, family, d, seed, built)
      } catch (e) {
        lastErr = e
      }
    }
    throw lastErr
  }
  return { type, families, generate }
}

export function fmt(n: number): string {
  if (Number.isInteger(n)) return String(n)
  return String(Math.round(n * 100) / 100)
}

export function gcd(a: number, b: number): number {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b) [a, b] = [b, a % b]
  return a
}

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export function letterAt(i: number): string {
  return ALPHABET[((i % 26) + 26) % 26]!
}

export function sample<T>(rng: Rng, arr: readonly T[], n: number): T[] {
  return rng.shuffle(arr).slice(0, n)
}
