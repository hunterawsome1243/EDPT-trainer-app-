/*
 * Reference facts about the EDPT. Several of these are commonly cited rather
 * than published by the Air Force, so they are kept here as editable
 * constants and always shown with the disclaimer below.
 */

export const DISCLAIMER =
  'This is an unofficial study tool and is not affiliated with the U.S. Air Force. Exam details and cutoff scores below are drawn from commonly cited sources and may be out of date. Verify with your recruiter or Military Personnel Flight (MPF).'

export const EXAM = {
  name: 'Electronic Data Processing Test (EDPT)',
  /** Commonly cited: 120 items. */
  questionCount: 120,
  /** Commonly cited: 90 minutes. */
  timeLimitMinutes: 90,
  /** Scratch paper is allowed; calculators are not. */
  calculatorAllowed: false,
  scratchPaperAllowed: true,
  /** Whether wrong answers subtract from the score. Sources disagree; default to no penalty. */
  guessingPenalty: false,
  /** Commonly cited retest wait. */
  retestPolicy: 'A waiting period (commonly cited as six months) applies before the EDPT may be retaken, and the number of attempts may be limited. Confirm current policy with your recruiter or MPF.',
} as const

/** Approximate section mix used for simulations and drills. Weights sum to 1. */
export const SECTION_MIX = {
  'number-sequence': 0.2,
  'letter-sequence': 0.12,
  figure: 0.2,
  arithmetic: 0.2,
  logic: 0.16,
  verbal: 0.12,
} as const

export interface Cutoff {
  afsc: string
  title: string
  minScore: number
  note?: string
}

/** Commonly cited minimum EDPT scores by career field. Editable; shown with the disclaimer. */
export const CUTOFFS: Cutoff[] = [
  { afsc: '1D7X1', title: 'Cyber Defense Operations', minScore: 71, note: 'Some shreds may not require the EDPT.' },
  { afsc: '1B4X1', title: 'Cyber Warfare Operations (legacy)', minScore: 71 },
  { afsc: '17S / 17D', title: 'Cyber Operations Officer', minScore: 71 },
  { afsc: '3D0X2', title: 'Cyber Systems Operations (legacy)', minScore: 60 },
  { afsc: '3D0X4', title: 'Computer Systems Programming (legacy)', minScore: 71 },
]

/**
 * Rough mapping from percent correct on a full-length simulation to an EDPT
 * score band. The real scale is not published; this is a conservative
 * estimate for planning only.
 */
export function estimateScore(percentCorrect: number): { low: number; high: number } {
  const p = Math.max(0, Math.min(100, percentCorrect))
  const mid = Math.round(p * 1.3)
  return { low: Math.max(0, mid - 10), high: Math.min(160, mid + 10) }
}

export const SECONDS_PER_QUESTION = (EXAM.timeLimitMinutes * 60) / EXAM.questionCount
