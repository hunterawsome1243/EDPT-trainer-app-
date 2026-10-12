import { beforeEach, describe, expect, it } from 'vitest'
import { clearAll, db, exportAll, importAll, loadSettings, saveSetting } from './db'

describe('db', () => {
  beforeEach(async () => {
    await clearAll()
  })
  it('stores settings with defaults', async () => {
    expect((await loadSettings()).minutesPerDay).toBe(45)
    await saveSetting('minutesPerDay', 90)
    expect((await loadSettings()).minutesPerDay).toBe(90)
  })
  it('round-trips an export', async () => {
    await db.attempts.add({ questionId: 'a:b:1:2', type: 'logic', ruleId: 'b', difficulty: 1, correct: true, timeMs: 10, chosenOptionId: 'A', at: 1 })
    await saveSetting('targetAfsc', '17S')
    const json = await exportAll()
    await clearAll()
    expect(await db.attempts.count()).toBe(0)
    await importAll(json, 'replace')
    expect(await db.attempts.count()).toBe(1)
    expect((await loadSettings()).targetAfsc).toBe('17S')
  })
  it('rejects unknown files', async () => {
    await expect(importAll('{"version":9}', 'merge')).rejects.toThrow()
  })
})
