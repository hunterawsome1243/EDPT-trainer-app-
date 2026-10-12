import type { Built, Difficulty, FigureSpec, Rng, RuleFamily, Shape } from '../types'
import { makeGenerator } from './common'

/*
 * Figure families. Every figure is a FigureSpec (list of shapes in a unit
 * cell) rendered as SVG by the UI. Distractors are figures with one rule
 * applied wrongly (wrong rotation, wrong count, wrong fill, wrong shape).
 */

const KINDS: Shape['kind'][] = ['circle', 'square', 'triangle', 'diamond', 'pentagon', 'star']
const FILLS: NonNullable<Shape['fill']>[] = ['none', 'solid', 'hatch', 'dots']
const CORNERS = [
  [0.22, 0.22],
  [0.78, 0.22],
  [0.78, 0.78],
  [0.22, 0.78],
] as const

const key = (f: FigureSpec) => JSON.stringify(f.shapes)

function norm(r: number) {
  return ((r % 360) + 360) % 360
}

function big(kind: Shape['kind'], extra: Partial<Shape> = {}): Shape {
  return { kind, x: 0.5, y: 0.5, size: 0.55, rotation: 0, fill: 'none', ...extra }
}

function fig(shapes: Shape[], alt: string): FigureSpec {
  return { shapes: shapes.map((s) => ({ ...s, rotation: s.rotation === undefined ? undefined : norm(s.rotation) })), alt }
}

/** Remove duplicates and anything equal to the correct answer; keep the first `n`. */
function distinct(correct: FigureSpec, cands: FigureSpec[], n: number): FigureSpec[] {
  const seen = new Set([key(correct)])
  const out: FigureSpec[] = []
  for (const c of cands) {
    const k = key(c)
    if (!seen.has(k)) {
      seen.add(k)
      out.push(c)
    }
    if (out.length === n) break
  }
  if (out.length < n) throw new Error('not enough distinct figure distractors')
  return out
}

function seq(rng: Rng, d: Difficulty, cells: FigureSpec[], cands: FigureSpec[], expl: Built['explanation'], prompt = 'Which figure comes next?'): Built {
  const n = cells.length
  const correct = cells[n - 1]!
  const figures = cells.slice(0, n - 1)
  return {
    prompt,
    figures,
    figureLayout: 'sequence',
    correct,
    distractors: distinct(correct, rng.shuffle(cands), d >= 3 ? 4 : 3),
    explanation: expl,
  }
}

function analogy(rng: Rng, d: Difficulty, A: FigureSpec, B: FigureSpec, C: FigureSpec, D: FigureSpec, cands: FigureSpec[], expl: Built['explanation']): Built {
  return {
    prompt: 'A is to B as C is to ?',
    figures: [A, B, C],
    figureLayout: 'analogy',
    correct: D,
    distractors: distinct(D, rng.shuffle(cands), d >= 3 ? 4 : 3),
    explanation: expl,
  }
}

const dotsAt = (n: number, fill: Shape['fill'] = 'solid'): Shape[] => {
  // lay out n small dots on a 3x3 grid
  const cells = [
    [0.5, 0.5],
    [0.25, 0.25],
    [0.75, 0.75],
    [0.75, 0.25],
    [0.25, 0.75],
    [0.5, 0.25],
    [0.5, 0.75],
    [0.25, 0.5],
    [0.75, 0.5],
  ]
  return cells.slice(0, n).map(([x, y]) => ({ kind: 'dot', x, y, size: 0.14, fill }))
}

export const FIGURE_FAMILIES: RuleFamily[] = [
  {
    id: 'rotation',
    name: 'Constant rotation',
    minDifficulty: 1,
    build(rng, d) {
      const kind = rng.pick<Shape['kind']>(d <= 2 ? ['arrow', 'arrow', 'triangle'] : ['arrow', 'triangle', 'line', 'pentagon'])
      const step = rng.pick(d === 1 ? [90, -90] : d === 2 ? [45, 90, -45, -90] : [45, 135, -45, -135, 60])
      const start = rng.pick([0, 90, 180, 270, 45])
      const n = d <= 2 ? 4 : 5
      const cells = Array.from({ length: n }, (_, i) => fig([big(kind, { rotation: start + i * step, fill: 'solid' })], `A ${kind} pointing at ${norm(start + i * step)} degrees`))
      const last = start + (n - 1) * step
      const cands = [-step, step * 2, 0, step / 2, step * 3, -step * 2, 180].map((k) =>
        fig([big(kind, { rotation: last - step + k, fill: 'solid' })], `A ${kind} rotated`),
      )
      return seq(rng, d, cells, cands, {
        pattern: `The ${kind} rotates ${Math.abs(step)}° ${step > 0 ? 'clockwise' : 'counter-clockwise'} in each cell.`,
        howToSpot: 'Pick one feature (the tip of the arrow) and track where it points cell by cell.',
        trap: 'Rotating in the wrong direction, or by one step too few or too many.',
      })
    },
  },
  {
    id: 'count',
    name: 'Growing count',
    minDifficulty: 1,
    build(rng, d) {
      const step = d >= 3 ? rng.pick([1, 2]) : 1
      const start = rng.int(1, 2)
      const n = 4
      const cells = Array.from({ length: n }, (_, i) => fig(dotsAt(start + i * step), `${start + i * step} dots`))
      const last = start + (n - 1) * step
      const cands = [last - 1, last + 1, last - step, last + step, last + 2, last - 2].filter((k) => k >= 1 && k <= 9).map((k) => fig(dotsAt(k), `${k} dots`))
      return seq(rng, d, cells, cands, {
        pattern: `The number of dots increases by ${step} in each cell.`,
        howToSpot: 'Count the elements in each cell. If the count changes steadily, continue it.',
        trap: 'Miscounting a crowded cell, or continuing the position pattern instead of the count.',
      })
    },
  },
  {
    id: 'fill-cycle',
    name: 'Shading cycle',
    minDifficulty: 1,
    build(rng, d) {
      const kind = rng.pick(KINDS)
      const cycle = d <= 2 ? rng.shuffle(FILLS).slice(0, 2) : rng.shuffle(FILLS).slice(0, 3)
      const n = d <= 2 ? 4 : 5
      const cells = Array.from({ length: n }, (_, i) => fig([big(kind, { fill: cycle[i % cycle.length]! })], `A ${kind} with ${cycle[i % cycle.length]} fill`))
      const cands = FILLS.map((f) => fig([big(kind, { fill: f })], `A ${kind} with ${f} fill`))
      // shape-changed distractor
      cands.push(fig([big(KINDS[(KINDS.indexOf(kind) + 1) % KINDS.length]!, { fill: cycle[(n - 1) % cycle.length]! })], 'A different shape'))
      return seq(rng, d, cells, cands, {
        pattern: `The shading repeats in a cycle of ${cycle.length}: ${cycle.join(' → ')}.`,
        howToSpot: 'When the shape stays the same, look at the fill. Find where the cycle restarts.',
        trap: 'Assuming the cycle has only two states, or changing the shape as well.',
      })
    },
  },
  {
    id: 'shape-cycle',
    name: 'Shape cycle',
    minDifficulty: 1,
    build(rng, d) {
      const cycle = rng.shuffle(KINDS).slice(0, d <= 2 ? 3 : 4)
      const fill = rng.pick(FILLS)
      const n = d <= 2 ? 4 : 6
      const cells = Array.from({ length: n }, (_, i) => fig([big(cycle[i % cycle.length]!, { fill })], `A ${cycle[i % cycle.length]}`))
      const cands = KINDS.map((k) => fig([big(k, { fill })], `A ${k}`))
      return seq(rng, d, cells, cands, {
        pattern: `The shapes repeat in a cycle of ${cycle.length}: ${cycle.join(' → ')}.`,
        howToSpot: 'Read the shapes like a word and look for where it repeats.',
        trap: 'Picking the shape that appeared most recently instead of the next one in the cycle.',
      })
    },
  },
  {
    id: 'size-change',
    name: 'Growing or shrinking',
    minDifficulty: 1,
    build(rng, d) {
      const kind = rng.pick(KINDS)
      const grow = rng.bool()
      const sizes = grow ? [0.2, 0.35, 0.5, 0.65, 0.8] : [0.8, 0.65, 0.5, 0.35, 0.2]
      const n = d <= 2 ? 4 : 5
      const fill = rng.pick(FILLS)
      const cells = Array.from({ length: n }, (_, i) => fig([big(kind, { size: sizes[i]!, fill })], `A ${sizes[i]! > 0.5 ? 'large' : 'small'} ${kind}`))
      const cands = sizes.map((s) => fig([big(kind, { size: s, fill })], `A ${kind}`))
      cands.push(fig([big(kind, { size: sizes[n - 1]!, fill: FILLS[(FILLS.indexOf(fill) + 1) % 4]! })], 'A different fill'))
      return seq(rng, d, cells, cands, {
        pattern: `The ${kind} ${grow ? 'grows' : 'shrinks'} by the same amount in each cell.`,
        howToSpot: 'Compare sizes across the row. Steady change in one direction continues.',
        trap: 'Choosing the size that repeats the last cell, or one step too far.',
      })
    },
  },
  {
    id: 'add-element',
    name: 'Adding an element',
    minDifficulty: 2,
    build(rng, d) {
      const kind = rng.pick(KINDS)
      const order = rng.shuffle([0, 1, 2, 3])
      const n = 4
      const mk = (count: number, alt: string) =>
        fig(
          order.slice(0, count).map((c) => ({ kind, x: CORNERS[c]![0], y: CORNERS[c]![1], size: 0.28, fill: 'solid' })),
          alt,
        )
      const cells = Array.from({ length: n }, (_, i) => mk(i + 1, `${i + 1} ${kind}s in the corners`))
      const wrongCorner = fig(
        [...order.slice(0, 3), order[3]!].map((c, i) => ({ kind, x: i === 3 ? 0.5 : CORNERS[c]![0], y: i === 3 ? 0.5 : CORNERS[c]![1], size: 0.28, fill: 'solid' })),
        'Four shapes, one in the centre',
      )
      const cands = [mk(3, 'three'), mk(2, 'two'), wrongCorner, fig(dotsAt(4), 'four dots')]
      return seq(rng, d, cells, cands, {
        pattern: 'One new shape is added in each cell, filling the corners in a fixed order.',
        howToSpot: 'Each cell contains everything the last one had, plus one. Find where the new one goes.',
        trap: 'Putting the new element in the wrong position.',
      })
    },
  },
  {
    id: 'flip',
    name: 'Mirror flip',
    minDifficulty: 2,
    build(rng, d) {
      const kind = rng.pick<Shape['kind']>(['arrow', 'triangle'])
      const base = rng.pick([0, 30, 60, 120, 150])
      const n = d <= 2 ? 4 : 5
      // alternate between r and its mirror image (180 - r for horizontal flip of a directional shape)
      const cells = Array.from({ length: n }, (_, i) => fig([big(kind, { rotation: i % 2 === 0 ? base : 180 - base, fill: i % 2 === 0 ? 'solid' : 'solid' })], `A ${kind}`))
      const lastRot = (n - 1) % 2 === 0 ? base : 180 - base
      const cands = [lastRot + 180, base + 90, 180 - base + 90, lastRot + 45, lastRot - 45, 360 - lastRot].map((r) => fig([big(kind, { rotation: r, fill: 'solid' })], `A ${kind}`))
      return seq(rng, d, cells, cands, {
        pattern: 'The figure flips left-to-right in each cell, alternating between two mirror images.',
        howToSpot: 'Cells 1 and 3 match, cells 2 and 4 match. A two-cell alternation.',
        trap: 'Rotating the figure instead of mirroring it, which gives an upside-down image.',
      })
    },
  },
  {
    id: 'orbit',
    name: 'Moving around the cell',
    minDifficulty: 2,
    build(rng, d) {
      const kind = rng.pick(KINDS)
      const dir = rng.bool() ? 1 : -1
      const startC = rng.int(0, 3)
      const step = d >= 4 && rng.bool(0.4) ? 2 : 1
      const n = d <= 2 ? 4 : 5
      const withCentre = d >= 3
      const mk = (c: number) =>
        fig(
          [
            ...(withCentre ? [big('circle', { size: 0.3, fill: 'none' })] : []),
            { kind, x: CORNERS[((c % 4) + 4) % 4]![0], y: CORNERS[((c % 4) + 4) % 4]![1], size: 0.22, fill: 'solid' },
          ],
          `A small ${kind} near a corner`,
        )
      const cells = Array.from({ length: n }, (_, i) => mk(startC + dir * step * i))
      const last = startC + dir * step * (n - 1)
      const cands = [last - dir * step, last + dir * step * 2, last + 2, last + dir].map((c) => mk(c))
      cands.push(fig([{ kind, x: 0.5, y: 0.5, size: 0.22, fill: 'solid' }], 'centre'))
      return seq(rng, d, cells, cands, {
        pattern: `The ${kind} moves ${step === 1 ? 'one corner' : 'two corners'} ${dir === 1 ? 'clockwise' : 'counter-clockwise'} each cell.`,
        howToSpot: 'Track the position of the moving element around the cell like a clock hand.',
        trap: 'Moving the wrong direction, or skipping a corner.',
      })
    },
  },
  {
    id: 'two-rules',
    name: 'Rotation plus count',
    minDifficulty: 3,
    build(rng, d) {
      const step = rng.pick([45, 90, -90])
      const n = 4
      const mk = (i: number) =>
        fig([big('arrow', { rotation: i * step, fill: 'solid', size: 0.5 }), ...dotsAt(i + 1).map((s) => ({ ...s, x: 0.12 + (s.x! * 0.3), y: 0.85, size: 0.08 }))], `An arrow with ${i + 1} dots below it`)
      const cells = Array.from({ length: n }, (_, i) => mk(i))
      const alt = (rot: number, count: number) =>
        fig([big('arrow', { rotation: rot, fill: 'solid', size: 0.5 }), ...dotsAt(count).map((s) => ({ ...s, x: 0.12 + (s.x! * 0.3), y: 0.85, size: 0.08 }))], 'An arrow with dots')
      const L = n - 1
      const cands = [alt(L * step, L), alt((L - 1) * step, L + 1), alt((L + 1) * step, L + 1), alt(L * step, L + 2), alt(-L * step, L + 1)]
      return seq(rng, d, cells, cands, {
        pattern: `Two things change at once: the arrow rotates ${Math.abs(step)}° ${step > 0 ? 'clockwise' : 'counter-clockwise'} and one dot is added each cell.`,
        howToSpot: 'List every feature (direction, count, fill) and check each one separately. More than one may change.',
        trap: 'Getting one rule right and forgetting to apply the other.',
      })
    },
  },
  {
    id: 'analogy-rotate',
    name: 'Analogy: rotation',
    minDifficulty: 2,
    build(rng, d) {
      const angle = rng.pick(d <= 2 ? [90, -90, 180] : [45, 90, -90, 135, 180])
      const kA = rng.pick<Shape['kind']>(['arrow', 'triangle', 'line'])
      const kC = rng.pick<Shape['kind']>(['arrow', 'triangle', 'pentagon'].filter((k) => k !== kA) as Shape['kind'][])
      const rA = rng.pick([0, 45, 90, 270])
      const rC = rng.pick([0, 30, 90, 180, 225])
      const fill = rng.pick(['solid', 'hatch'] as const)
      const A = fig([big(kA, { rotation: rA, fill })], `A ${kA}`)
      const B = fig([big(kA, { rotation: rA + angle, fill })], `The same ${kA} rotated`)
      const C = fig([big(kC, { rotation: rC, fill })], `A ${kC}`)
      const D = fig([big(kC, { rotation: rC + angle, fill })], `A rotated ${kC}`)
      const cands = [-angle, angle * 2, 0, 180, angle + 45, angle - 45].map((a) => fig([big(kC, { rotation: rC + a, fill })], `A ${kC}`))
      cands.push(fig([big(kA, { rotation: rC + angle, fill })], `A ${kA}`))
      return analogy(rng, d, A, B, C, D, cands, {
        pattern: `B is A rotated ${Math.abs(angle)}° ${angle > 0 ? 'clockwise' : 'counter-clockwise'}. Apply the same rotation to C.`,
        howToSpot: 'Describe what happened from A to B in words, then do exactly that to C.',
        trap: 'Rotating the wrong way, or picking a figure that looks like A instead of transforming C.',
      })
    },
  },
  {
    id: 'analogy-fill-size',
    name: 'Analogy: fill and size',
    minDifficulty: 2,
    build(rng, d) {
      const kA = rng.pick(KINDS)
      const kC = rng.pick(KINDS.filter((k) => k !== kA))
      const f1 = rng.pick(FILLS)
      const f2 = rng.pick(FILLS.filter((f) => f !== f1))
      const sizeChange = d >= 3 && rng.bool(0.5)
      const s1 = 0.55
      const s2 = sizeChange ? 0.3 : 0.55
      const A = fig([big(kA, { fill: f1, size: s1 })], `A ${kA}`)
      const B = fig([big(kA, { fill: f2, size: s2 })], `A ${kA} with different fill`)
      const C = fig([big(kC, { fill: f1, size: s1 })], `A ${kC}`)
      const D = fig([big(kC, { fill: f2, size: s2 })], `A ${kC}`)
      const cands = [
        fig([big(kC, { fill: f1, size: s2 })], 'x'),
        fig([big(kC, { fill: f2, size: s1 })], 'x'),
        fig([big(kA, { fill: f2, size: s2 })], 'x'),
        fig([big(kC, { fill: FILLS.find((f) => f !== f1 && f !== f2)!, size: s2 })], 'x'),
        fig([big(kC, { fill: f1, size: s1 })], 'x'),
      ]
      return analogy(rng, d, A, B, C, D, cands, {
        pattern: `From A to B the fill changes from ${f1} to ${f2}${sizeChange ? ' and the shape shrinks' : ''}. Apply the same change to C.`,
        howToSpot: 'List the attributes of A and B (shape, fill, size, rotation) and note which ones changed.',
        trap: sizeChange ? 'Changing only the fill or only the size.' : 'Changing the shape as well as the fill.',
      })
    },
  },
  {
    id: 'analogy-count',
    name: 'Analogy: count change',
    minDifficulty: 3,
    build(rng, d) {
      const delta = rng.pick(d === 3 ? [1, -1] : [1, -1, 2, -2])
      const a = rng.int(Math.max(1, 1 - delta), Math.min(6, 6 - delta))
      const c = rng.int(Math.max(1, 1 - delta), Math.min(6, 6 - delta))
      const fillA = rng.pick(['solid', 'none'] as const)
      const fillC = fillA === 'solid' ? 'none' : 'solid'
      const A = fig(dotsAt(a, fillA), `${a} dots`)
      const B = fig(dotsAt(a + delta, fillA), `${a + delta} dots`)
      const C = fig(dotsAt(c, fillC), `${c} circles`)
      const D = fig(dotsAt(c + delta, fillC), `${c + delta} circles`)
      const cands = [c, c - delta, c + 2 * delta, c + delta + 1, c + delta - 1].filter((k) => k >= 1 && k <= 9).map((k) => fig(dotsAt(k, fillC), `${k}`))
      cands.push(fig(dotsAt(c + delta, fillA), 'wrong fill'))
      return analogy(rng, d, A, B, C, D, cands, {
        pattern: `B has ${Math.abs(delta)} ${delta > 0 ? 'more' : 'fewer'} element${Math.abs(delta) > 1 ? 's' : ''} than A. Apply the same change to C.`,
        howToSpot: 'Count the elements in A and B. The difference is the rule.',
        trap: 'Matching the count of B instead of applying the change to C.',
      })
    },
  },
  {
    id: 'odd-one-out',
    name: 'Odd one out',
    minDifficulty: 2,
    build(rng, d) {
      // 4 figures share a property; the odd one breaks it. The *options* are the figures.
      const prop = rng.pick(d <= 2 ? ['fill', 'kind'] : ['fill', 'kind', 'rotation', 'count'])
      const kind = rng.pick(KINDS)
      const fill = rng.pick(FILLS)
      const mk = (over: Partial<Shape>, count = 1) =>
        fig(
          count === 1 ? [big(kind, { fill, ...over })] : dotsAt(count, fill),
          'A figure',
        )
      let normal: FigureSpec[]
      let odd: FigureSpec
      let pattern: string
      switch (prop) {
        case 'fill': {
          const kinds = rng.shuffle(KINDS).slice(0, 4)
          normal = kinds.map((k) => mk({ kind: k }))
          odd = mk({ kind: kinds[0]!, fill: FILLS[(FILLS.indexOf(fill) + 1) % 4]! })
          pattern = `Four figures share the same fill (${fill}); one has a different fill.`
          break
        }
        case 'kind': {
          const fills = rng.shuffle(FILLS)
          normal = fills.map((f) => mk({ fill: f }))
          odd = mk({ kind: KINDS[(KINDS.indexOf(kind) + 1) % KINDS.length]!, fill: fills[0]! })
          pattern = `Four figures are the same shape (${kind}); one is a different shape.`
          break
        }
        case 'rotation': {
          const rots = [0, 90, 180, 270]
          normal = rots.map((r) => fig([big('arrow', { rotation: r, fill })], 'An arrow'))
          odd = fig([big('arrow', { rotation: 45, fill })], 'An arrow')
          pattern = 'Four arrows point straight up, down, left or right; one points diagonally.'
          break
        }
        default: {
          const n = rng.int(2, 5)
          normal = [mk({}, n), fig(dotsAt(n, 'none'), 'x'), fig(dotsAt(n, 'hatch'), 'x'), fig(dotsAt(n, 'dots'), 'x')]
          odd = fig(dotsAt(n + 1, fill), 'x')
          pattern = `Four figures contain ${n} elements; one contains ${n + 1}.`
        }
      }
      return {
        prompt: 'Which figure does not belong?',
        figureLayout: 'odd-one-out',
        correct: odd,
        distractors: distinct(odd, normal, d >= 3 ? 4 : 3),
        explanation: {
          pattern,
          howToSpot: 'Find the property that four of the five share. The one that breaks it is the answer.',
          trap: 'Fixating on a property that differs for all of them (like shape) instead of the one shared by four.',
        },
      }
    },
  },
]

export const figure = makeGenerator('figure', FIGURE_FAMILIES)
