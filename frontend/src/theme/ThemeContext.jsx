import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getTheme, themeToCSSVars, THEMES } from './themeConfig'

const ThemeContext = createContext(null)

const STORAGE_KEY = 'agri-theme'
const DEFAULT_THEME = 'agro-dark'

function getSavedTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && THEMES[saved]) return saved
  } catch { /* private browsing */ }
  return DEFAULT_THEME
}

export function ThemeProvider({ children }) {
  const [themeId, setThemeIdState] = useState(getSavedTheme)

  // Apply CSS custom properties to :root and body whenever theme changes
  useEffect(() => {
    const vars = themeToCSSVars(getTheme(themeId))
    // Set on both html and body so nothing shadows them
    for (const el of [document.documentElement, document.body]) {
      for (const [key, value] of Object.entries(vars)) {
        el.style.setProperty(key, value)
      }
    }

    // Manage dark class on body for any remaining CSS selectors that depend on it
    const isDark = ['agro-dark', 'forest'].includes(themeId)
    document.body.classList.toggle('dark', isDark)

    // Apply background glow if present
    const effects = getTheme(themeId).effects
    if (effects.backgroundGlow) {
      document.body.style.setProperty('--bg-glow', effects.backgroundGlow)
    } else {
      document.body.style.setProperty('--bg-glow', 'none')
    }
  }, [themeId])

  const setThemeId = useCallback((id) => {
    if (THEMES[id]) {
      setThemeIdState(id)
      try { localStorage.setItem(STORAGE_KEY, id) } catch {}
    }
  }, [])

  const theme = getTheme(themeId)

  return (
    <ThemeContext.Provider value={{
      themeId,
      theme,
      setThemeId,
      availableThemes: Object.values(THEMES),
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
