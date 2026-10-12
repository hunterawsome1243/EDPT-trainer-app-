import Dexie, { type EntityTable } from 'dexie'
import type { Attempt, QuestionType, SessionRecord } from '../types'
import type { ReviewState } from '../engine/spaced'

export interface Setting {
  key: string
  value: unknown
}

export interface LessonProgress {
  type: QuestionType
  /** highest difficulty tier unlocked (1..5) */
  tier: number
  readAt?: number
  masteryPassedAt?: number
}

export interface SavedExam {
  id: string // 'current'
  seed: number
  length: number
  startedAt: number
  /** index of the question being viewed */
  index: number
  answers: Record<string, { chosen: string | null; timeMs: number; flagged: boolean }>
  scratch: string
  noBacktrack: boolean
}

export interface MentalMathResult {
  id?: number
  drill: string
  correct: number
  total: number
  seconds: number
  at: number
}

export class EdptDb extends Dexie {
  attempts!: EntityTable<Attempt, 'id'>
  sessions!: EntityTable<SessionRecord, 'id'>
  reviews!: EntityTable<ReviewState, 'key'>
  settings!: EntityTable<Setting, 'key'>
  lessons!: EntityTable<LessonProgress, 'type'>
  savedExam!: EntityTable<SavedExam, 'id'>
  mentalMath!: EntityTable<MentalMathResult, 'id'>

  constructor() {
    super('edpt-trainer')
    this.version(1).stores({
      attempts: '++id, questionId, type, ruleId, correct, at, sessionId, [type+ruleId]',
      sessions: '++id, mode, startedAt, finishedAt',
      reviews: 'key, due',
      settings: 'key',
      lessons: 'type',
      savedExam: 'id',
      mentalMath: '++id, drill, at',
    })
  }
}

export const db = new EdptDb()

export interface Settings {
  targetAfsc: string
  testDate: string // YYYY-MM-DD or ''
  minutesPerDay: number
  guessingPenalty: boolean
  theme: 'system' | 'light' | 'dark'
  largeText: boolean
  reducedMotion: boolean
  noBacktrack: boolean
  onboarded: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  targetAfsc: '1D7X1',
  testDate: '',
  minutesPerDay: 45,
  guessingPenalty: false,
  theme: 'system',
  largeText: false,
  reducedMotion: false,
  noBacktrack: false,
  onboarded: false,
}

export async function loadSettings(): Promise<Settings> {
  const rows = await db.settings.toArray()
  const s = { ...DEFAULT_SETTINGS }
  for (const r of rows) (s as Record<string, unknown>)[r.key] = r.value
  return s
}

export async function saveSetting<K extends keyof Settings>(key: K, value: Settings[K]): Promise<void> {
  await db.settings.put({ key, value })
}

export async function exportAll(): Promise<string> {
  const data = {
    version: 1,
    exportedAt: Date.now(),
    attempts: await db.attempts.toArray(),
    sessions: await db.sessions.toArray(),
    reviews: await db.reviews.toArray(),
    settings: await db.settings.toArray(),
    lessons: await db.lessons.toArray(),
    mentalMath: await db.mentalMath.toArray(),
  }
  return JSON.stringify(data, null, 2)
}

export async function importAll(json: string, mode: 'merge' | 'replace'): Promise<void> {
  const data = JSON.parse(json) as Partial<Awaited<ReturnType<typeof collect>>> & { version?: number }
  if (data.version !== 1) throw new Error('Unrecognised export file')
  await db.transaction('rw', [db.attempts, db.sessions, db.reviews, db.settings, db.lessons, db.mentalMath], async () => {
    if (mode === 'replace') {
      await Promise.all([db.attempts.clear(), db.sessions.clear(), db.reviews.clear(), db.settings.clear(), db.lessons.clear(), db.mentalMath.clear()])
    }
    const strip = <T extends { id?: number }>(rows: T[]) => rows.map(({ id: _id, ...r }) => r as T)
    if (data.attempts) await db.attempts.bulkAdd(strip(data.attempts))
    if (data.sessions) await db.sessions.bulkAdd(strip(data.sessions))
    if (data.reviews) await db.reviews.bulkPut(data.reviews)
    if (data.settings) await db.settings.bulkPut(data.settings)
    if (data.lessons) await db.lessons.bulkPut(data.lessons)
    if (data.mentalMath) await db.mentalMath.bulkAdd(strip(data.mentalMath))
  })
}

async function collect() {
  return {
    attempts: await db.attempts.toArray(),
    sessions: await db.sessions.toArray(),
    reviews: await db.reviews.toArray(),
    settings: await db.settings.toArray(),
    lessons: await db.lessons.toArray(),
    mentalMath: await db.mentalMath.toArray(),
  }
}

export async function clearAll(): Promise<void> {
  await db.delete()
  await db.open()
}
