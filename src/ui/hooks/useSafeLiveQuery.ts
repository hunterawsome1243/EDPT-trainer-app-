import { useLiveQuery } from 'dexie-react-hooks'

/**
 * useLiveQuery that never throws into React: a failing IndexedDB query (blocked storage, a
 * database that closed after opening) resolves to the default value instead of unmounting the app.
 */
export function useSafeLiveQuery<T, D>(querier: () => Promise<T> | T, deps: unknown[], defaultValue: D): T | D
export function useSafeLiveQuery<T>(querier: () => Promise<T> | T, deps: unknown[]): T | undefined
export function useSafeLiveQuery<T, D>(querier: () => Promise<T> | T, deps: unknown[], defaultValue?: D): T | D | undefined {
  return useLiveQuery(
    async () => {
      try {
        return await querier()
      } catch {
        return defaultValue
      }
    },
    deps,
    defaultValue,
  )
}
