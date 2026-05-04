/**
 * Recharts theme utilities — now powered by ThemeContext.
 * Drop-in replacement for the old hardcoded chartTheme.js.
 *
 * Usage in components:
 *   import { useChartTheme } from '../theme/chartTheme'
 *   const { tooltipProps, axisTick, ACCENT, ACCENT_WARNING, cropTypeColors, categoryColors } = useChartTheme()
 */

import { useTheme } from './ThemeContext'
import { getChartTheme } from './themeConfig'

export function useChartTheme() {
  const { themeId } = useTheme()
  return getChartTheme(themeId)
}

// ── Legacy static exports (backwards compat for non-hook contexts) ──────

/** These are DEPRECATED — use useChartTheme() hook instead. */

export const tooltipProps = {
  contentStyle: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--text)',
    fontSize: 13,
    boxShadow: 'var(--shadow-md)',
  },
  labelStyle: {
    color: 'var(--text)',
    fontWeight: 600,
    marginBottom: 4,
  },
  itemStyle: {
    color: 'var(--text-muted)',
  },
  cursor: { fill: 'rgba(255,255,255,0.04)' },
}

export const axisTick = { fill: 'var(--text-muted)', fontSize: 12 }
export const ACCENT = 'var(--accent)'
export const ACCENT_WARNING = 'var(--warning)'

export const cropTypeColors = {
  'CERISE ALLONGE': '#ef4444',
  'CERISE RONDE': '#f59e0b',
  'TOMATE RONDE': '#10b981',
  'POIVRON': '#3b82f6',
}

export const categoryColors = {
  "Main D'Œuvre": '#10b981',
  'Echassier': '#3b82f6',
  'Poste Fixe': '#8b5cf6',
  'Dépenses Externes': '#f59e0b',
  'Dépenses Internes': '#ef4444',
}
