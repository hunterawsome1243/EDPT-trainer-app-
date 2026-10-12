import type { Rng } from '../types'

export interface MentalItem {
  prompt: string
  answer: string
}

export interface MentalDrill {
  id: string
  name: string
  description: string
  seconds: number
  make: (rng: Rng) => MentalItem
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100))

export const MENTAL_DRILLS: MentalDrill[] = [
  { id: 'times', name: 'Times tables', description: 'Products up to 12 × 12.', seconds: 60, make: (r) => { const a = r.int(2, 12), b = r.int(2, 12); return { prompt: `${a} × ${b}`, answer: String(a * b) } } },
  { id: 'bigtimes', name: 'Two-digit × one-digit', description: 'Such as 47 × 6.', seconds: 90, make: (r) => { const a = r.int(13, 99), b = r.int(3, 9); return { prompt: `${a} × ${b}`, answer: String(a * b) } } },
  { id: 'percent', name: 'Percentages', description: '10%, 5%, 25%, 15% and friends.', seconds: 90, make: (r) => { const p = r.pick([5, 10, 15, 20, 25, 30, 40, 50, 75]); const b = r.pick([40, 60, 80, 120, 160, 200, 240, 300, 360, 480]); return { prompt: `${p}% of ${b}`, answer: fmt((p * b) / 100) } } },
  { id: 'fractions', name: 'Fractions to decimals', description: 'Eighths, sixths, fifths, thirds.', seconds: 60, make: (r) => { const den = r.pick([2, 3, 4, 5, 8, 10]); const num = r.int(1, den - 1); return { prompt: `${num}/${den} as a decimal`, answer: fmt(Math.round((num / den) * 1000) / 1000) } } },
  { id: 'squares', name: 'Squares and cubes', description: 'Squares to 20², cubes to 10³.', seconds: 60, make: (r) => (r.bool(0.7) ? { prompt: `${r.int(2, 20)}²`, answer: '' } : { prompt: `${r.int(2, 10)}³`, answer: '' }) },
  { id: 'division', name: 'Division', description: 'Exact divisions such as 144 ÷ 12.', seconds: 60, make: (r) => { const b = r.int(3, 12), q = r.int(4, 25); return { prompt: `${b * q} ÷ ${b}`, answer: String(q) } } },
  { id: 'estimate', name: 'Estimation', description: 'Pick the nearest round number.', seconds: 60, make: (r) => { const a = r.int(18, 99), b = r.int(18, 99); const exact = a * b; return { prompt: `About how much is ${a} × ${b}? (nearest hundred)`, answer: String(Math.round(exact / 100) * 100) } } },
  { id: 'alphabet', name: 'Alphabet positions', description: 'Letter to number and back.', seconds: 60, make: (r) => { const i = r.int(1, 26); const L = String.fromCharCode(64 + i); return r.bool() ? { prompt: `Position of ${L}`, answer: String(i) } : { prompt: `Letter number ${i}`, answer: L } } },
]

// squares/cubes answers computed from prompt
export function resolveAnswer(item: MentalItem): string {
  if (item.answer) return item.answer
  const m = /^(\d+)([²³])$/.exec(item.prompt)
  if (!m) return item.answer
  const n = Number(m[1])
  return String(m[2] === '²' ? n * n : n * n * n)
}

export function checkAnswer(item: MentalItem, given: string): boolean {
  const want = resolveAnswer(item).trim().toUpperCase()
  const got = given.trim().toUpperCase()
  if (want === got) return true
  const a = Number(want), b = Number(got)
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < 1e-6
}
