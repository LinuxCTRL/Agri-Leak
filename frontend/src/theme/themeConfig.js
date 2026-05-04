/**
 * 🌱 Agri Data Lake — Theme Configuration
 *
 * Five curated themes for agricultural data analytics.
 * Each theme defines: colors, typography, radii, shadows, spacing, chart palettes.
 *
 * Theme IDs:  'agro-light' | 'agro-dark' | 'forest' | 'harvest' | 'ocean'
 */

// ═══════════════════════════════════════════════════════════════════════════
// Theme definitions
// ═══════════════════════════════════════════════════════════════════════════

export const THEMES = {

  /* ─── 🌿 Agro Light (default) ─────────────────────────────────────────── */
  'agro-light': {
    id: 'agro-light',
    name: 'Agro Light',
    icon: '🌿',
    description: 'Clean, bright, modern agri-tech',

    // ── Colors ──
    colors: {
      bg:            '#f8fafc',
      bgSecondary:   '#f0fdf4',
      surface:       '#ffffff',
      surfaceAlt:    '#f1f5f9',
      border:        '#e2e8f0',
      borderStrong:  '#cbd5e1',

      text:          '#0f172a',
      textSecondary: '#334155',
      textMuted:     '#64748b',
      textInverse:   '#f8fafc',

      accent:        '#0d9488',   // teal-600
      accentHover:   '#0f766e',   // teal-700
      accentLight:   '#f0fdfa',
      accentSoft:    '#ccfbf1',

      success:       '#10b981',   // emerald-500
      warning:       '#f59e0b',   // amber-500
      danger:        '#ef4444',   // red-500
      info:          '#3b82f6',   // blue-500

      // Semantic
      sidebarBg:     '#0f172a',
      sidebarText:   '#e2e8f0',
      sidebarHover:  'rgba(255,255,255,0.08)',
      sidebarActive: '#0d9488',

      topbarBg:      '#ffffff',
      topbarBorder:  '#e2e8f0',

      cardBorder:    '#e2e8f0',
      cardShadow:    '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
    },

    // ── Shadows ──
    shadows: {
      sm:  '0 1px 2px rgba(0,0,0,0.05)',
      md:  '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
      lg:  '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04)',
      xl:  '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.04)',
    },

    // ── Chart palette ──
    chart: {
      palette:      ['#0d9488','#f59e0b','#3b82f6','#ef4444','#8b5cf6','#10b981','#ec4899','#f97316'],
      grid:         '#e2e8f0',
      axis:         '#94a3b8',
      tooltipBg:    '#ffffff',
      tooltipBorder:'#e2e8f0',
      cropColors: {
        'CERISE ALLONGE': '#ef4444',
        'CERISE RONDE':   '#f59e0b',
        'TOMATE RONDE':   '#10b981',
        'POIVRON':        '#3b82f6',
      },
      categoryColors: {
        "Main D'Œuvre":    '#10b981',
        'Echassier':       '#3b82f6',
        'Poste Fixe':      '#8b5cf6',
        'Dépenses Externes':'#f59e0b',
        'Dépenses Internes':'#ef4444',
      },
    },

    // ── Effects ──
    effects: {
      glassBlur: 'blur(12px)',
      backgroundGlow: null, // no glow in light mode
      sidebarGlass: false,
    },
  },

  /* ─── 🌙 Agro Dark ────────────────────────────────────────────────────── */
  'agro-dark': {
    id: 'agro-dark',
    name: 'Agro Dark',
    icon: '🌙',
    description: 'Deep obsidian with vibrant teal highlights',

    colors: {
      bg:            '#020617',
      bgSecondary:   '#0f172a',
      surface:       '#0f172a',
      surfaceAlt:    '#1e293b',
      border:        '#1e293b',
      borderStrong:  '#334155',

      text:          '#f8fafc',
      textSecondary: '#e2e8f0',
      textMuted:     '#94a3b8',
      textInverse:   '#0f172a',

      accent:        '#14b8a6',
      accentHover:   '#2dd4bf',
      accentLight:   'rgba(20,184,166,0.12)',
      accentSoft:    'rgba(20,184,166,0.18)',

      success:       '#34d399',
      warning:       '#fbbf24',
      danger:        '#f87171',
      info:          '#60a5fa',

      sidebarBg:     '#020617',
      sidebarText:   '#94a3b8',
      sidebarHover:  'rgba(255,255,255,0.06)',
      sidebarActive: '#14b8a6',

      topbarBg:      'rgba(15,23,42,0.85)',
      topbarBorder:  '#1e293b',

      cardBorder:    '#1e293b',
      cardShadow:    '0 10px 30px rgba(0,0,0,0.5)',
    },

    shadows: {
      sm:  '0 1px 2px rgba(0,0,0,0.3)',
      md:  '0 4px 6px rgba(0,0,0,0.4)',
      lg:  '0 10px 20px rgba(0,0,0,0.5)',
      xl:  '0 20px 40px rgba(0,0,0,0.6)',
    },

    chart: {
      palette:      ['#14b8a6','#fbbf24','#60a5fa','#f87171','#a78bfa','#34d399','#f472b6','#fb923c'],
      grid:         '#1e293b',
      axis:         '#64748b',
      tooltipBg:    '#1e293b',
      tooltipBorder:'#334155',
      cropColors: {
        'CERISE ALLONGE': '#f87171',
        'CERISE RONDE':   '#fbbf24',
        'TOMATE RONDE':   '#34d399',
        'POIVRON':        '#60a5fa',
      },
      categoryColors: {
        "Main D'Œuvre":    '#34d399',
        'Echassier':       '#60a5fa',
        'Poste Fixe':      '#a78bfa',
        'Dépenses Externes':'#fbbf24',
        'Dépenses Internes':'#f87171',
      },
    },

    effects: {
      glassBlur: 'blur(12px)',
      backgroundGlow: 'radial-gradient(circle at 20% 20%, rgba(20,184,166,0.07) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(16,185,129,0.05) 0%, transparent 40%)',
      sidebarGlass: false,
    },
  },

  /* ─── 🌲 Forest ────────────────────────────────────────────────────────── */
  'forest': {
    id: 'forest',
    name: 'Forest',
    icon: '🌲',
    description: 'Rich pine greens with golden amber accents',

    colors: {
      bg:            '#0d2818',
      bgSecondary:   '#0f2d1b',
      surface:       '#163a27',
      surfaceAlt:    '#1d4a34',
      border:        '#1d4a34',
      borderStrong:  '#2a5c42',

      text:          '#e8f5e9',
      textSecondary: '#c8e6c9',
      textMuted:     '#81c784',
      textInverse:   '#0d2818',

      accent:        '#66bb6a',
      accentHover:   '#81c784',
      accentLight:   'rgba(102,187,106,0.15)',
      accentSoft:    'rgba(102,187,106,0.22)',

      success:       '#81c784',
      warning:       '#ffb74d',
      danger:        '#ef5350',
      info:          '#64b5f6',

      sidebarBg:     '#071a0e',
      sidebarText:   '#a5d6a7',
      sidebarHover:  'rgba(255,255,255,0.06)',
      sidebarActive: '#4caf50',

      topbarBg:      'rgba(22,58,39,0.88)',
      topbarBorder:  '#1d4a34',

      cardBorder:    '#1d4a34',
      cardShadow:    '0 8px 24px rgba(0,0,0,0.35)',
    },

    shadows: {
      sm:  '0 1px 2px rgba(0,0,0,0.25)',
      md:  '0 4px 8px rgba(0,0,0,0.35)',
      lg:  '0 10px 20px rgba(0,0,0,0.45)',
      xl:  '0 20px 40px rgba(0,0,0,0.55)',
    },

    chart: {
      palette:      ['#66bb6a','#ffb74d','#42a5f5','#ef5350','#ab47bc','#81c784','#ec407a','#ff8a65'],
      grid:         '#1d4a34',
      axis:         '#81c784',
      tooltipBg:    '#1d4a34',
      tooltipBorder:'#2a5c42',
      cropColors: {
        'CERISE ALLONGE': '#ef5350',
        'CERISE RONDE':   '#ffb74d',
        'TOMATE RONDE':   '#66bb6a',
        'POIVRON':        '#42a5f5',
      },
      categoryColors: {
        "Main D'Œuvre":    '#66bb6a',
        'Echassier':       '#42a5f5',
        'Poste Fixe':      '#ab47bc',
        'Dépenses Externes':'#ffb74d',
        'Dépenses Internes':'#ef5350',
      },
    },

    effects: {
      glassBlur: 'blur(10px)',
      backgroundGlow: 'radial-gradient(circle at 25% 30%, rgba(102,187,106,0.08) 0%, transparent 45%), radial-gradient(circle at 70% 65%, rgba(129,199,132,0.05) 0%, transparent 45%)',
      sidebarGlass: false,
    },
  },

  /* ─── 🌅 Harvest ───────────────────────────────────────────────────────── */
  'harvest': {
    id: 'harvest',
    name: 'Harvest',
    icon: '🌅',
    description: 'Golden hour warmth, terracotta & cream',

    colors: {
      bg:            '#fff8f0',
      bgSecondary:   '#fff3e0',
      surface:       '#ffffff',
      surfaceAlt:    '#fdf2e9',
      border:        '#f0d9c0',
      borderStrong:  '#e0c0a0',

      text:          '#3e2723',
      textSecondary: '#5d4037',
      textMuted:     '#8d6e63',
      textInverse:   '#fff8f0',

      accent:        '#d84315',
      accentHover:   '#bf360c',
      accentLight:   '#fbe9e7',
      accentSoft:    '#ffccbc',

      success:       '#558b2f',
      warning:       '#f57c00',
      danger:        '#c62828',
      info:          '#1565c0',

      sidebarBg:     '#3e2723',
      sidebarText:   '#d7ccc8',
      sidebarHover:  'rgba(255,255,255,0.08)',
      sidebarActive: '#ff8a65',

      topbarBg:      '#ffffff',
      topbarBorder:  '#f0d9c0',

      cardBorder:    '#f0d9c0',
      cardShadow:    '0 1px 3px rgba(139,90,43,0.1), 0 1px 2px rgba(139,90,43,0.08)',
    },

    shadows: {
      sm:  '0 1px 2px rgba(139,90,43,0.08)',
      md:  '0 4px 6px rgba(139,90,43,0.1), 0 2px 4px rgba(139,90,43,0.06)',
      lg:  '0 10px 15px rgba(139,90,43,0.1), 0 4px 6px rgba(139,90,43,0.05)',
      xl:  '0 20px 25px rgba(139,90,43,0.12), 0 8px 10px rgba(139,90,43,0.06)',
    },

    chart: {
      palette:      ['#d84315','#ff8f00','#7cb342','#c62828','#6a1b9a','#00838f','#ad1457','#ef6c00'],
      grid:         '#f0d9c0',
      axis:         '#a1887f',
      tooltipBg:    '#ffffff',
      tooltipBorder:'#f0d9c0',
      cropColors: {
        'CERISE ALLONGE': '#c62828',
        'CERISE RONDE':   '#ff8f00',
        'TOMATE RONDE':   '#7cb342',
        'POIVRON':        '#1565c0',
      },
      categoryColors: {
        "Main D'Œuvre":    '#7cb342',
        'Echassier':       '#1565c0',
        'Poste Fixe':      '#6a1b9a',
        'Dépenses Externes':'#ff8f00',
        'Dépenses Internes':'#c62828',
      },
    },

    effects: {
      glassBlur: 'blur(12px)',
      backgroundGlow: null,
      sidebarGlass: false,
    },
  },

  /* ─── 🌊 Ocean ─────────────────────────────────────────────────────────── */
  'ocean': {
    id: 'ocean',
    name: 'Ocean',
    icon: '🌊',
    description: 'Cool navy & cyan, professional analytics',

    colors: {
      bg:            '#f0f7ff',
      bgSecondary:   '#e3f2fd',
      surface:       '#ffffff',
      surfaceAlt:    '#e8f4fd',
      border:        '#bbdefb',
      borderStrong:  '#90caf9',

      text:          '#0d2137',
      textSecondary: '#1a3a5c',
      textMuted:     '#546e7a',
      textInverse:   '#f0f7ff',

      accent:        '#0288d1',
      accentHover:   '#0277bd',
      accentLight:   '#e1f5fe',
      accentSoft:    '#b3e5fc',

      success:       '#2e7d32',
      warning:       '#ef6c00',
      danger:        '#c62828',
      info:          '#01579b',

      sidebarBg:     '#0d2137',
      sidebarText:   '#b0bec5',
      sidebarHover:  'rgba(255,255,255,0.08)',
      sidebarActive: '#29b6f6',

      topbarBg:      '#ffffff',
      topbarBorder:  '#bbdefb',

      cardBorder:    '#bbdefb',
      cardShadow:    '0 1px 3px rgba(2,136,209,0.08), 0 1px 2px rgba(2,136,209,0.06)',
    },

    shadows: {
      sm:  '0 1px 2px rgba(2,136,209,0.06)',
      md:  '0 4px 6px rgba(2,136,209,0.08), 0 2px 4px rgba(2,136,209,0.05)',
      lg:  '0 10px 15px rgba(2,136,209,0.1), 0 4px 6px rgba(2,136,209,0.06)',
      xl:  '0 20px 25px rgba(2,136,209,0.12), 0 8px 10px rgba(2,136,209,0.05)',
    },

    chart: {
      palette:      ['#0288d1','#ff8f00','#43a047','#d32f2f','#7b1fa2','#00838f','#c2185b','#ef6c00'],
      grid:         '#bbdefb',
      axis:         '#78909c',
      tooltipBg:    '#ffffff',
      tooltipBorder:'#bbdefb',
      cropColors: {
        'CERISE ALLONGE': '#d32f2f',
        'CERISE RONDE':   '#ff8f00',
        'TOMATE RONDE':   '#43a047',
        'POIVRON':        '#0288d1',
      },
      categoryColors: {
        "Main D'Œuvre":    '#43a047',
        'Echassier':       '#0288d1',
        'Poste Fixe':      '#7b1fa2',
        'Dépenses Externes':'#ff8f00',
        'Dépenses Internes':'#d32f2f',
      },
    },

    effects: {
      glassBlur: 'blur(12px)',
      backgroundGlow: null,
      sidebarGlass: false,
    },
  },
}

// ═══════════════════════════════════════════════════════════════════════════
// Shared constants (not theme-specific)
// ═══════════════════════════════════════════════════════════════════════════

export const SPACING = {
  xs:  '4px',
  sm:  '8px',
  md:  '16px',
  lg:  '24px',
  xl:  '32px',
  '2xl':'48px',
  '3xl':'64px',
}

export const RADII = {
  sm:  '6px',
  md:  '10px',
  lg:  '16px',
  xl:  '24px',
  full:'9999px',
}

export const FONTS = {
  body:     "'Inter', system-ui, -apple-system, sans-serif",
  heading:  "'Outfit', sans-serif",
  mono:     "'JetBrains Mono', 'Fira Code', monospace",
}

export const TYPOGRAPHY = {
  h1: { fontSize: '2rem',   fontWeight: 700, lineHeight: 1.2 },
  h2: { fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.25 },
  h3: { fontSize: '1.1rem',  fontWeight: 600, lineHeight: 1.3 },
  body:  { fontSize: '0.95rem', fontWeight: 400, lineHeight: 1.6 },
  small: { fontSize: '0.8rem',  fontWeight: 400, lineHeight: 1.5 },
  label: { fontSize: '0.8rem',  fontWeight: 600, lineHeight: 1.4, textTransform: 'uppercase', letterSpacing: '1px' },
}

export const TRANSITIONS = {
  fast:   '150ms ease',
  normal: '200ms ease',
  slow:   '300ms cubic-bezier(0.4, 0, 0.2, 1)',
}

export const Z_INDEX = {
  backdrop: 199,
  sidebar:  200,
  topbar:   100,
  chat:     1000,
  fullscreen: 1100,
}

// ═══════════════════════════════════════════════════════════════════════════
// Utility: build CSS custom property map from a theme
// ═══════════════════════════════════════════════════════════════════════════

export function themeToCSSVars(theme) {
  const { colors, shadows, chart, effects } = theme
  return {
    // Colors
    '--bg':               colors.bg,
    '--bg-secondary':     colors.bgSecondary,
    '--surface':          colors.surface,
    '--surface-alt':      colors.surfaceAlt,
    '--border':           colors.border,
    '--border-strong':    colors.borderStrong,

    '--text':             colors.text,
    '--text-secondary':   colors.textSecondary,
    '--text-muted':       colors.textMuted,
    '--text-inverse':     colors.textInverse,

    '--accent':           colors.accent,
    '--accent-hover':     colors.accentHover,
    '--accent-light':     colors.accentLight,
    '--accent-soft':      colors.accentSoft,

    '--success':          colors.success,
    '--warning':          colors.warning,
    '--danger':           colors.danger,
    '--info':             colors.info,

    '--sidebar-bg':       colors.sidebarBg,
    '--sidebar-text':     colors.sidebarText,
    '--sidebar-hover':    colors.sidebarHover,
    '--sidebar-active':   colors.sidebarActive,

    '--topbar-bg':        colors.topbarBg,
    '--topbar-border':    colors.topbarBorder,

    '--card-border':      colors.cardBorder,
    '--card-shadow':      colors.cardShadow,

    // Shadows
    '--shadow-sm':        shadows.sm,
    '--shadow-md':        shadows.md,
    '--shadow-lg':        shadows.lg,
    '--shadow-xl':        shadows.xl,

    // Chart tokens
    '--chart-grid':       chart.grid,
    '--chart-axis':       chart.axis,
    '--chart-tooltip-bg': chart.tooltipBg,
    '--chart-tooltip-border': chart.tooltipBorder,

    // Effects
    '--glass-blur':       effects.glassBlur,
    '--bg-glow':          effects.backgroundGlow || 'none',

    // Spacing, radii, fonts
    '--space-xs':         SPACING.xs,
    '--space-sm':         SPACING.sm,
    '--space-md':         SPACING.md,
    '--space-lg':         SPACING.lg,
    '--space-xl':         SPACING.xl,
    '--space-2xl':        SPACING['2xl'],
    '--space-3xl':        SPACING['3xl'],

    '--radius-sm':        RADII.sm,
    '--radius-md':        RADII.md,
    '--radius-lg':        RADII.lg,
    '--radius-xl':        RADII.xl,
    '--radius-full':      RADII.full,

    '--font-body':        FONTS.body,
    '--font-heading':     FONTS.heading,
    '--font-mono':        FONTS.mono,

    // Legacy aliases (backwards compat with existing CSS)
    '--bg-card':          colors.surface,
    '--bg-primary':       colors.bg,
    '--text-primary':     colors.text,
    '--text-secondary-var': colors.accent,
    '--accent-club':      colors.warning,
    '--accent-cost':      colors.info,
    '--card-shadow-hover': shadows.lg,
  }
}

/**
 * Get the full theme object by ID.
 */
export function getTheme(id) {
  return THEMES[id] || THEMES['agro-light']
}

/**
 * Get chart theme utilities for a given theme.
 * Returns the same shape as the existing src/utils/chartTheme.js
 * so existing components continue to work.
 */
export function getChartTheme(themeId) {
  const theme = getTheme(themeId)
  const ch = theme.chart

  return {
    tooltipProps: {
      contentStyle: {
        background: ch.tooltipBg,
        border: `1px solid ${ch.tooltipBorder}`,
        borderRadius: 8,
        color: theme.colors.text,
        fontSize: 13,
        boxShadow: theme.shadows.md,
      },
      labelStyle: {
        color: theme.colors.text,
        fontWeight: 600,
        marginBottom: 4,
      },
      itemStyle: {
        color: theme.colors.textMuted,
      },
      cursor: { fill: 'rgba(255,255,255,0.04)' },
    },
    axisTick: {
      fill: ch.axis,
      fontSize: 12,
    },
    ACCENT: theme.colors.accent,
    ACCENT_WARNING: theme.colors.warning,
    cropTypeColors: ch.cropColors,
    categoryColors: ch.categoryColors,
    palette: ch.palette,
  }
}
