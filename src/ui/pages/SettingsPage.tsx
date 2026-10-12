import { useRef, useState } from 'react'
import { clearAll, exportAll, importAll } from '../../db/db'
import { CUTOFFS, DISCLAIMER } from '../../content/reference'
import { useSettings } from '../hooks/useSettings'
import { Button, Card, Disclaimer, Field, PageTitle, inputCls } from '../components/ui'

export function SettingsPage() {
  const { settings, update } = useSettings()
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const doExport = async () => {
    const json = await exportAll()
    const blob = new Blob([json], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `edpt-trainer-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const doImport = async (mode: 'merge' | 'replace') => {
    const f = fileRef.current?.files?.[0]
    if (!f) { setMsg('Choose a file first.'); return }
    try {
      await importAll(await f.text(), mode)
      setMsg('Import complete.')
    } catch (e) {
      setMsg(`Import failed: ${(e as Error).message}`)
    }
  }
  const reset = async () => {
    if (!window.confirm('Delete all progress on this device? This cannot be undone.')) return
    await clearAll()
    await update('onboarded', false)
    setMsg('All data cleared.')
  }
  return (
    <div className="space-y-4">
      <PageTitle>Settings</PageTitle>
      <Card>
        <h2 className="mb-3 font-semibold">Your target</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Career field (AFSC)">
            <select className={inputCls} value={settings.targetAfsc} onChange={(e) => update('targetAfsc', e.target.value)}>
              {CUTOFFS.map((c) => <option key={c.afsc} value={c.afsc}>{c.afsc} · {c.title} (min {c.minScore})</option>)}
            </select>
          </Field>
          <Field label="Test date">
            <input type="date" className={inputCls} value={settings.testDate} onChange={(e) => update('testDate', e.target.value)} />
          </Field>
          <Field label="Minutes per day">
            <input type="number" min={10} max={240} className={inputCls} value={settings.minutesPerDay} onChange={(e) => update('minutesPerDay', Math.max(10, Number(e.target.value) || 45))} />
          </Field>
          <Field label="Scoring model" hint="Sources disagree on whether wrong answers are penalised. The strategy guide adapts to this setting.">
            <select className={inputCls} value={settings.guessingPenalty ? 'penalty' : 'none'} onChange={(e) => update('guessingPenalty', e.target.value === 'penalty')}>
              <option value="none">No penalty for wrong answers</option>
              <option value="penalty">Wrong answers subtract ¼ point</option>
            </select>
          </Field>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={settings.onboarded} onChange={(e) => update('onboarded', e.target.checked)} /> Hide the welcome card on Home</label>
      </Card>
      <Card>
        <h2 className="mb-3 font-semibold">Display</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Theme">
            <select className={inputCls} value={settings.theme} onChange={(e) => update('theme', e.target.value as typeof settings.theme)}>
              <option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option>
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={settings.largeText} onChange={(e) => update('largeText', e.target.checked)} /> Larger text</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={settings.reducedMotion} onChange={(e) => update('reducedMotion', e.target.checked)} /> Reduce motion</label>
        </div>
      </Card>
      <Card>
        <h2 className="mb-3 font-semibold">Your data</h2>
        <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">Everything is stored on this device only. Export a JSON file to back up or move to another device.</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={doExport}>Export JSON</Button>
          <input ref={fileRef} type="file" accept="application/json" aria-label="Import file" className="text-sm" />
          <Button variant="secondary" onClick={() => doImport('merge')}>Import (merge)</Button>
          <Button variant="secondary" onClick={() => doImport('replace')}>Import (replace)</Button>
        </div>
        {msg && <p className="mt-2 text-sm" aria-live="polite">{msg}</p>}
        <div className="mt-4"><Button variant="danger" onClick={reset}>Delete all progress</Button></div>
      </Card>
      <Disclaimer text={DISCLAIMER} />
    </div>
  )
}
