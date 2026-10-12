import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

/** Focus mode hides the navigation while a question is on screen (timed sessions mimic a real test). */
const FocusContext = createContext<{ focus: boolean; setFocus: (v: boolean) => void }>({ focus: false, setFocus: () => {} })

export function FocusProvider({ children }: { children: ReactNode }) {
  const [focus, setFocus] = useState(false)
  const value = useMemo(() => ({ focus, setFocus }), [focus])
  return <FocusContext.Provider value={value}>{children}</FocusContext.Provider>
}

export function useFocusValue() {
  return useContext(FocusContext).focus
}

/** Call from a page: focus mode is on while `active` is true and off when the page unmounts. */
export function useFocusMode(active: boolean) {
  const { setFocus } = useContext(FocusContext)
  useEffect(() => {
    setFocus(active)
    return () => setFocus(false)
  }, [active, setFocus])
}
