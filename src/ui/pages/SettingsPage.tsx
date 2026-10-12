import { useRef, useState } from 'react'
import { clearAll, exportAll, importAll } from '../../db/db'
import { CUTOFFS, DISCLAIMER } from '../../content/reference'
import { useSettings } from '../hooks/useSettings'
import { Button, Card, Disclaimer, Field, PageTitle, inputCls } from '../components/ui'

export function SettingsPage() {
  const { settings, update } = useSettings()
  const [msg, setMsg] = useState('')
  const [exported, setExported] = useState('')
  const [pasted, setPasted] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const doExport = async () => {
    const json = await exportAll()
    setExported(json)
    // A download works in a normal browser; inside an embedded viewer it may be blocked, so the
    // JSON is also shown below with a copy button.
    try {
      const blob = new Blob([json], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `edpt-trainer-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch {
      /* fall through to the copy box */
    }
    setMsg('Export ready. If no file downloaded, copy the text below and save it.')
  }
  const copyExport = async () => {
    try {
      await navigator.clipboard.writeText(exported)
      setMsg('Copied to clipboard.')
    } catch {
      const ta = document.getElementById('export-box') as HTMLTextAreaElement | null
      ta?.focus()
      ta?.select()
      setMsg('Select the text and copy it manually.')
    }
  }
  const doImport = async (mode: 'merge' | 'replace') => {
    const f = fileRef.current?.files?.[0]
    const text = f ? await f.text() : pasted.trim()
    if (!text) { setMsg('Choose a file or paste an export first.'); return }
    try {
      await importAll(text, mode)
      setMsg(`Import complete (${mode}).`)
      setPasted('')
    } catch (e) {
      setMsg(`Import failed: ${(e as Error).message}`)
    }
  }
  const reset = async () => {
    await clearAll()
    await update('onboarded', false)
    setConfirmReset(false)
    setMsg('All data cleared.')
  }
  return (
    <div className="space-y-4">
      <PageTitle>Settings</PageTitle>
      <Card>
        <h2 className="mb-3 font-semibold">Your target</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Career field (AFSC)">
            <select id="afsc" className={inputCls} value={settings.targetAfsc} onChange={(e) => update('targetAfsc', e.target.value)}>
              {CUTOFFS.map((c) => <option key={c.afsc} value={c.afsc}>{c.afsc} · {c.title} (min {c.minScore})</option>)}
            </select>
          </Field>
          <Field label="Test date">
            <input id="test-date" type="date" className={inputCls} value={settings.testDate} onChange={(e) => update('testDate', e.target.value)} />
          </Field>
          <Field label="Minutes per day">
            <input id="minutes-per-day" type="number" min={10} max={240} className={inputCls} value={settings.minutesPerDay} onChange={(e) => update('minutesPerDay', Math.max(10, Number(e.target.value) || 45))} />
          </Field>
          <Field label="Scoring model" hint="Sources disagree on whether wrong answers are penalised. The strategy guide adapts to this setting.">
            <select id="scoring-model" className={inputCls} value={settings.guessingPenalty ? 'penalty' : 'none'} onChange={(e) => update('guessingPenalty', e.target.value === 'penalty')}>
              <option value="none">No penalty for wrong answers</option>
              <option value="penalty">Wrong answers subtract ¼ point</option>
            </select>
          </Field>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm"><input id="hide-welcome" type="checkbox" className="h-4 w-4" checked={settings.onboarded} onChange={(e) => update('onboarded', e.target.checked)} /> Hide the welcome card on Home</label>
      </Card>
      <Card>
        <h2 className="mb-3 font-semibold">Display</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Theme">
            <select id="theme" className={inputCls} value={settings.theme} onChange={(e) => update('theme', e.target.value as typeof settings.theme)}>
              <option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option>
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm"><input id="large-text" type="checkbox" className="h-4 w-4" checked={settings.largeText} onChange={(e) => update('largeText', e.target.checked)} /> Larger text</label>
          <label className="flex items-center gap-2 text-sm"><input id="reduced-motion" type="checkbox" className="h-4 w-4" checked={settings.reducedMotion} onChange={(e) => update('reducedMotion', e.target.checked)} /> Reduce motion</label>
        </div>
      </Card>
      <Card>
        <h2 className="mb-3 font-semibold">Your data</h2>
        <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">Everything is stored on this device only. Export to back up or move to another device; import a file or paste an export.</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={doExport}>Export</Button>
          {exported && <Button variant="secondary" onClick={copyExport}>Copy export</Button>}
        </div>
        {exported && <textarea id="export-box" aria-label="Exported data" readOnly value={exported} className="mt-2 h-28 w-full rounded-lg border border-slate-300 p-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800" />}
        <div className="mt-4 grid gap-2">
          <input ref={fileRef} id="import-file" type="file" accept="application/json,.json" aria-label="Import file" className="text-sm" />
          <textarea id="import-box" aria-label="Paste an export here" placeholder="…or paste an export here" value={pasted} onChange={(e) => setPasted(e.target.value)} className="h-20 w-full rounded-lg border border-slate-300 p-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800" />
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => doImport('merge')}>Import (merge)</Button>
            <Button variant="secondary" onClick={() => doImport('replace')}>Import (replace)</Button>
          </div>
        </div>
        {msg && <p className="mt-2 text-sm" aria-live="polite">{msg}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {!confirmReset ? (
            <Button variant="danger" onClick={() => setConfirmReset(true)}>Delete all progress</Button>
          ) : (
            <>
              <span className="text-sm">Delete every attempt, session and setting on this device? This cannot be undone.</span>
              <Button variant="danger" onClick={reset}>Yes, delete everything</Button>
              <Button variant="secondary" onClick={() => setConfirmReset(false)}>Cancel</Button>
            </>
          )}
        </div>
      </Card>
      <Disclaimer text={DISCLAIMER} />
    </div>
  )
}
