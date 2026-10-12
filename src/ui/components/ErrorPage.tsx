import { Link, useRouteError } from 'react-router-dom'
import { Button, Card } from './ui'

/** Shown by the router when a page throws. Keeps the person oriented instead of a blank screen. */
export function ErrorPage() {
  const err = useRouteError() as { message?: string } | undefined
  const msg = err?.message ?? String(err ?? 'Unknown error')
  const storage = /database|indexeddb|quota|transaction|closed/i.test(msg)
  return (
    <div className="mx-auto max-w-lg p-4">
      <Card>
        <h1 className="text-lg font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm">
          {storage
            ? 'The browser blocked or lost access to local storage. Lessons and practice still work, but progress may not be saved. Reloading usually fixes a temporary glitch.'
            : 'An unexpected error stopped this page.'}
        </p>
        <pre className="mt-2 max-h-32 overflow-auto rounded bg-slate-100 p-2 text-xs dark:bg-slate-800">{msg}</pre>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => window.location.reload()}>Reload</Button>
          <Link to="/" className="inline-flex min-h-11 items-center rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold dark:bg-slate-800">Go home</Link>
        </div>
      </Card>
    </div>
  )
}
