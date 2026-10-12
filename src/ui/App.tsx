import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { SettingsProvider } from './hooks/useSettings'

const NAV = [
  { to: '/', label: 'Home', icon: '⌂' },
  { to: '/learn', label: 'Learn', icon: '📖' },
  { to: '/practice', label: 'Practice', icon: '✎' },
  { to: '/simulate', label: 'Simulate', icon: '⏱' },
  { to: '/analyze', label: 'Analyze', icon: '📈' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
]

export function App() {
  const loc = useLocation()
  // Hide chrome during a timed session so the screen mimics a real test.
  const focus = loc.pathname.endsWith('/session') || loc.pathname.endsWith('/exam')
  return (
    <SettingsProvider>
      <div className="min-h-dvh bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-sky-600 focus:px-3 focus:py-2 focus:text-white">
          Skip to content
        </a>
        <div className="mx-auto flex max-w-6xl">
          {!focus && (
            <nav aria-label="Main" className="sticky top-0 hidden h-dvh w-48 shrink-0 flex-col gap-1 border-r border-slate-200 p-3 md:flex dark:border-slate-800">
              <div className="mb-4 px-2 text-lg font-bold tracking-tight text-sky-700 dark:text-sky-400">EDPT Trainer</div>
              {NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.to === '/'}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-2 text-sm font-medium transition hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 dark:hover:bg-slate-800 ${isActive ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200' : ''}`
                  }
                >
                  <span aria-hidden className="mr-2">{n.icon}</span>
                  {n.label}
                </NavLink>
              ))}
            </nav>
          )}
          <main id="main" className={`min-w-0 flex-1 px-4 py-4 ${focus ? '' : 'pb-24 md:pb-8'}`}>
            <Outlet />
          </main>
        </div>
        {!focus && (
          <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-900/95" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2 text-[11px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 ${isActive ? 'text-sky-700 dark:text-sky-300' : 'text-slate-500 dark:text-slate-400'}`}
              >
                <span aria-hidden className="text-base leading-none">{n.icon}</span>
                {n.label}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </SettingsProvider>
  )
}
