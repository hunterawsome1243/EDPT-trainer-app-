import type { Rng } from '../types'

/** mulberry32: small, fast, deterministic. */
export function createRng(seed: number): Rng {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const rng: Rng = {
    next,
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    pick: (arr) => {
      if (arr.length === 0) throw new Error('pick from empty array')
      return arr[Math.floor(next() * arr.length)] as (typeof arr)[number]
    },
    shuffle: (arr) => {
      const out = arr.slice()
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1))
        const tmp = out[i] as (typeof out)[number]
        out[i] = out[j] as (typeof out)[number]
        out[j] = tmp
      }
      return out
    },
    bool: (p = 0.5) => next() < p,
  }
  return rng
}

/** Stable 32-bit hash of a string, for deriving seeds from ids. */
export function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Non-deterministic seed for new questions (only call from UI code). */
export function randomSeed(): number {
  return Math.floor(Math.random() * 0x7fffffff)
}
