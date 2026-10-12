import type { Built, Difficulty, Rng, RuleFamily } from '../types'
import { makeGenerator, sample, uniqueDistractors } from './common'

/*
 * Logical-reasoning families: syllogisms, conditionals, ordering, seating,
 * sets, schedules, and "must be true" items. Answers are statements; the
 * distractors are the classic invalid inferences (converse, inverse,
 * reversed order, "some" treated as "all").
 */

const PEOPLE = ['Ana', 'Ben', 'Cal', 'Dee', 'Eli', 'Fay', 'Gus', 'Hal', 'Ida', 'Jo']
const GROUPS = ['pilots', 'analysts', 'coders', 'medics', 'drivers', 'linguists', 'engineers', 'musicians', 'runners', 'cooks']
const TRAITS = ['drink coffee', 'own a bicycle', 'speak two languages', 'have a security clearance', 'like puzzles', 'wear glasses', 'play chess', 'run marathons']
/** Third-person singular form of a trait: "drink coffee" → "drinks coffee". */
function sing(t: string) {
  const [v, ...rest] = t.split(' ')
  const v3 = v === 'have' ? 'has' : v + 's'
  return [v3, ...rest].join(' ')
}
const COND_PAIRS: [string, string][] = [
  ['a file is encrypted', 'it is backed up'],
  ['a user is an admin', 'the user can delete logs'],
  ['a port is open', 'the scan flags it'],
  ['a badge is red', 'its holder is escorted'],
  ['a drive is mounted', 'the drive is indexed'],
]
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const ADJ: [string, string][] = [['taller', 'shorter'], ['older', 'younger'], ['faster', 'slower'], ['heavier', 'lighter']]

function textQ(prompt: string, stem: string, correct: string, cands: string[], fallback: () => string, expl: Built['explanation'], d: Difficulty): Built {
  return { prompt, stem, correct, distractors: uniqueDistractors(correct, cands, fallback, d >= 3 ? 4 : 3), explanation: expl }
}

const CBD = 'Cannot be determined from the information given'

function names(rng: Rng, n: number) {
  return sample(rng, PEOPLE, n)
}

export const LOGIC_FAMILIES: RuleFamily[] = [
  {
    id: 'syllogism',
    name: 'Syllogisms (all / some / no)',
    minDifficulty: 1,
    build(rng, d) {
      const [A, B, C] = sample(rng, GROUPS, 3) as [string, string, string]
      const form = rng.pick(d === 1 ? ['all-all'] : d === 2 ? ['all-all', 'all-no'] : ['all-all', 'all-no', 'some-all', 'all-some'])
      let stem = '', correct = '', cands: string[] = [], pattern = ''
      if (form === 'all-all') {
        stem = `All ${A} are ${B}. All ${B} are ${C}.`
        correct = `All ${A} are ${C}.`
        cands = [`All ${C} are ${A}.`, `All ${B} are ${A}.`, `Some ${C} are not ${B}.`, `No ${A} are ${C}.`, CBD]
        pattern = `Two "all" chains link: ${A} → ${B} → ${C}, so all ${A} are ${C}.`
      } else if (form === 'all-no') {
        stem = `All ${A} are ${B}. No ${B} are ${C}.`
        correct = `No ${A} are ${C}.`
        cands = [`Some ${C} are ${A}.`, `All ${C} are ${A}.`, `Some ${A} are ${C}.`, `All ${B} are ${A}.`, CBD]
        pattern = `All ${A} sit inside the group of ${B}, and ${B} share nothing with ${C}, so no ${A} are ${C}.`
      } else if (form === 'some-all') {
        stem = `Some ${A} are ${B}. All ${B} are ${C}.`
        correct = `Some ${A} are ${C}.`
        cands = [`All ${A} are ${C}.`, `All ${C} are ${A}.`, `No ${A} are ${C}.`, `Some ${C} are not ${B}.`, CBD]
        pattern = `The ${A} that are ${B} must also be ${C}, so at least some ${A} are ${C}. Nothing follows about all of them.`
      } else {
        stem = `All ${A} are ${B}. Some ${B} are ${C}.`
        correct = CBD
        cands = [`Some ${A} are ${C}.`, `All ${A} are ${C}.`, `No ${A} are ${C}.`, `Some ${C} are ${A}.`]
        pattern = `The ${B} that are ${C} might not be any of the ${A}. No link between ${A} and ${C} is established.`
      }
      return textQ('Which conclusion must be true?', stem, correct, cands, () => `All ${C} are ${B}.`, {
        pattern,
        howToSpot: 'Draw circles: "all A are B" puts circle A inside B; "no" separates circles; "some" overlaps them. Then read the picture.',
        trap: 'Reversing an "all" statement (all A are B does not mean all B are A), or treating "some" as "all".',
      }, d)
    },
  },
  {
    id: 'conditional',
    name: 'If-then reasoning',
    minDifficulty: 1,
    build(rng, d) {
      const P = rng.pick(['it rains', 'the server is down', 'the alarm sounds', 'the test is passed', 'the light is green'])
      const Q = rng.pick(['the drill is cancelled', 'the backup runs', 'the doors lock', 'the badge is issued', 'traffic moves'])
      const form = rng.pick(d === 1 ? ['mp', 'mt'] : ['mp', 'mt', 'ac', 'dn'])
      let stem = '', correct = '', cands: string[] = [], pattern = ''
      const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1)
      if (form === 'mp') {
        stem = `If ${P}, then ${Q}. ${cap(P)}.`
        correct = `${cap(Q)}.`
        cands = [`It is not the case that ${Q}.`, `It is not the case that ${P}.`, CBD, `It is uncertain whether ${Q}.`]
        pattern = 'The condition is met, so the result follows (modus ponens).'
      } else if (form === 'mt') {
        stem = `If ${P}, then ${Q}. It is not the case that ${Q}.`
        correct = `It is not the case that ${P}.`
        cands = [`${cap(P)}.`, `${cap(Q)}.`, CBD, `It is uncertain whether ${P}.`]
        pattern = 'If the result did not happen, the condition cannot have happened (modus tollens).'
      } else if (form === 'ac') {
        stem = `If ${P}, then ${Q}. ${cap(Q)}.`
        correct = CBD
        cands = [`${cap(P)}.`, `It is not the case that ${P}.`, `It is not the case that ${Q}.`, `It is certain that ${P}.`]
        pattern = `${cap(Q)} could happen for other reasons. Knowing the result tells you nothing certain about the condition (affirming the consequent is invalid).`
      } else {
        stem = `If ${P}, then ${Q}. It is not the case that ${P}.`
        correct = CBD
        cands = [`It is not the case that ${Q}.`, `${cap(Q)}.`, `${cap(P)}.`, `It is impossible that ${Q}.`]
        pattern = `The rule only says what happens when ${P}. When it does not, ${Q} may or may not happen (denying the antecedent is invalid).`
      }
      return textQ('What follows with certainty?', stem, correct, cands, () => `${cap(P)} and ${Q} are unrelated.`, {
        pattern,
        howToSpot: 'Only two moves are valid: condition true ⇒ result true; result false ⇒ condition false. Anything else is "cannot be determined".',
        trap: 'Reading "if P then Q" as "if Q then P" or as "if not P then not Q".',
      }, d)
    },
  },
  {
    id: 'ordering',
    name: 'Ordering chains',
    minDifficulty: 1,
    build(rng, d) {
      const n = d === 1 ? 3 : d === 2 ? 4 : 5
      const ppl = names(rng, n)
      const [more, less] = rng.pick(ADJ)
      // ppl[0] is the most; ppl[n-1] the least. Give pairwise clues.
      const clues: string[] = []
      const order = rng.shuffle(Array.from({ length: n - 1 }, (_, i) => i))
      for (const i of order) {
        const a = ppl[i]!, b = ppl[i + 1]!
        clues.push(rng.bool() ? `${a} is ${more} than ${b}.` : `${b} is ${less} than ${a}.`)
      }
      const askMost = rng.bool()
      const correct = askMost ? ppl[0]! : ppl[n - 1]!
      const cands = ppl.filter((p) => p !== correct)
      return textQ(`Who is the ${askMost ? more.replace('er', 'est').replace('faster', 'fastest') : less.replace('er', 'est')}?`, clues.join(' '), correct, cands, () => rng.pick(PEOPLE), {
        pattern: `Chain the clues: ${ppl.join(' > ')}. The ${askMost ? 'first' : 'last'} is ${correct}.`,
        howToSpot: 'Write the names in a line as each clue arrives, inserting each new person relative to one you already placed.',
        trap: 'Misreading "shorter than" as "taller than" when the sentence is flipped.',
      }, d)
    },
  },
  {
    id: 'seating',
    name: 'Seats in a row',
    minDifficulty: 2,
    build(rng, d) {
      const n = d <= 2 ? 4 : 5
      const ppl = names(rng, n)
      // positions 1..n left to right
      const clues: string[] = []
      clues.push(`${ppl[0]} sits at the far left.`)
      for (let i = 1; i < n; i++) {
        const prev = ppl[i - 1]!
        const cur = ppl[i]!
        if (i === n - 1 && n >= 5) clues.push(`${cur} sits at the far right.`)
        else clues.push(rng.bool() ? `${cur} sits immediately to the right of ${prev}.` : `${prev} sits immediately to the left of ${cur}.`)
      }
      const askIdx = rng.int(1, n - 2)
      const correct = ppl[askIdx]!
      const kind = rng.pick(['between', 'position'])
      const prompt = kind === 'between' ? `Who sits between ${ppl[askIdx - 1]} and ${ppl[askIdx + 1]}?` : `Who sits in seat ${askIdx + 1} counting from the left?`
      return textQ(prompt, rng.shuffle(clues).join(' '), correct, ppl.filter((p) => p !== correct), () => rng.pick(PEOPLE), {
        pattern: `Left to right: ${ppl.join(', ')}.`,
        howToSpot: 'Draw the seats as boxes and fill them from the anchor clue ("far left") outward.',
        trap: 'Confusing "left of" with "right of", or counting seats from the wrong end.',
      }, d)
    },
  },
  {
    id: 'sets',
    name: 'Overlapping groups',
    minDifficulty: 2,
    build(rng, d) {
      const total = rng.pick([20, 24, 30, 40, 50])
      const a = rng.int(Math.floor(total * 0.4), Math.floor(total * 0.7))
      const b = rng.int(Math.floor(total * 0.3), Math.floor(total * 0.6))
      const both = rng.int(Math.max(1, a + b - total), Math.min(a, b) - 1)
      const neither = total - (a + b - both)
      const [X, Y] = sample(rng, TRAITS, 2) as [string, string]
      const ask = rng.pick(d <= 2 ? ['neither', 'only-a'] : ['neither', 'only-a', 'either'])
      const ans = ask === 'neither' ? neither : ask === 'only-a' ? a - both : a + b - both
      const prompt = ask === 'neither' ? 'How many do neither?' : ask === 'only-a' ? `How many ${X} but do not ${Y}?` : 'How many do at least one of the two?'
      return textQ(prompt, `In a flight of ${total} airmen, ${a} ${X}, ${b} ${Y}, and ${both} do both.`, String(ans), [String(total - a - b), String(a + b), String(a - both + (ask === 'only-a' ? both : 0) + 1), String(both), String(total - both), String(ans + 1), String(ans - 1)], () => String(ans + rng.int(2, 6)), {
        pattern: `At least one = ${a} + ${b} − ${both} = ${a + b - both}. Neither = ${total} − ${a + b - both} = ${neither}. Only the first = ${a} − ${both} = ${a - both}.`,
        howToSpot: 'Draw two overlapping circles. Fill the overlap first, then the "only" regions, then what is left over.',
        trap: 'Adding the two groups without subtracting the overlap (double counting).',
      }, d)
    },
  },
  {
    id: 'must-be-true',
    name: 'Must / could / cannot',
    minDifficulty: 2,
    build(rng, d) {
      const [A, B] = sample(rng, GROUPS, 2) as [string, string]
      const trait = rng.pick(TRAITS)
      const variant = rng.pick(d <= 2 ? ['all-some'] : ['all-some', 'no-some', 'some-some'])
      let stem = '', correct = '', cands: string[] = [], pattern = ''
      if (variant === 'all-some') {
        stem = `All ${A} ${trait}. Some ${B} are ${A}.`
        correct = `Some ${B} ${trait}.`
        cands = [`All ${B} ${trait}.`, `No ${B} ${trait}.`, `Only ${A} ${trait}.`, `Some ${A} are not ${B}.`, CBD]
        pattern = `The ${B} who are ${A} must ${trait}. So some ${B} do.`
      } else if (variant === 'no-some') {
        stem = `No ${A} ${trait}. Some ${B} are ${A}.`
        correct = `Some ${B} do not ${trait}.`
        cands = [`No ${B} ${trait}.`, `All ${B} ${trait}.`, `No ${B} are ${A}.`, `Some ${A} ${trait}.`, CBD]
        pattern = `The ${B} who are ${A} cannot ${trait}, so at least some ${B} do not.`
      } else {
        stem = `Some ${A} ${trait}. Some ${B} are ${A}.`
        correct = CBD
        cands = [`Some ${B} ${trait}.`, `No ${B} ${trait}.`, `All ${A} who ${trait} are ${B}.`, `Some ${B} do not ${trait}.`]
        pattern = `The ${A} who ${trait} and the ${A} who are ${B} might be different people. Nothing is forced.`
      }
      return textQ('Which statement must be true?', stem, correct, cands, () => `All ${B} are ${A}.`, {
        pattern,
        howToSpot: 'Ask of each option: can I draw a picture consistent with the premises where this option is false? If yes, it is not forced.',
        trap: 'Assuming two "some" statements refer to the same individuals.',
      }, d)
    },
  },
  {
    id: 'contrapositive',
    name: 'Equivalent statements',
    minDifficulty: 3,
    build(rng, d) {
      const [P, Q] = rng.pick(COND_PAIRS)
      const neg = (s: string) => (s.includes(' can ') ? s.replace(' can ', ' cannot ') : s.replace(' is ', ' is not '))
      const stem = `If ${P}, then ${Q}.`
      const correct = `If ${neg(Q)}, then ${neg(P)}.`
      const cands = [`If ${Q}, then ${P}.`, `If ${neg(P)}, then ${neg(Q)}.`, `${P[0]!.toUpperCase() + P.slice(1)} only if ${neg(Q)}.`, `If ${neg(Q)}, then ${P}.`, `${Q[0]!.toUpperCase() + Q.slice(1)} if and only if ${P}.`]
      return textQ('Which statement is logically equivalent?', stem, correct, cands, () => `If ${neg(P)}, then ${Q}.`, {
        pattern: 'A conditional is equivalent to its contrapositive: swap the two parts and negate both.',
        howToSpot: 'Write P → Q. Only ¬Q → ¬P says the same thing. The converse (Q → P) and inverse (¬P → ¬Q) do not.',
        trap: 'Picking the converse or the inverse because they use the same words.',
      }, d)
    },
  },
  {
    id: 'schedule',
    name: 'Scheduling constraints',
    minDifficulty: 3,
    build(rng, d) {
      const n = d === 3 ? 4 : 5
      const days = DAYS.slice(0, n)
      const tasks = sample(rng, ['the briefing', 'the inspection', 'the drill', 'the audit', 'the upgrade'], n)
      // hidden assignment: tasks[i] on days[i]
      const clues: string[] = []
      const anchor = rng.int(0, n - 1)
      clues.push(`${cap(tasks[anchor]!)} is on ${days[anchor]}.`)
      for (let i = 0; i < n; i++) {
        if (i === anchor) continue
        const rel = rng.pick(['before', 'after', 'day'])
        if (rel === 'day' || Math.abs(i - anchor) > 2) {
          const other = i > 0 ? i - 1 : i + 1
          clues.push(`${cap(tasks[i]!)} is the day ${i > other ? 'after' : 'before'} ${tasks[other]}.`)
        } else if (i < anchor) clues.push(`${cap(tasks[i]!)} is ${anchor - i === 1 ? 'the day' : `${anchor - i} days`} before ${tasks[anchor]}.`)
        else clues.push(`${cap(tasks[i]!)} is ${i - anchor === 1 ? 'the day' : `${i - anchor} days`} after ${tasks[anchor]}.`)
      }
      const askI = rng.int(0, n - 1)
      const askDay = rng.bool()
      const correct = askDay ? days[askI]! : cap(tasks[askI]!)
      const cands = askDay ? days.filter((x) => x !== correct) : tasks.map(cap).filter((x) => x !== correct)
      return textQ(askDay ? `On which day is ${tasks[askI]}?` : `What happens on ${days[askI]}?`, rng.shuffle(clues).join(' '), correct, cands, () => 'Saturday', {
        pattern: `${days.map((day, i) => `${day}: ${tasks[i]}`).join('; ')}.`,
        howToSpot: 'Start from the clue that names a day outright, then place everything relative to it.',
        trap: 'Counting "two days before Thursday" as Wednesday (it is Tuesday).',
      }, d)
    },
  },
  {
    id: 'matching',
    name: 'Who has what',
    minDifficulty: 3,
    build(rng, d) {
      const n = d === 3 ? 3 : 4
      const ppl = names(rng, n)
      const items = sample(rng, ['the red laptop', 'the blue laptop', 'the grey laptop', 'the black laptop', 'the white laptop'], n)
      // ppl[i] has items[i]
      const clues: string[] = []
      clues.push(`${ppl[0]} has ${items[0]}.`)
      for (let i = 1; i < n; i++) {
        const notIdx = (i + 1) % n
        if (i === n - 1) clues.push(`${ppl[i]} does not have ${items[notIdx]}${n > 2 ? ` or ${items[(i + 2) % n]}` : ''}.`.replace(` or ${items[0]}`, '').replace(` or ${items[i]}`, ''))
        else clues.push(`${ppl[i]} does not have ${items[notIdx]}.`)
      }
      const askI = rng.int(1, n - 1)
      const correct = items[askI]!
      const spare = ['the green laptop', 'the silver laptop', 'the orange laptop', 'the purple laptop'].filter((x) => !items.includes(x))
      return textQ(`What does ${ppl[askI]} have?`, clues.join(' '), correct, [...items.filter((x) => x !== correct), ...spare], () => rng.pick(spare), {
        pattern: `${ppl.map((p, i) => `${p}: ${items[i]}`).join('; ')}.`,
        howToSpot: 'Use a grid of people × items. Mark each "does not have" with an X; when a row has one blank left, that is the answer, and it eliminates that column for everyone else.',
        trap: 'Forgetting that once an item is assigned, nobody else can have it.',
      }, d)
    },
  },
  {
    id: 'numeric-chain',
    name: 'Comparing quantities',
    minDifficulty: 2,
    build(rng, d) {
      const n = d <= 2 ? 3 : 4
      const ppl = names(rng, n)
      const base = rng.int(10, 30)
      const diffs = Array.from({ length: n - 1 }, () => rng.int(2, 9))
      // ppl[0] has base; each next has more by diffs
      const vals = [base]
      for (const df of diffs) vals.push(vals[vals.length - 1]! + df)
      const clues = [`${ppl[0]} has ${base} ${rng.pick(['badges', 'tokens', 'points'])}.`]
      for (let i = 1; i < n; i++) clues.push(rng.bool() ? `${ppl[i]} has ${diffs[i - 1]} more than ${ppl[i - 1]}.` : `${ppl[i - 1]} has ${diffs[i - 1]} fewer than ${ppl[i]}.`)
      const askI = rng.int(1, n - 1)
      const askTotal = d >= 4 && rng.bool(0.5)
      const total = vals.reduce((a, b) => a + b, 0)
      const correct = askTotal ? String(total) : String(vals[askI])
      const cands = askTotal ? [String(total - diffs[0]!), String(total + diffs[0]!), String(vals[n - 1]! * n), String(total + 1)] : [String(vals[askI]! - 2 * diffs[askI - 1]!), String(vals[askI]! + diffs[askI - 1]!), String(vals[askI]! - 1), String(vals[askI]! + 1)]
      return textQ(askTotal ? 'How many do they have altogether?' : `How many does ${ppl[askI]} have?`, clues.join(' '), correct, cands, () => String(vals[askI]! + rng.int(2, 10)), {
        pattern: `${ppl.map((p, i) => `${p}: ${vals[i]}`).join(', ')}${askTotal ? `; total ${total}` : ''}.`,
        howToSpot: 'Translate each sentence into "X = Y + k" and work forward from the known value.',
        trap: '"A has 5 fewer than B" means B = A + 5, not A = B + 5.',
      }, d)
    },
  },
  {
    id: 'negation',
    name: 'Negating a statement',
    minDifficulty: 2,
    build(rng, d) {
      const G = rng.pick(GROUPS)
      const T = rng.pick(TRAITS)
      const form = rng.pick(d <= 2 ? ['all', 'no'] : ['all', 'no', 'some', 'some-not'])
      let stem = '', correct = '', cands: string[] = []
      if (form === 'all') { stem = `All ${G} ${T}.`; correct = `At least one of the ${G} does not ${T}.`; cands = [`No ${G} ${T}.`, `Some ${G} ${T}.`, `All ${G} do not ${T}.`, `Most ${G} ${T}.`] }
      else if (form === 'no') { stem = `No ${G} ${T}.`; correct = `At least one of the ${G} ${sing(T)}.`; cands = [`All ${G} ${T}.`, `Some ${G} do not ${T}.`, `Most ${G} ${T}.`, `Exactly one of the ${G} ${sing(T)}.`] }
      else if (form === 'some') { stem = `Some ${G} ${T}.`; correct = `No ${G} ${T}.`; cands = [`All ${G} ${T}.`, `Some ${G} do not ${T}.`, `Most ${G} do not ${T}.`, `Exactly one of the ${G} ${sing(T)}.`] }
      else { stem = `Some ${G} do not ${T}.`; correct = `All ${G} ${T}.`; cands = [`No ${G} ${T}.`, `Some ${G} ${T}.`, `Most ${G} ${T}.`, `Exactly one of the ${G} ${sing(T)}.`] }
      return textQ('Which statement is the exact negation (true whenever the given statement is false)?', stem, correct, cands, () => `Half of the ${G} ${T}.`, {
        pattern: 'The negation of "all" is "at least one does not"; the negation of "no" is "at least one does"; the negation of "some" is "none".',
        howToSpot: 'The negation must be true in every case where the original is false, and false whenever the original is true.',
        trap: 'Treating "no X are Y" as the opposite of "all X are Y". Both can be false at the same time.',
      }, d)
    },
  },
]

function cap(s: string) {
  return s[0]!.toUpperCase() + s.slice(1)
}

export const logic = makeGenerator('logic', LOGIC_FAMILIES)
