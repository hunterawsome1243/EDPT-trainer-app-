import { useState } from 'react'
import { Button } from './ui'

export function ScratchPad({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <Button variant="secondary" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="scratch">
        {open ? 'Hide scratch pad' : 'Scratch pad'}
      </Button>
      {open && (
        <textarea
          id="scratch"
          aria-label="Scratch pad"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Differences, alphabet positions, working…"
          className="mt-2 h-40 w-full rounded-lg border border-slate-300 bg-yellow-50 p-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-800"
        />
      )}
    </div>
  )
}
