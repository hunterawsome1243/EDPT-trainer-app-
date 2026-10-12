import type { Built, Difficulty, Rng, RuleFamily } from '../types'
import { fmt, gcd, makeGenerator, uniqueDistractors } from './common'

/*
 * Arithmetic reasoning (word problem) families. Numbers are chosen so that
 * answers are clean (integers or simple decimals) because the real test is
 * taken without a calculator. Distractors come from the classic wrong
 * operation, wrong order, or forgetting one step.
 */

const NAMES = ['Alex', 'Jordan', 'Sam', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Devin', 'Avery', 'Quinn']
const ITEMS = ['notebooks', 'cables', 'tickets', 'batteries', 'badges', 'flash drives', 'water bottles', 'keyboards']

function withUnit(v: number | string, unit: string): string {
  if (typeof v === 'string') return v
  if (unit === ' hours' && v === 1) return '1 hour'
  return fmt(v) + unit
}

function wp(stem: string, correct: number | string, cands: (number | string)[], fallback: () => number | string, expl: Built['explanation'], unit = '', d: Difficulty = 3): Built {
  const c = withUnit(correct, unit)
  // Quantities in these problems are never negative or zero; drop such candidates.
  const ok = (x: number | string) => typeof x === 'string' || x > 0
  const candidates = cands.filter(ok).map((x) => withUnit(x, unit))
  const distractors = uniqueDistractors(c, candidates, () => {
    let f = fallback()
    let guard = 0
    while (!ok(f) && guard++ < 20) f = fallback()
    return withUnit(f, unit)
  }, d >= 3 ? 4 : 3)
  return { prompt: 'Solve.', stem, correct: c, distractors, explanation: expl }
}

const jitter = (rng: Rng, v: number, unitStep = 1) => v + rng.pick([-3, -2, -1, 1, 2, 3]) * unitStep

export const ARITHMETIC_FAMILIES: RuleFamily[] = [
  {
    id: 'percent-of',
    name: 'Percent of a number',
    minDifficulty: 1,
    build(rng, d) {
      const pct = rng.pick(d === 1 ? [10, 20, 25, 50] : d === 2 ? [5, 15, 30, 40, 75] : [12, 35, 45, 65, 85, 2.5])
      const base = rng.pick(d <= 2 ? [40, 60, 80, 120, 200, 300] : [240, 360, 480, 640, 1200, 1600])
      const ans = (pct * base) / 100
      const name = rng.pick(NAMES)
      return wp(
        `${name} scored ${pct}% on a test with ${base} points available. How many points did ${name} earn?`,
        ans,
        [base - ans, (pct * base) / 10, ans * 2, ans / 2, base / pct, ans + 10],
        () => jitter(rng, ans, 5),
        {
          pattern: `${pct}% of ${base} = ${pct}/100 × ${base} = ${fmt(ans)}.`,
          howToSpot: 'Break the percent into easy pieces: 10% is one tenth, 5% is half of that, 1% is one hundredth.',
          trap: `Giving the remaining points (${fmt(base - ans)}) instead of the points earned, or slipping a decimal place.`,
        },
        '',
        d,
      )
    },
  },
  {
    id: 'percent-change',
    name: 'Percent increase or decrease',
    minDifficulty: 2,
    build(rng, d) {
      const pct = rng.pick(d <= 2 ? [10, 20, 25, 50] : [15, 30, 40, 60, 5])
      const base = rng.pick([40, 60, 80, 120, 160, 200, 240, 400])
      const inc = rng.bool()
      const ans = inc ? base + (base * pct) / 100 : base - (base * pct) / 100
      const wrong = inc ? base - (base * pct) / 100 : base + (base * pct) / 100
      return wp(
        `A ${rng.pick(['monthly bill', 'rent', 'subscription', 'parking fee'])} of $${base} ${inc ? 'increases' : 'decreases'} by ${pct}%. What is the new amount?`,
        `$${fmt(ans)}`,
        [`$${fmt(wrong)}`, `$${fmt((base * pct) / 100)}`, `$${fmt(ans + (inc ? 10 : -10))}`, `$${fmt(base)}`],
        () => `$${fmt(jitter(rng, ans, 4))}`,
        {
          pattern: `${pct}% of ${base} is ${fmt((base * pct) / 100)}; ${inc ? 'add' : 'subtract'} it: ${fmt(ans)}.`,
          howToSpot: 'Compute the percent first, then adjust the original. For speed, multiply by 1.xx (increase) or 0.xx (decrease).',
          trap: 'Reporting the change itself rather than the new total, or going the wrong direction.',
        },
        '',
        d,
      )
    },
  },
  {
    id: 'ratio-share',
    name: 'Splitting in a ratio',
    minDifficulty: 2,
    build(rng, d) {
      const a = rng.int(1, d <= 2 ? 3 : 5)
      const b = rng.int(a + 1, d <= 2 ? 5 : 9)
      const unit = rng.pick(d <= 2 ? [4, 5, 6, 10] : [7, 8, 9, 12, 15])
      const total = (a + b) * unit
      const askLarger = rng.bool()
      const ans = (askLarger ? b : a) * unit
      const other = (askLarger ? a : b) * unit
      return wp(
        `$${total} is split between two people in the ratio ${a}:${b}. How much does the person with the ${askLarger ? 'larger' : 'smaller'} share receive?`,
        `$${ans}`,
        [`$${other}`, `$${unit}`, `$${total / 2}`, `$${ans + unit}`, `$${ans - unit}`],
        () => `$${jitter(rng, ans, 3)}`,
        {
          pattern: `${a} + ${b} = ${a + b} parts. Each part = ${total} ÷ ${a + b} = ${unit}. ${askLarger ? b : a} part${(askLarger ? b : a) === 1 ? '' : 's'} = ${ans}.`,
          howToSpot: 'A ratio question is a "parts" question: add the parts, divide the total, multiply back.',
          trap: 'Giving the other person’s share, or dividing the total by the wrong number of parts.',
        },
        '',
        d,
      )
    },
  },
  {
    id: 'average',
    name: 'Averages',
    minDifficulty: 1,
    build(rng, d) {
      const n = d <= 2 ? rng.int(3, 4) : rng.int(4, 6)
      const target = rng.int(d <= 2 ? 10 : 60, d <= 2 ? 30 : 95)
      // generate values with that exact average
      const vals: number[] = []
      let sum = 0
      for (let i = 0; i < n - 1; i++) {
        const v = target + rng.int(-8, 8)
        vals.push(v)
        sum += v
      }
      vals.push(target * n - sum)
      const missing = d >= 3 && rng.bool(0.5)
      if (missing) {
        const known = vals.slice(0, -1)
        const last = vals[n - 1]!
        return wp(
          `The average of ${n} scores is ${target}. ${n - 1} of them are ${known.join(', ')}. What is the remaining score?`,
          last,
          [target, last + n, last - n, Math.round(known.reduce((a, b) => a + b, 0) / known.length), target * n - known.reduce((a, b) => a + b, 0) + 1],
          () => jitter(rng, last, 2),
          {
            pattern: `Total needed = ${target} × ${n} = ${target * n}. Subtract the known scores (${known.reduce((a, b) => a + b, 0)}): ${last}.`,
            howToSpot: 'Average × count = total. Work with totals, not averages.',
            trap: 'Answering with the average itself, or averaging only the known scores.',
          },
          '',
          d,
        )
      }
      return wp(
        `What is the average of ${vals.join(', ')}?`,
        target,
        [target * n, Math.round(target * n / (n - 1)), target + 1, target - 1, vals[0]!],
        () => jitter(rng, target),
        {
          pattern: `Sum = ${target * n}; divide by ${n} = ${target}.`,
          howToSpot: 'Guess a central value and add up the deviations from it; if they cancel, that’s the average.',
          trap: 'Dividing by the wrong count or dropping a value.',
        },
        '',
        d,
      )
    },
  },
  {
    id: 'rate-distance',
    name: 'Speed, distance, time',
    minDifficulty: 1,
    build(rng, d) {
      const speed = rng.pick(d === 1 ? [30, 40, 50, 60] : [45, 55, 65, 72, 80])
      const hours = d <= 2 ? rng.int(2, 5) : rng.pick([1.5, 2.5, 3.5, 0.5, 4.5])
      const ask = rng.pick(d === 1 ? ['distance'] : ['distance', 'time', 'speed'])
      const dist = speed * hours
      if (ask === 'distance')
        return wp(
          `A vehicle travels at ${speed} mph for ${fmt(hours)} hours. How far does it go?`,
          dist,
          [speed + hours, dist / 2, dist * 2, speed * Math.floor(hours), speed * Math.ceil(hours)],
          () => jitter(rng, dist, 5),
          { pattern: `Distance = speed × time = ${speed} × ${fmt(hours)} = ${fmt(dist)} miles.`, howToSpot: 'D = R × T. Decide which of the three you have and which you need.', trap: 'Multiplying by the hours as if 1.5 hours were 1 hour 50 minutes.' },
          ' miles',
          d,
        )
      if (ask === 'time')
        return wp(
          `How long does it take to travel ${fmt(dist)} miles at ${speed} mph?`,
          hours,
          [hours + 0.5, hours - 0.5, hours * 2, Math.round(dist / speed) + 1, hours + 1],
          () => jitter(rng, hours, 0.5),
          { pattern: `Time = distance ÷ speed = ${fmt(dist)} ÷ ${speed} = ${fmt(hours)} hours.`, howToSpot: 'Rearrange D = R × T to T = D ÷ R.', trap: 'Dividing the other way round.' },
          ' hours',
          d,
        )
      return wp(
        `A vehicle covers ${fmt(dist)} miles in ${fmt(hours)} hours. What is its average speed?`,
        speed,
        [speed + 5, speed - 5, dist / (hours + 1), speed * 2, Math.round(dist / Math.floor(hours || 1))],
        () => jitter(rng, speed, 5),
        { pattern: `Speed = distance ÷ time = ${fmt(dist)} ÷ ${fmt(hours)} = ${speed} mph.`, howToSpot: 'Rearrange D = R × T to R = D ÷ T.', trap: 'Rounding the time before dividing.' },
        ' mph',
        d,
      )
    },
  },
  {
    id: 'work-rate',
    name: 'Combined work rates',
    minDifficulty: 3,
    build(rng, d) {
      // Two workers: a hours and b hours alone -> together ab/(a+b). Choose pairs with clean results.
      const pairs = d === 3 ? [[2, 2], [3, 6], [4, 4], [6, 3], [2, 6], [4, 12], [6, 12]] : [[3, 6], [4, 12], [5, 20], [6, 12], [10, 15], [8, 24], [12, 24]]
      const [a, b] = rng.pick(pairs) as [number, number]
      const together = (a * b) / (a + b)
      return wp(
        `${rng.pick(NAMES)} can finish a job alone in ${a} hours; a colleague can finish it alone in ${b} hours. Working together at these rates, how long do they take?`,
        together,
        [(a + b) / 2, a + b, Math.min(a, b), Math.abs(a - b) || 1, together + 1],
        () => jitter(rng, together, 0.5),
        {
          pattern: `Rates add: 1/${a} + 1/${b} = ${a + b}/${a * b} of the job per hour, so the time is ${a * b}/${a + b} = ${fmt(together)} hours.`,
          howToSpot: 'Work problems add rates (jobs per hour), never times. Shortcut: product ÷ sum.',
          trap: 'Averaging the two times, which gives a number too large. Together must beat the faster worker.',
        },
        ' hours',
        d,
      )
    },
  },
  {
    id: 'unit-conversion',
    name: 'Unit conversion',
    minDifficulty: 1,
    build(rng, d) {
      const kinds = d === 1 ? ['min-h', 'ft-in', 'cm-m'] : d === 2 ? ['min-h', 'ft-in', 'cm-m', 'h-min', 'kb-mb'] : ['h-min', 'kb-mb', 'in-ft', 'days-h', 'mb-gb', 'yd-ft']
      const k = rng.pick(kinds)
      let stem = '', ans = 0, unit = '', c: number[] = [], pat = ''
      switch (k) {
        case 'min-h': { const h = rng.int(2, 9); ans = h * 60; unit = ' minutes'; stem = `How many minutes are in ${h} hours?`; c = [h * 100, h * 6, h * 30, ans + 60]; pat = `${h} × 60 = ${ans}.`; break }
        case 'h-min': { const h = rng.pick([1.5, 2.5, 3.25, 4.75, 0.75]); ans = h * 60; unit = ' minutes'; stem = `How many minutes are in ${h} hours?`; c = [h * 100, Math.floor(h) * 60 + (h % 1) * 100, ans + 10, ans - 10]; pat = `${h} × 60 = ${ans}.`; break }
        case 'ft-in': { const f = rng.int(2, 9); ans = f * 12; unit = ' inches'; stem = `How many inches are in ${f} feet?`; c = [f * 10, f * 3, f * 36, ans + 12]; pat = `${f} × 12 = ${ans}.`; break }
        case 'in-ft': { const f = rng.int(2, 9); ans = f; unit = ' feet'; stem = `How many feet are in ${f * 12} inches?`; c = [f * 12 / 10, f + 1, f - 1, f * 2]; pat = `${f * 12} ÷ 12 = ${f}.`; break }
        case 'yd-ft': { const y = rng.int(2, 12); ans = y * 3; unit = ' feet'; stem = `How many feet are in ${y} yards?`; c = [y * 12, y * 2, y, ans + 3]; pat = `${y} × 3 = ${ans}.`; break }
        case 'cm-m': { const m = rng.int(2, 9); ans = m * 100; unit = ' cm'; stem = `How many centimetres are in ${m} metres?`; c = [m * 10, m * 1000, ans + 100, ans / 2]; pat = `${m} × 100 = ${ans}.`; break }
        case 'days-h': { const dd = rng.int(2, 6); ans = dd * 24; unit = ' hours'; stem = `How many hours are in ${dd} days?`; c = [dd * 12, dd * 60, ans + 24, dd * 20]; pat = `${dd} × 24 = ${ans}.`; break }
        case 'kb-mb': { const mb = rng.pick([2, 4, 8, 16]); ans = mb * 1024; unit = ' KB'; stem = `Using 1 MB = 1024 KB, how many KB are in ${mb} MB?`; c = [mb * 1000, mb * 100, ans + 24, ans / 2]; pat = `${mb} × 1024 = ${ans}.`; break }
        default: { const gb = rng.pick([2, 3, 5, 10]); ans = gb * 1024; unit = ' MB'; stem = `Using 1 GB = 1024 MB, how many MB are in ${gb} GB?`; c = [gb * 1000, gb * 100, ans + 24, ans / 2]; pat = `${gb} × 1024 = ${ans}.` }
      }
      return wp(stem, ans, c, () => jitter(rng, ans, 10), {
        pattern: 'Convert using the fixed factor: ' + pat,
        howToSpot: 'Know the common factors cold: 60, 12, 3, 24, 100, 1024.',
        trap: 'Multiplying when you should divide (or the reverse), or using 100 where 60 or 1024 belongs.',
      }, unit, d)
    },
  },
  {
    id: 'solve-x',
    name: 'Solve for the unknown',
    minDifficulty: 2,
    build(rng, d) {
      const x = rng.int(2, d <= 2 ? 12 : 25)
      const a = rng.int(2, d <= 2 ? 6 : 12)
      const b = rng.int(1, d <= 2 ? 15 : 40)
      const form = rng.pick(d <= 2 ? ['ax+b'] : ['ax+b', 'ax-b', 'b-ax'])
      const rhs = form === 'ax+b' ? a * x + b : form === 'ax-b' ? a * x - b : b - a * x
      const expr = form === 'ax+b' ? `${a}x + ${b}` : form === 'ax-b' ? `${a}x − ${b}` : `${b} − ${a}x`
      const wrongSign = form === 'ax+b' ? (rhs + b) / a : form === 'ax-b' ? (rhs - b) / a : (rhs + b) / a
      return wp(
        `If ${expr} = ${rhs}, what is x?`,
        x,
        [wrongSign, x + 1, x - 1, rhs - b, (rhs - b) * a, Math.abs(rhs) / a],
        () => jitter(rng, x),
        {
          pattern: `Undo the operations in reverse order: move ${b} across, then divide by ${a}. x = ${x}.`,
          howToSpot: 'A one-variable linear equation: isolate x step by step, checking the sign each time.',
          trap: 'Moving a term across the equals sign without changing its sign.',
        },
        '',
        d,
      )
    },
  },
  {
    id: 'age',
    name: 'Age problems',
    minDifficulty: 3,
    build(rng, d) {
      const child = rng.int(4, 12)
      const mult = rng.int(2, d === 3 ? 4 : 6)
      const parent = child * mult
      const years = rng.int(3, 10)
      const ask = rng.bool()
      const [n1, n2] = [rng.pick(NAMES), rng.pick(NAMES)]
      if (ask)
        return wp(
          `${n1} is ${mult === 2 ? 'twice' : `${mult} times`} as old as ${n2}. ${n2} is ${child}. How old will ${n1} be in ${years} years?`,
          parent + years,
          [parent, (child + years) * mult, parent + years * mult, child + years, parent - years],
          () => jitter(rng, parent + years),
          {
            pattern: `${n1} is ${mult} × ${child} = ${parent} now; in ${years} years: ${parent + years}.`,
            howToSpot: 'Find everyone’s age now first, then move through time. Everyone ages by the same amount.',
            trap: `Multiplying the future age (${(child + years) * mult}) instead of adding years to the current age.`,
          },
          '',
          d,
        )
      return wp(
        `The combined age of ${n1} and ${n2} is ${parent + child}. ${n1} is ${mult === 2 ? 'twice' : `${mult} times`} as old as ${n2}. How old is ${n2}?`,
        child,
        [parent, (parent + child) / 2, child + 1, child - 1, (parent + child) / mult],
        () => jitter(rng, child),
        {
          pattern: `Let ${n2} = x, so ${n1} = ${mult}x. ${mult + 1}x = ${parent + child}, x = ${child}.`,
          howToSpot: 'Express every age in terms of the youngest person, then add.',
          trap: `Dividing by ${mult} instead of ${mult + 1}, or answering with ${n1}’s age.`,
        },
        '',
        d,
      )
    },
  },
  {
    id: 'discount',
    name: 'Discount and tax',
    minDifficulty: 2,
    build(rng, d) {
      const price = rng.pick([20, 40, 50, 60, 80, 120, 150, 200])
      const off = rng.pick(d <= 2 ? [10, 20, 25, 50] : [15, 30, 40, 5])
      const sale = price - (price * off) / 100
      if (d >= 4 && rng.bool(0.5)) {
        const tax = rng.pick([5, 10])
        const final = sale + (sale * tax) / 100
        return wp(
          `An item priced at $${price} is ${off}% off, and then ${tax}% sales tax is added. What is the final cost?`,
          `$${fmt(final)}`,
          [`$${fmt(sale)}`, `$${fmt(price - (price * (off - tax)) / 100)}`, `$${fmt(price + (price * tax) / 100)}`, `$${fmt(final + 1)}`],
          () => `$${fmt(jitter(rng, final, 2))}`,
          {
            pattern: `${price} × ${(100 - off) / 100} = ${fmt(sale)}; × ${(100 + tax) / 100} = ${fmt(final)}.`,
            howToSpot: 'Apply percentages one after another by multiplying; they do not simply add or cancel.',
            trap: `Subtracting ${off - tax}% in one step, which ignores that tax applies to the reduced price.`,
          },
          '',
          d,
        )
      }
      return wp(
        `An item priced at $${price} is marked ${off}% off. What is the sale price?`,
        `$${fmt(sale)}`,
        [`$${fmt((price * off) / 100)}`, `$${fmt(price + (price * off) / 100)}`, `$${fmt(sale + 5)}`, `$${fmt(sale - 5)}`],
        () => `$${fmt(jitter(rng, sale, 2))}`,
        {
          pattern: `${off}% of ${price} is ${fmt((price * off) / 100)}; ${price} − ${fmt((price * off) / 100)} = ${fmt(sale)}.`,
          howToSpot: 'Sale price = original × (100 − discount)%.',
          trap: 'Answering with the amount saved rather than the amount paid.',
        },
        '',
        d,
      )
    },
  },
  {
    id: 'fraction-of',
    name: 'Fractions of a quantity',
    minDifficulty: 1,
    build(rng, d) {
      const den = rng.pick(d === 1 ? [2, 3, 4] : d === 2 ? [3, 4, 5, 6] : [5, 6, 7, 8, 9])
      const num = rng.int(1, den - 1)
      const total = den * rng.int(d <= 2 ? 3 : 6, d <= 2 ? 12 : 30)
      const part = (num * total) / den
      const askRemain = d >= 3 && rng.bool(0.5)
      const ans = askRemain ? total - part : part
      const item = rng.pick(ITEMS)
      return wp(
        `A box holds ${total} ${item}. ${num}/${den} of them are ${rng.pick(['defective', 'blue', 'already used', 'reserved'])}. How many are ${askRemain ? 'not ' : ''}in that group?`,
        ans,
        [askRemain ? part : total - part, total / den, ans + total / den, ans - total / den, num * den],
        () => jitter(rng, ans, 2),
        {
          pattern: `${total} ÷ ${den} = ${total / den} per part; × ${num} = ${part}${askRemain ? `; remaining = ${total} − ${part} = ${ans}` : ''}.`,
          howToSpot: 'Divide by the denominator first, then multiply by the numerator. Then re-read whether the question wants the part or the rest.',
          trap: askRemain ? 'Giving the part instead of the remainder.' : 'Giving the remainder instead of the part.',
        },
        '',
        d,
      )
    },
  },
  {
    id: 'consecutive',
    name: 'Consecutive integers',
    minDifficulty: 3,
    build(rng, d) {
      const n = rng.pick(d === 3 ? [3] : [3, 4, 5])
      const even = d >= 4 && rng.bool(0.4)
      const first = even ? rng.int(2, 20) * 2 : rng.int(5, 40)
      const step = even ? 2 : 1
      const nums = Array.from({ length: n }, (_, i) => first + i * step)
      const sum = nums.reduce((a, b) => a + b, 0)
      const askLargest = rng.bool()
      const ans = askLargest ? nums[n - 1]! : first
      return wp(
        `The sum of ${n} consecutive ${even ? 'even ' : ''}integers is ${sum}. What is the ${askLargest ? 'largest' : 'smallest'} of them?`,
        ans,
        [askLargest ? first : nums[n - 1]!, sum / n, ans + step, ans - step, Math.floor(sum / n) + 1],
        () => jitter(rng, ans),
        {
          pattern: `The middle value is the average: ${sum} ÷ ${n} = ${fmt(sum / n)}. Step out by ${step}s to the ${askLargest ? 'largest' : 'smallest'}: ${ans}.`,
          howToSpot: 'Consecutive numbers are symmetric around their average. Find the average first.',
          trap: 'Answering with the average (the middle number) or the wrong end.',
        },
        '',
        d,
      )
    },
  },
  {
    id: 'time-elapsed',
    name: 'Elapsed time',
    minDifficulty: 1,
    build(rng, d) {
      const startH = rng.int(6, 11)
      const startM = rng.pick(d === 1 ? [0, 30] : [0, 15, 20, 30, 45, 50])
      const durH = rng.int(1, 6)
      const durM = rng.pick(d === 1 ? [0, 30] : [0, 15, 25, 35, 45, 55])
      let endM = startM + durM
      let endH = startH + durH + Math.floor(endM / 60)
      endM %= 60
      const ampm = (h: number) => (h >= 12 ? 'p.m.' : 'a.m.')
      const show = (h: number, m: number) => `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${ampm(h)}`
      const ans = show(endH, endM)
      return wp(
        `${rng.pick(['A training block', 'A shift', 'A flight', 'An exam'])} starts at ${show(startH, startM)} and lasts ${durH} hour${durH > 1 ? 's' : ''}${durM ? ` ${durM} minutes` : ''}. When does it end?`,
        ans,
        [show(endH, (endM + 10) % 60), show(endH + 1, endM), show(endH - 1, endM), show(startH + durH, (startM + durM) % 100 % 60), show(endH, (endM + 30) % 60)],
        () => show(endH + rng.pick([-2, 2]), (endM + rng.pick([5, 15, 45])) % 60),
        {
          pattern: `${show(startH, startM)} + ${durH} h → ${show(startH + durH, startM)}; + ${durM} min → ${ans}`,
          howToSpot: 'Add the hours first, then the minutes, carrying 60 minutes into an hour.',
          trap: 'Carrying 100 minutes instead of 60, or forgetting the a.m./p.m. switch at noon.',
        },
        '',
        d,
      )
    },
  },
  {
    id: 'simplify-ratio',
    name: 'Simplifying ratios',
    minDifficulty: 2,
    build(rng, d) {
      const a0 = rng.int(1, d <= 2 ? 5 : 9)
      let b0 = rng.int(1, d <= 2 ? 5 : 9)
      if (b0 === a0) b0 += 1
      const g = gcd(a0, b0)
      const a1 = a0 / g, b1 = b0 / g
      const k = rng.pick(d <= 2 ? [2, 3, 4, 5] : [6, 7, 8, 12])
      const A = a1 * k, B = b1 * k
      return wp(
        `A unit has ${A} ${rng.pick(['officers', 'laptops', 'red cables'])} and ${B} ${rng.pick(['enlisted members', 'desktops', 'blue cables'])}. What is the ratio of the first to the second in simplest form?`,
        `${a1}:${b1}`,
        [`${b1}:${a1}`, `${A}:${B}`, `${a1 + 1}:${b1}`, `${a1}:${b1 + 1}`, `${a1 * 2}:${b1 * 2}`],
        () => `${a1 + rng.int(1, 3)}:${b1 + rng.int(1, 3)}`,
        {
          pattern: `Divide both by their greatest common factor ${k}: ${A}:${B} = ${a1}:${b1}.`,
          howToSpot: 'Find the largest number that divides both; try 2, 3, 5, 7 in turn.',
          trap: 'Reversing the order of the ratio, or stopping before it is fully simplified.',
        },
        '',
        d,
      )
    },
  },
]

export const arithmetic = makeGenerator('arithmetic', ARITHMETIC_FAMILIES)
