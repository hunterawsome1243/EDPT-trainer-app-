export type QuestionType =
  | 'number-sequence'
  | 'letter-sequence'
  | 'figure'
  | 'arithmetic'
  | 'logic'
  | 'verbal'

export const QUESTION_TYPES: QuestionType[] = [
  'number-sequence',
  'letter-sequence',
  'figure',
  'arithmetic',
  'logic',
  'verbal',
]

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  'number-sequence': 'Number sequences',
  'letter-sequence': 'Letter sequences',
  figure: 'Figure patterns',
  arithmetic: 'Arithmetic reasoning',
  logic: 'Logical reasoning',
  verbal: 'Reading & verbal',
}

export type Difficulty = 1 | 2 | 3 | 4 | 5

/** Primitive shape inside a generated figure cell. */
export interface Shape {
  kind: 'circle' | 'square' | 'triangle' | 'diamond' | 'pentagon' | 'star' | 'arrow' | 'line' | 'dot'
  /** 0..1 relative position inside the cell */
  x?: number
  y?: number
  /** 0..1 relative size */
  size?: number
  rotation?: number
  fill?: 'none' | 'solid' | 'hatch' | 'dots'
  stroke?: 'solid' | 'dashed'
}

export interface FigureSpec {
  shapes: Shape[]
  /** Human description for screen readers; must not reveal the answer. */
  alt: string
}

export interface Option {
  id: string
  text?: string
  figure?: FigureSpec
}

export interface Explanation {
  pattern: string
  howToSpot: string
  trap: string
}

export interface Question {
  /** `${type}:${ruleId}:${difficulty}:${seed}` — deterministic and reproducible. */
  id: string
  type: QuestionType
  ruleId: string
  difficulty: Difficulty
  seed: number
  /** Short prompt line, e.g. "What comes next?" */
  prompt: string
  /** Text stem (number/letter series, word problem, logic premises). */
  stem?: string
  /** Optional passage for reading comprehension. */
  passage?: string
  /** Figure stems: sequence cells, or analogy cells [A, B, C]. */
  figures?: FigureSpec[]
  figureLayout?: 'sequence' | 'analogy' | 'odd-one-out'
  options: Option[]
  correctOptionId: string
  explanation: Explanation
}

export interface RuleFamily<Extra = unknown> {
  id: string
  name: string
  /** Lowest difficulty at which this family may appear. */
  minDifficulty: Difficulty
  build: (rng: Rng, difficulty: Difficulty) => Built & Extra
}

/** Output of a family's build() before the generator packages it as a Question. */
export interface Built {
  prompt: string
  stem?: string
  passage?: string
  figures?: FigureSpec[]
  figureLayout?: Question['figureLayout']
  correct: string | FigureSpec
  distractors: (string | FigureSpec)[]
  explanation: Explanation
}

export interface Rng {
  /** float in [0,1) */
  next(): number
  /** integer in [min,max] inclusive */
  int(min: number, max: number): number
  pick<T>(arr: readonly T[]): T
  shuffle<T>(arr: readonly T[]): T[]
  bool(p?: number): boolean
}

export interface Attempt {
  id?: number
  questionId: string
  type: QuestionType
  ruleId: string
  difficulty: Difficulty
  correct: boolean
  /** ms spent on the question */
  timeMs: number
  /** null when the user skipped / ran out of time */
  chosenOptionId: string | null
  sessionId?: number
  at: number
}

export type SessionMode = 'practice' | 'timed-practice' | 'exam'

export interface SessionRecord {
  id?: number
  mode: SessionMode
  /** exam length fraction: 1, 0.5, 0.25 */
  length?: number
  startedAt: number
  finishedAt?: number
  questionCount: number
  correctCount: number
  totalTimeMs: number
  byType: Partial<Record<QuestionType, { correct: number; total: number; timeMs: number }>>
  estimatedScore?: number
}
