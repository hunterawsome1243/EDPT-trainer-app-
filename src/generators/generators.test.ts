import { describe, expect, it } from 'vitest'
import { ALL_GENERATORS } from './index'
import type { Difficulty } from '../types'

const DIFFICULTIES: Difficulty[] = [1, 2, 3, 4, 5]
const SEEDS = Array.from({ length: 40 }, (_, i) => 1000 + i * 7919)

describe.each(ALL_GENERATORS.map((g) => [g.type, g] as const))('%s generator', (_type, gen) => {
  it('has at least 10 rule families', () => {
    expect(gen.families.length).toBeGreaterThanOrEqual(10)
  })

  it('has at least 3 families available at difficulty 1', () => {
    expect(gen.families.filter((f) => f.minDifficulty === 1).length).toBeGreaterThanOrEqual(3)
  })

  describe.each(gen.families.map((f) => [f.id] as const))('family %s', (ruleId) => {
    it.each(DIFFICULTIES)('produces valid questions at difficulty %i', (difficulty) => {
      for (const seed of SEEDS) {
        const q = gen.generate(seed, difficulty, ruleId)
        expect(q.ruleId).toBe(ruleId)
        expect(q.options.length).toBeGreaterThanOrEqual(4)
        expect(q.options.length).toBeLessThanOrEqual(5)
        const correct = q.options.filter((o) => o.id === q.correctOptionId)
        expect(correct).toHaveLength(1)
        const keys = q.options.map((o) => o.text ?? JSON.stringify(o.figure?.shapes))
        expect(new Set(keys).size).toBe(keys.length)
        for (const o of q.options) {
          if (o.text !== undefined) {
            expect(o.text.trim()).not.toBe('')
            expect(o.text).not.toMatch(/NaN|Infinity|undefined/)
          } else {
            expect(o.figure).toBeDefined()
            expect(o.figure!.shapes.length).toBeGreaterThan(0)
          }
        }
        expect(q.explanation.pattern.length).toBeGreaterThan(10)
        expect(q.explanation.howToSpot.length).toBeGreaterThan(10)
        expect(q.explanation.trap.length).toBeGreaterThan(5)
        expect(q.prompt.length).toBeGreaterThan(3)
        if (q.stem !== undefined) expect(q.stem).not.toMatch(/NaN|Infinity|undefined/)
        if (q.figures) {
          for (const f of q.figures) expect(f.alt.length).toBeGreaterThan(0)
        }
      }
    })

    it('is deterministic for the same seed', () => {
      for (const d of DIFFICULTIES) {
        const a = gen.generate(4242, d, ruleId)
        const b = gen.generate(4242, d, ruleId)
        expect(b).toEqual(a)
      }
    })

    it('varies across seeds', () => {
      const ids = new Set(SEEDS.slice(0, 15).map((s) => JSON.stringify(gen.generate(s, 3, ruleId).options)))
      expect(ids.size).toBeGreaterThan(3)
    })
  })

  it('picks only eligible families without an explicit rule', () => {
    for (const d of DIFFICULTIES) {
      for (const seed of SEEDS.slice(0, 20)) {
        const q = gen.generate(seed, d)
        const fam = gen.families.find((f) => f.id === q.ruleId)!
        expect(fam.minDifficulty).toBeLessThanOrEqual(d)
        expect(q.difficulty).toBe(d)
      }
    }
  })

  it('generates quickly', () => {
    const t0 = performance.now()
    for (let i = 0; i < 200; i++) gen.generate(i, ((i % 5) + 1) as Difficulty)
    const per = (performance.now() - t0) / 200
    expect(per).toBeLessThan(50)
  })
})
