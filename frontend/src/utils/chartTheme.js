/**
 * Shared Recharts theme utilities.
 * All values reference CSS custom properties so they automatically
 * adapt to dark / light mode without any extra React state.
 */

/** Drop-in props for every <Tooltip /> component */
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

/** Common tick style for XAxis / YAxis */
export const axisTick = { fill: 'var(--text-muted)', fontSize: 12 }

/** Accent colours (mirrors CSS tokens for use inside JSX fill props) */
export const ACCENT = 'var(--accent)'
export const ACCENT_WARNING = 'var(--accent-warning)'

/** Crop-type colour map */
export const cropTypeColors = {
  'CERISE ALLONGE': '#ef4444',
  'CERISE RONDE': '#f59e0b',
  'TOMATE RONDE': '#10b981',
  'POIVRON': '#3b82f6',
}

/** Cost-category colour map */
export const categoryColors = {
  "Main D'œuvre": '#10b981',
  'Echassier': '#3b82f6',
  'Poste Fixe': '#8b5cf6',
  'Dépenses Externes': '#f59e0b',
  'Dépenses Internes': '#ef4444',
}
