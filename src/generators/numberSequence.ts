import type { Built, Difficulty, Rng, RuleFamily } from '../types'
import { makeGenerator, uniqueDistractors, fmt } from './common'

/*
 * Number-sequence rule families. Each build() returns a series with the last
 * term hidden (or a middle term at higher difficulty) and distractors built
 * from the classic mistakes: applying the wrong step, off-by-one, continuing a
 * neighbouring pattern, or sign/operation errors.
 */

type Series = { terms: number[]; pattern: string; howToSpot: string; trap: string; plausible: (correct: number) => number[] }

function finish(rng: Rng, difficulty: Difficulty, s: Series): Built {
  // At difficulty >= 4 sometimes hide a middle term instead of the last one.
  const hideMiddle = difficulty >= 4 && rng.bool(0.35)
  const idx = hideMiddle ? rng.int(1, s.terms.length - 2) : s.terms.length - 1
  const correct = s.terms[idx]!
  const shown = s.terms.map((t, i) => (i === idx ? '__' : fmt(t))).join(', ')
  const candidates = s.plausible(correct).filter((c) => Number.isFinite(c))
  const distractors = uniqueDistractors(
    fmt(correct),
    candidates.map(fmt),
    () => fmt(correct + rng.pick([-3, -2, -1, 1, 2, 3]) * (Math.abs(correct) > 50 ? rng.int(2, 7) : 1)),
    difficulty >= 3 ? 4 : 3,
  )
  return {
    prompt: hideMiddle ? 'Which number fills the blank?' : 'Which number comes next?',
    stem: shown,
    correct: fmt(correct),
    distractors,
    explanation: { pattern: s.pattern, howToSpot: s.howToSpot, trap: s.trap },
  }
}

const len = (d: Difficulty) => (d <= 2 ? 5 : d === 3 ? 6 : 7)

export const NUMBER_FAMILIES: RuleFamily[] = [
  {
    id: 'arithmetic',
    name: 'Constant difference',
    minDifficulty: 1,
    build(rng, d) {
      const step = rng.pick(d === 1 ? [2, 3, 4, 5, 10] : d === 2 ? [3, 4, 6, 7, 8, 9, 11, 12] : [-9, -7, -6, 13, 14, 17, 19, 23, -13])
      const start = rng.int(d <= 2 ? 1 : -20, d <= 2 ? 20 : 60)
      const n = len(d)
      const terms = Array.from({ length: n }, (_, i) => start + i * step)
      return finish(rng, d, {
        terms,
        pattern: `Each term increases by ${step} (a constant difference).`,
        howToSpot: 'Subtract neighbouring terms. If every difference is the same number, add it once more.',
        trap: 'Adding the wrong step (one more or less than the real one), or stopping one term early.',
        plausible: (c) => [c + step, c - step, c + step + 1, c + step - 1, c + 2 * step],
      })
    },
  },
  {
    id: 'geometric',
    name: 'Constant ratio',
    minDifficulty: 1,
    build(rng, d) {
      const ratio = rng.pick(d === 1 ? [2, 3] : d === 2 ? [2, 3, 4, 5] : [2, 3, 4, 0.5, -2, -3])
      const start = ratio === 0.5 ? rng.pick([256, 512, 1024, 320, 640]) : rng.int(1, d <= 2 ? 4 : 7)
      const n = d <= 2 ? 5 : 6
      const terms = Array.from({ length: n }, (_, i) => start * Math.pow(ratio, i))
      return finish(rng, d, {
        terms,
        pattern: `Each term is multiplied by ${fmt(ratio)} (a constant ratio).`,
        howToSpot: 'When terms grow or shrink fast, divide each term by the one before it. A constant quotient means multiply again.',
        trap: 'Adding the last difference instead of multiplying, which gives a number that is too small (or too large when shrinking).',
        plausible: (c) => [c + (c / ratio - c / ratio / ratio), c / ratio + ratio, c * ratio, c + ratio, c - ratio],
      })
    },
  },
  {
    id: 'increasing-step',
    name: 'Growing difference',
    minDifficulty: 1,
    build(rng, d) {
      const start = rng.int(1, 15)
      const d0 = rng.int(1, d <= 2 ? 4 : 8)
      const inc = rng.pick(d === 1 ? [1] : d === 2 ? [1, 2] : [2, 3, -1, 4])
      const n = len(d)
      const terms = [start]
      let diff = d0
      for (let i = 1; i < n; i++) {
        terms.push(terms[i - 1]! + diff)
        diff += inc
      }
      const lastDiff = terms[n - 1]! - terms[n - 2]!
      return finish(rng, d, {
        terms,
        pattern: `The differences themselves change by ${inc} each time (${d0}, ${d0 + inc}, ${d0 + 2 * inc}, …).`,
        howToSpot: 'If the first differences are not constant, take the differences of the differences. A constant second difference means this pattern.',
        trap: 'Repeating the last difference instead of growing it by one more step.',
        plausible: (c) => [c - inc, c + inc, c + lastDiff, c - lastDiff, c + 1],
      })
    },
  },
  {
    id: 'squares',
    name: 'Squares and cubes',
    minDifficulty: 2,
    build(rng, d) {
      const power = d >= 4 && rng.bool(0.4) ? 3 : 2
      const offset = d >= 3 ? rng.pick([-2, -1, 0, 1, 2, 3]) : 0
      const start = rng.int(1, d <= 2 ? 2 : 4)
      const n = d <= 2 ? 5 : 6
      const terms = Array.from({ length: n }, (_, i) => Math.pow(start + i, power) + offset)
      const name = power === 2 ? 'square' : 'cube'
      return finish(rng, d, {
        terms,
        pattern: `Each term is a perfect ${name} (${start}², ${start + 1}², …)${offset ? ` ${offset > 0 ? 'plus' : 'minus'} ${Math.abs(offset)}` : ''}.`,
        howToSpot: `Memorise squares to 20² and cubes to 10³. Terms near ${name}s with a constant offset are a giveaway; differences grow by a fixed amount for squares.`,
        trap: 'Treating it as a growing-difference series and adding the wrong increment.',
        plausible: (c) => {
          const k = Math.round(Math.pow(c - offset, 1 / power))
          return [Math.pow(k + 1, power) + offset, Math.pow(k - 1, power) + offset, c + 2 * k, c - 1, c + 1]
        },
      })
    },
  },
  {
    id: 'fibonacci',
    name: 'Sum of previous two',
    minDifficulty: 2,
    build(rng, d) {
      const a = rng.int(1, d <= 2 ? 3 : 9)
      const b = rng.int(a, d <= 2 ? 6 : 15)
      const n = d <= 2 ? 6 : 7
      const terms = [a, b]
      for (let i = 2; i < n; i++) terms.push(terms[i - 1]! + terms[i - 2]!)
      return finish(rng, d, {
        terms,
        pattern: 'Each term is the sum of the two terms before it.',
        howToSpot: 'Differences are not constant, but each difference equals the term before it. Add the last two terms.',
        trap: 'Adding only the last difference again, or doubling the last term.',
        plausible: (c) => [c - 1, c + 1, 2 * (c - terms[n - 3]!), c + terms[n - 3]!],
      })
    },
  },
  {
    id: 'alternating-ops',
    name: 'Two alternating operations',
    minDifficulty: 2,
    build(rng, d) {
      const add = rng.int(2, d <= 2 ? 6 : 12)
      const sub = rng.int(1, add - 1)
      const useMul = d >= 3 && rng.bool(0.5)
      const mul = rng.pick([2, 3])
      const start = rng.int(1, 12)
      const n = d <= 2 ? 6 : 7
      const terms = [start]
      for (let i = 1; i < n; i++) {
        const prev = terms[i - 1]!
        if (i % 2 === 1) terms.push(useMul ? prev * mul : prev + add)
        else terms.push(prev - sub)
      }
      const nextIsFirstOp = (n - 1) % 2 === 1
      const wrongOp = (c: number) => (nextIsFirstOp ? c + sub : useMul ? c * mul : c + add)
      return finish(rng, d, {
        terms,
        pattern: `Two operations alternate: ${useMul ? `×${mul}` : `+${add}`}, then −${sub}, then ${useMul ? `×${mul}` : `+${add}`}, …`,
        howToSpot: 'A zig-zag of up, down, up, down with the same two moves repeating. Check the position of the blank to know which move applies.',
        trap: 'Applying the wrong one of the two operations for that position.',
        plausible: (c) => [wrongOp(c), c + 1, c - 1, c + add + sub, c - add],
      })
    },
  },
  {
    id: 'interleaved',
    name: 'Two interleaved series',
    minDifficulty: 2,
    build(rng, d) {
      const s1 = rng.int(1, 20)
      const st1 = rng.pick([2, 3, 4, 5, 10])
      const s2 = rng.int(1, 30)
      const st2 = rng.pick(d <= 2 ? [-1, -2, 1, 3] : [-3, -4, 6, 7, 11])
      const n = d <= 2 ? 6 : 8
      const terms: number[] = []
      for (let i = 0; i < n; i++) terms.push(i % 2 === 0 ? s1 + (i / 2) * st1 : s2 + ((i - 1) / 2) * st2)
      const lastIsOdd = (n - 1) % 2 === 1
      return finish(rng, d, {
        terms,
        pattern: `Two series are woven together: odd positions go ${s1}, ${s1 + st1}, ${s1 + 2 * st1}, … (+${st1}); even positions go ${s2}, ${s2 + st2}, … (${st2 >= 0 ? '+' : ''}${st2}).`,
        howToSpot: 'When differences jump around with no pattern, look at every other term. Two simple series usually appear.',
        trap: 'Continuing the wrong one of the two series, or mixing their steps.',
        plausible: (c) => [c + (lastIsOdd ? st1 : st2), c - (lastIsOdd ? st2 : st1), c + 1, c - 1, c + st1 + st2],
      })
    },
  },
  {
    id: 'multiply-add',
    name: 'Multiply then add',
    minDifficulty: 3,
    build(rng, d) {
      const m = rng.pick([2, 3])
      const k = rng.pick(d === 3 ? [1, -1, 2] : [-2, 3, -3, 4, 5])
      const start = rng.int(1, 6)
      const n = 6
      const terms = [start]
      for (let i = 1; i < n; i++) terms.push(terms[i - 1]! * m + k)
      return finish(rng, d, {
        terms,
        pattern: `Each term is the previous term × ${m} ${k >= 0 ? '+' : '−'} ${Math.abs(k)}.`,
        howToSpot: 'Differences roughly double or triple each time (a constant ratio of differences) but the terms themselves are not an exact geometric series.',
        trap: `Multiplying by ${m} and forgetting the ${k >= 0 ? '+' : '−'}${Math.abs(k)}, or adding the last difference.`,
        plausible: (c) => [c - k, c + (terms[n - 1]! - terms[n - 2]!), (c - k) / m * m + 2 * k, c + m, c - m],
      })
    },
  },
  {
    id: 'primes',
    name: 'Prime numbers',
    minDifficulty: 3,
    build(rng, d) {
      const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97]
      const skip = d >= 4 && rng.bool(0.4) ? 2 : 1
      const startIdx = rng.int(0, d === 3 ? 4 : 8)
      const n = 6
      const terms = Array.from({ length: n }, (_, i) => primes[startIdx + i * skip]!)
      return finish(rng, d, {
        terms,
        pattern: skip === 1 ? 'Consecutive prime numbers.' : 'Every second prime number.',
        howToSpot: 'Odd differences that look random and no term divisible by 2, 3, 5 or 7 (other than themselves). Know the primes to 100.',
        trap: 'Picking the next odd number (which may be composite, like 9, 15, 21, 25, 27, 33, 35).',
        plausible: (c) => {
          const odd = [c + 2, c - 2, c + 4, c - 4].filter((x) => !primes.includes(x))
          return [...odd, c + 1, c + 2]
        },
      })
    },
  },
  {
    id: 'position-rule',
    name: 'Rule based on position',
    minDifficulty: 3,
    build(rng, d) {
      // a_n = n*k + c  or n*(n+1) or n^2 + n etc.
      const kind = rng.pick(d === 3 ? ['n(n+1)', 'nk+c'] : ['n(n+1)', 'nk+c', 'n^2-n', 'n(n+2)'])
      const k = rng.int(2, 7)
      const c = rng.int(-5, 9)
      const n = 6
      const f = (i: number) => {
        const x = i + 1
        switch (kind) {
          case 'n(n+1)': return x * (x + 1)
          case 'n^2-n': return x * x - x
          case 'n(n+2)': return x * (x + 2)
          default: return x * k + c
        }
      }
      const terms = Array.from({ length: n }, (_, i) => f(i))
      const desc = kind === 'nk+c' ? `${k}n ${c >= 0 ? '+' : '−'} ${Math.abs(c)}` : kind.replace(/n/g, 'n')
      return finish(rng, d, {
        terms,
        pattern: `The n-th term equals ${desc}, where n is its position (1, 2, 3, …).`,
        howToSpot: 'Try relating each term to its position number. Products of consecutive numbers (2, 6, 12, 20, …) are common.',
        trap: 'Treating a quadratic position rule as a constant-difference series.',
        plausible: (cv) => [cv + (terms[n - 1]! - terms[n - 2]!), cv - 2, cv + 2, cv + n + 1, f(n) - 1],
      })
    },
  },
  {
    id: 'digit-rule',
    name: 'Rule on the digits',
    minDifficulty: 4,
    build(rng, d) {
      // next = prev + sum of digits of prev   OR  prev + product of its digits
      const useProduct = rng.bool(0.4)
      let start = rng.int(11, 39)
      if (useProduct && String(start).includes('0')) start += 1
      const n = 6
      const terms = [start]
      const digits = (x: number) => String(x).split('').map(Number)
      for (let i = 1; i < n; i++) {
        const p = terms[i - 1]!
        const ds = digits(p)
        terms.push(p + (useProduct ? ds.reduce((a, b) => a * b, 1) : ds.reduce((a, b) => a + b, 0)))
      }
      const last = terms[n - 2]!
      const ds = digits(last)
      const other = useProduct ? ds.reduce((a, b) => a + b, 0) : ds.reduce((a, b) => a * b, 1)
      return finish(rng, d, {
        terms,
        pattern: `Each term is the previous term plus the ${useProduct ? 'product' : 'sum'} of its digits.`,
        howToSpot: 'Differences look irregular but small. Compare each difference with the digits of the term before it.',
        trap: `Using the ${useProduct ? 'sum' : 'product'} of digits instead of the ${useProduct ? 'product' : 'sum'}.`,
        plausible: (c) => [last + other, c + 1, c - 1, c + (terms[n - 2]! - terms[n - 3]!), c + 2],
      })
    },
  },
  {
    id: 'triangular',
    name: 'Triangular numbers',
    minDifficulty: 3,
    build(rng, d) {
      const offset = rng.pick([0, 0, 1, -1, 2])
      const startN = rng.int(1, 4)
      const n = 6
      const terms = Array.from({ length: n }, (_, i) => ((startN + i) * (startN + i + 1)) / 2 + offset)
      return finish(rng, d, {
        terms,
        pattern: `Triangular numbers (1, 3, 6, 10, 15, 21, …)${offset ? ` ${offset > 0 ? 'plus' : 'minus'} ${Math.abs(offset)}` : ''}: the differences go up by 1 each time.`,
        howToSpot: 'First differences are consecutive integers (2, 3, 4, 5, …).',
        trap: 'Repeating the last difference instead of increasing it by one.',
        plausible: (c) => {
          const lastDiff = terms[n - 1]! - terms[n - 2]!
          return [c - 1, c + 1, c + lastDiff, c + lastDiff + 2]
        },
      })
    },
  },
]

export const numberSequence = makeGenerator('number-sequence', NUMBER_FAMILIES)
