import type { Built, Difficulty, Rng, RuleFamily } from '../types'
import { ALPHABET, letterAt, makeGenerator, uniqueDistractors } from './common'

/*
 * Letter-sequence families. Letters are treated as positions 0..25 (A=0) with
 * wraparound. Distractors are built from off-by-one letters, the wrong
 * direction, and the neighbouring series in interleaved patterns.
 */

type LSeries = { terms: string[]; pattern: string; howToSpot: string; trap: string; plausible: (correct: string) => string[] }

const pos = (ch: string) => ALPHABET.indexOf(ch[0]!)

function shift(s: string, k: number): string {
  return s.split('').map((c) => letterAt(pos(c) + k)).join('')
}

function finish(rng: Rng, d: Difficulty, s: LSeries): Built {
  const hideMiddle = d >= 4 && rng.bool(0.3)
  const idx = hideMiddle ? rng.int(1, s.terms.length - 2) : s.terms.length - 1
  const correct = s.terms[idx]!
  const shown = s.terms.map((t, i) => (i === idx ? '__' : t)).join(', ')
  const distractors = uniqueDistractors(
    correct,
    s.plausible(correct),
    () => shift(correct, rng.pick([-3, -2, -1, 1, 2, 3])),
    d >= 3 ? 4 : 3,
  )
  return {
    prompt: hideMiddle ? 'Which letters fill the blank?' : 'Which comes next?',
    stem: shown,
    correct,
    distractors,
    explanation: { pattern: s.pattern, howToSpot: s.howToSpot, trap: s.trap },
  }
}

const len = (d: Difficulty) => (d <= 2 ? 5 : 6)

export const LETTER_FAMILIES: RuleFamily[] = [
  {
    id: 'constant-skip',
    name: 'Constant skip',
    minDifficulty: 1,
    build(rng, d) {
      const step = rng.pick(d === 1 ? [1, 2, 3] : d === 2 ? [2, 3, 4, 5] : [4, 5, 6, 7, 9])
      const start = rng.int(0, d <= 2 ? 25 - step * (len(d) - 1) : 25)
      const terms = Array.from({ length: len(d) }, (_, i) => letterAt(start + i * step))
      return finish(rng, d, {
        terms,
        pattern: `Each letter moves ${step} place${step > 1 ? 's' : ''} forward in the alphabet${d >= 3 ? ', wrapping from Z back to A' : ''}.`,
        howToSpot: 'Write the alphabet positions (A=1 … Z=26) under each letter and subtract neighbours.',
        trap: 'Counting the starting letter as the first step (off by one), or forgetting the wraparound after Z.',
        plausible: (c) => [shift(c, 1), shift(c, -1), shift(c, step), shift(c, -step)],
      })
    },
  },
  {
    id: 'backward',
    name: 'Moving backward',
    minDifficulty: 1,
    build(rng, d) {
      const step = rng.pick(d === 1 ? [1, 2] : d === 2 ? [2, 3, 4] : [3, 5, 6, 8])
      const start = rng.int(d <= 2 ? step * (len(d) - 1) : 0, 25)
      const terms = Array.from({ length: len(d) }, (_, i) => letterAt(start - i * step))
      return finish(rng, d, {
        terms,
        pattern: `Each letter moves ${step} place${step > 1 ? 's' : ''} backward in the alphabet.`,
        howToSpot: 'Letters get earlier each time. Subtract positions; the gap is constant.',
        trap: 'Going forward instead of backward at the blank.',
        plausible: (c) => [shift(c, step), shift(c, 1), shift(c, -1), shift(c, 2 * step)],
      })
    },
  },
  {
    id: 'growing-skip',
    name: 'Growing skip',
    minDifficulty: 1,
    build(rng, d) {
      const inc = d >= 3 ? rng.pick([1, 2]) : 1
      const d0 = rng.int(1, 2)
      const start = rng.int(0, d <= 2 ? 8 : 25)
      const terms = [letterAt(start)]
      let p = start
      let diff = d0
      for (let i = 1; i < len(d); i++) {
        p += diff
        terms.push(letterAt(p))
        diff += inc
      }
      const lastDiff = d0 + inc * (len(d) - 2)
      return finish(rng, d, {
        terms,
        pattern: `The skip grows by ${inc} each time: +${d0}, +${d0 + inc}, +${d0 + 2 * inc}, …`,
        howToSpot: 'Gaps between positions are not constant but increase steadily.',
        trap: 'Repeating the last gap instead of growing it.',
        plausible: (c) => [shift(c, -inc), shift(c, inc), shift(c, -lastDiff - inc), shift(c, 1)],
      })
    },
  },
  {
    id: 'alternating-direction',
    name: 'Forward then back',
    minDifficulty: 2,
    build(rng, d) {
      const fwd = rng.int(3, d <= 2 ? 6 : 10)
      const back = rng.int(1, fwd - 1)
      const start = rng.int(0, 25)
      const terms = [letterAt(start)]
      let p = start
      for (let i = 1; i < len(d) + 1; i++) {
        p += i % 2 === 1 ? fwd : -back
        terms.push(letterAt(p))
      }
      const n = terms.length
      const nextIsFwd = (n - 1) % 2 === 1
      return finish(rng, d, {
        terms,
        pattern: `Alternate +${fwd} and −${back}: forward ${fwd}, back ${back}, forward ${fwd}, …`,
        howToSpot: 'Letters zig-zag: later, earlier, later, earlier. Check which move lands on the blank.',
        trap: 'Applying the wrong one of the two moves at the blank.',
        plausible: (c) => [shift(c, nextIsFwd ? -(fwd + back) : fwd + back), shift(c, 1), shift(c, -1), shift(c, 2)],
      })
    },
  },
  {
    id: 'interleaved',
    name: 'Two interleaved series',
    minDifficulty: 2,
    build(rng, d) {
      const s1 = rng.int(0, 25)
      const st1 = rng.pick([1, 2, 3])
      const s2 = rng.int(0, 25)
      const st2 = rng.pick(d <= 2 ? [-1, 1, 2] : [-2, -3, 4, 5])
      const n = d <= 2 ? 6 : 8
      const terms: string[] = []
      for (let i = 0; i < n; i++) terms.push(i % 2 === 0 ? letterAt(s1 + (i / 2) * st1) : letterAt(s2 + ((i - 1) / 2) * st2))
      const lastIsOdd = (n - 1) % 2 === 1
      return finish(rng, d, {
        terms,
        pattern: `Two series are interleaved: 1st, 3rd, 5th … move +${st1}; 2nd, 4th, 6th … move ${st2 >= 0 ? '+' : ''}${st2}.`,
        howToSpot: 'When gaps make no sense, read every other letter.',
        trap: 'Continuing the wrong series.',
        plausible: (c) => [shift(c, lastIsOdd ? st1 - st2 : st2 - st1), shift(c, 1), shift(c, -1), shift(c, lastIsOdd ? st2 : st1)],
      })
    },
  },
  {
    id: 'pairs',
    name: 'Letter pairs',
    minDifficulty: 2,
    build(rng, d) {
      // e.g. AB, DE, GH  or  AZ, BY, CX (mirror pairs)
      const mirror = d >= 3 && rng.bool(0.45)
      const n = 5
      let terms: string[]
      let pattern: string
      let plausible: (c: string) => string[]
      if (mirror) {
        const start = rng.int(0, 10)
        terms = Array.from({ length: n }, (_, i) => letterAt(start + i) + letterAt(25 - start - i))
        pattern = 'Each pair joins a letter from the start of the alphabet with its mirror from the end (A↔Z, B↔Y, C↔X …), moving inward one step each time.'
        plausible = (c) => [
          letterAt(pos(c) + 1) + letterAt(pos(c[1]!) + 1),
          letterAt(pos(c) - 1) + letterAt(pos(c[1]!) - 1),
          letterAt(pos(c)) + letterAt(pos(c[1]!) + 1),
          letterAt(pos(c) + 1) + letterAt(pos(c[1]!)),
        ]
      } else {
        const step = rng.pick(d <= 2 ? [2, 3] : [3, 4, 5])
        const gap = rng.pick([1, 2])
        const start = rng.int(0, 25)
        terms = Array.from({ length: n }, (_, i) => letterAt(start + i * step) + letterAt(start + i * step + gap))
        pattern = `Each pair is two letters ${gap} apart, and each pair starts ${step} places after the previous one.`
        plausible = (c) => [shift(c, 1), shift(c, -1), c[0]! + letterAt(pos(c[1]!) + 1), letterAt(pos(c) - 1) + c[1]!]
      }
      return finish(rng, d, {
        terms,
        pattern,
        howToSpot: 'Treat each position of the pair as its own series and track them separately.',
        trap: 'Getting one letter of the pair right and the other off by one.',
        plausible,
      })
    },
  },
  {
    id: 'triplets',
    name: 'Three-letter groups',
    minDifficulty: 3,
    build(rng, d) {
      const inner = rng.pick([1, 2])
      const step = rng.pick(d === 3 ? [1, 2] : [3, 4, 5])
      const reverse = d >= 4 && rng.bool(0.4)
      const start = rng.int(0, 25)
      const n = 5
      const terms = Array.from({ length: n }, (_, i) => {
        const b = start + i * step
        const letters = [letterAt(b), letterAt(b + inner), letterAt(b + 2 * inner)]
        return (reverse ? letters.reverse() : letters).join('')
      })
      return finish(rng, d, {
        terms,
        pattern: `Each group is three letters ${inner} apart${reverse ? ', written backward' : ''}; each group starts ${step} place${step > 1 ? 's' : ''} after the last.`,
        howToSpot: 'Compare the first letter of each group across the series, then check the inner spacing.',
        trap: reverse ? 'Writing the group forward instead of backward.' : 'Changing the inner spacing instead of shifting the whole group.',
        plausible: (c) => [shift(c, 1), shift(c, -1), c.split('').reverse().join(''), shift(c, step)],
      })
    },
  },
  {
    id: 'vowel-consonant',
    name: 'Vowel positions',
    minDifficulty: 3,
    build(rng, d) {
      // Sequence of consecutive vowels, or letters with alternating case-like markers (we use vowels then next consonant)
      const vowels = ['A', 'E', 'I', 'O', 'U']
      const useFollow = d >= 4 && rng.bool(0.5)
      const start = rng.int(0, 1)
      const n = 5
      let terms: string[]
      if (useFollow) {
        // vowel followed by the next letter: AB, EF, IJ, OP, UV
        terms = vowels.slice(start, start + n).map((v) => v + letterAt(pos(v) + 1))
        if (terms.length < 5) terms = ['AB', 'EF', 'IJ', 'OP', 'UV']
      } else {
        terms = ['A', 'E', 'I', 'O', 'U', 'A'].slice(start, start + 5)
      }
      return finish(rng, d, {
        terms,
        pattern: useFollow ? 'Each pair is a vowel followed by the letter right after it: AB, EF, IJ, OP, UV.' : 'The vowels in alphabetical order: A, E, I, O, U (then back to A).',
        howToSpot: 'Gaps of 4, 4, 6, 6 between letters point to the vowels.',
        trap: 'Treating it as an arithmetic skip and landing on a consonant.',
        plausible: (c) => [shift(c, 1), shift(c, -1), shift(c, 4), shift(c, 6)],
      })
    },
  },
  {
    id: 'repeat-count',
    name: 'Repeating letter with growing count',
    minDifficulty: 2,
    build(rng, d) {
      // A, BB, CCC, DDDD   or  AB, ABB, ABBB
      const style = d >= 3 && rng.bool(0.5) ? 'prefix' : 'plain'
      const start = rng.int(0, 18)
      const step = rng.pick([1, 2])
      const n = 5
      const terms = Array.from({ length: n }, (_, i) =>
        style === 'plain' ? letterAt(start + i * step).repeat(i + 1) : letterAt(start) + letterAt(start + step).repeat(i + 1),
      )
      return finish(rng, d, {
        terms,
        pattern: style === 'plain' ? `The letter advances ${step} place${step > 1 ? 's' : ''} and is repeated one more time in each term.` : `The first letter stays fixed and the second letter is repeated one more time each term.`,
        howToSpot: 'Terms get longer by one character each step. Count the repeats.',
        trap: 'Getting the letter right but the number of repeats wrong.',
        plausible: (c) => [c.slice(0, -1), c + c[c.length - 1], shift(c, 1), shift(c, -1)],
      })
    },
  },
  {
    id: 'number-letter',
    name: 'Mixed letter and number',
    minDifficulty: 3,
    build(rng, d) {
      // A1, C3, E5, G7  (letter +step, number = position or +k)
      const step = rng.pick([1, 2, 3])
      const nstep = rng.pick(d === 3 ? [1, 2] : [2, 3, 5])
      const start = rng.int(0, 10)
      const n0 = rng.int(1, 9)
      const n = 5
      const terms = Array.from({ length: n }, (_, i) => letterAt(start + i * step) + String(n0 + i * nstep))
      return finish(rng, d, {
        terms,
        pattern: `The letter moves +${step} and the number increases by ${nstep} each term.`,
        howToSpot: 'Split each term into its letter part and number part and solve them as two separate series.',
        trap: 'Getting one part right and the other part off by one step.',
        plausible: (c) => {
          const L = c[0]!
          const num = Number(c.slice(1))
          return [letterAt(pos(L) + 1) + num, L + (num + 1), letterAt(pos(L) - 1) + num, L + (num - nstep), letterAt(pos(L) + step) + (num + nstep)]
        },
      })
    },
  },
  {
    id: 'position-shift',
    name: 'Skip grows then resets',
    minDifficulty: 4,
    build(rng, d) {
      // pattern of skips like +1, +2, +3, +1, +2, +3
      const cycle = rng.pick([[1, 2, 3], [2, 3, 4], [1, 3, 5], [2, 4, 6]])
      const start = rng.int(0, 25)
      const n = 7
      const terms = [letterAt(start)]
      let p = start
      for (let i = 1; i < n; i++) {
        p += cycle[(i - 1) % 3]!
        terms.push(letterAt(p))
      }
      const lastStep = cycle[(n - 2) % 3]!
      const nextStep = cycle[(n - 1) % 3]!
      void nextStep
      return finish(rng, d, {
        terms,
        pattern: `The skips repeat in a cycle: +${cycle.join(', +')}, then again +${cycle.join(', +')}.`,
        howToSpot: 'Write out the gaps; a short repeating group of gaps appears.',
        trap: 'Continuing to grow the skip instead of restarting the cycle.',
        plausible: (c) => [shift(c, lastStep + 1 - lastStep), shift(c, -1), shift(c, 1), shift(c, lastStep), shift(c, -lastStep)],
      })
    },
  },
]

export const letterSequence = makeGenerator('letter-sequence', LETTER_FAMILIES)
