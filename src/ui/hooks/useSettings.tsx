import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_SETTINGS, db, loadSettings, saveSetting, type Settings } from '../../db/db'

interface Ctx {
  settings: Settings
  loaded: boolean
  /** false when IndexedDB is blocked or broken: the app still works but nothing is saved. */
  storageOk: boolean
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => Promise<void>
  /** Reset in-memory settings to defaults (after the database was cleared). */
  resetToDefaults: () => void
}

const SettingsContext = createContext<Ctx>({ settings: DEFAULT_SETTINGS, loaded: false, storageOk: true, update: async () => {}, resetToDefaults: () => {} })

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)
  const [storageOk, setStorageOk] = useState(true)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await db.open()
        const s = await loadSettings()
        if (!cancelled) setSettings(s)
      } catch {
        if (!cancelled) setStorageOk(false)
      } finally {
        if (!cancelled) setLoaded(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])
  const update = useCallback(async <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((s) => ({ ...s, [key]: value }))
    try {
      await saveSetting(key, value)
    } catch {
      setStorageOk(false)
    }
  }, [])
  const resetToDefaults = useCallback(() => setSettings({ ...DEFAULT_SETTINGS }), [])
  // Apply theme / text size / motion to <html>. With the "system" setting the page follows the
  // host: a data-theme attribute set by an embedding viewer wins, then the OS preference.
  useEffect(() => {
    const root = document.documentElement
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const host = root.getAttribute('data-theme')
      const systemDark = host === 'dark' ? true : host === 'light' ? false : mq.matches
      const dark = settings.theme === 'dark' || (settings.theme === 'system' && systemDark)
      root.classList.toggle('dark', dark)
      root.classList.toggle('light', !dark)
      root.classList.toggle('large', settings.largeText)
      root.classList.toggle('reduced-motion', settings.reducedMotion)
    }
    apply()
    mq.addEventListener('change', apply)
    const obs = new MutationObserver(apply)
    obs.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
    return () => {
      mq.removeEventListener('change', apply)
      obs.disconnect()
    }
  }, [settings.theme, settings.largeText, settings.reducedMotion])
  const value = useMemo(() => ({ settings, loaded, storageOk, update, resetToDefaults }), [settings, loaded, storageOk, update, resetToDefaults])
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  return useContext(SettingsContext)
}
