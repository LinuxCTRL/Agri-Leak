import { useState, useEffect, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQnz } from '../context/QnzContext'
import { useTheme } from '../theme/ThemeContext'

// ─── Icons (inline SVG for zero-dependency) ───────────────────────────────
function IconDashboard() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  )
}

function IconDomains() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9,22 9,12 15,12 15,22" />
    </svg>
  )
}

function IconProductivity() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}

function IconVarieties() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12" />
      <path d="M12 6v6l4 2" />
    </svg>
  )
}

function IconSegments() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function IconCostTon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}

function IconCostBreakdown() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}

function IconSearch() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function IconSun() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function IconMoon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function IconChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function IconMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

// ─── NavItem sub-component ─────────────────────────────────────────────────
function NavItem({ to, icon, label, collapsed }) {
  const location = useLocation()
  const isActive =
    to === '/'
      ? location.pathname === '/'
      : location.pathname === to || location.pathname.startsWith(to + '/')

  return (
    <Link
      to={to}
      className={`sidebar-nav-item${isActive ? ' active' : ''}`}
      title={collapsed ? label : undefined}
    >
      <span className="sidebar-nav-icon">{icon}</span>
      {!collapsed && <span className="sidebar-nav-label">{label}</span>}
    </Link>
  )
}

// ─── Sidebar component ─────────────────────────────────────────────────────
function Sidebar({ onWidthChange }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const { selectedQnz, setSelectedQnz, availableQnz } = useQnz()
  const { themeId, theme, setThemeId, availableThemes } = useTheme()

  // Mobile detection via matchMedia
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')

    const handleChange = (e) => {
      setIsMobile(e.matches)
      if (e.matches) {
        setCollapsed(true)
        setMobileOpen(false)
      }
    }

    // Set initial state
    setIsMobile(mq.matches)
    if (mq.matches) {
      setCollapsed(true)
    }

    mq.addEventListener('change', handleChange)
    return () => mq.removeEventListener('change', handleChange)
  }, [])

  // Notify parent of width changes
  useEffect(() => {
    if (onWidthChange) {
      if (isMobile) {
        onWidthChange(0)
      } else {
        onWidthChange(collapsed ? 64 : 240)
      }
    }
  }, [collapsed, isMobile, onWidthChange])

  const toggleCollapse = useCallback(() => {
    if (isMobile) {
      setMobileOpen((prev) => !prev)
    } else {
      setCollapsed((prev) => !prev)
    }
  }, [isMobile])

  const cycleTheme = useCallback(() => {
    const currentIdx = availableThemes.findIndex(t => t.id === themeId)
    const nextIdx = (currentIdx + 1) % availableThemes.length
    setThemeId(availableThemes[nextIdx].id)
  }, [themeId, availableThemes, setThemeId])

  const sidebarWidth = collapsed ? 64 : 240

  const navItems = [
    { to: '/',               icon: <IconDashboard />,     label: 'Dashboard' },
    { to: '/productivity',   icon: <IconProductivity />,  label: 'Productivity' },
    { to: '/varieties',      icon: <IconVarieties />,     label: 'Varieties' },
    { to: '/domains',        icon: <IconDomains />,       label: 'Domains' },
    { to: '/segments',       icon: <IconSegments />,      label: 'Segments' },
    { to: '/cost-per-ton',   icon: <IconCostTon />,       label: 'Cost/Ton' },
    { to: '/cost-breakdown', icon: <IconCostBreakdown />, label: 'Cost Breakdown' },
    { to: '/comparison',     icon: <IconProductivity />,  label: 'QNZ Comparison' },
  ]

  // On mobile, sidebar is an overlay triggered by mobileOpen
  const sidebarClasses = [
    'sidebar',
    collapsed && !isMobile ? 'sidebar--collapsed' : '',
    isMobile ? 'sidebar--mobile' : '',
    isMobile && mobileOpen ? 'sidebar--mobile-open' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      {/* Mobile hamburger button (outside sidebar) */}
      {isMobile && (
        <button
          className="sidebar-mobile-toggle"
          onClick={toggleCollapse}
          aria-label="Toggle navigation"
        >
          <IconMenu />
        </button>
      )}

      {/* Mobile overlay backdrop */}
      {isMobile && mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={sidebarClasses}
        style={!isMobile ? { width: sidebarWidth } : undefined}
      >
        {/* ── Header: logo + collapse button ── */}
        <div className="sidebar-header">
          {!collapsed && (
            <span className="sidebar-logo">🌱 Agri Data Lake</span>
          )}
          {!isMobile && (
            <button
              className="sidebar-collapse-btn"
              onClick={toggleCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <span
                className="sidebar-collapse-icon"
                style={{ transform: collapsed ? 'rotate(180deg)' : 'none' }}
              >
                <IconChevronLeft />
              </span>
            </button>
          )}
          {isMobile && (
            <button
              className="sidebar-collapse-btn"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
            >
              <IconChevronLeft />
            </button>
          )}
        </div>

        {/* ── Navigation links ── */}
        <nav className="sidebar-nav">
          <div className="nav-section">
            {navItems.map((item) => (
              <NavItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                collapsed={collapsed && !isMobile}
              />
            ))}
          </div>
        </nav>

        {/* ── QNZ selector ── */}
        {availableQnz.length > 0 && (
          <div className="sidebar-qnz">
            {!collapsed || isMobile ? (
              <>
                <label className="sidebar-qnz-label">QNZ</label>
                <select
                  className="sidebar-qnz-select"
                  value={selectedQnz || ''}
                  onChange={(e) => setSelectedQnz(Number(e.target.value))}
                >
                  {availableQnz.map((q) => (
                    <option key={q} value={q}>
                      QNZ {q}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <div className="sidebar-qnz-collapsed" title={`QNZ ${selectedQnz}`}>
                <span className="sidebar-qnz-badge">{selectedQnz}</span>
              </div>
            )}
          </div>
        )}

        {/* ── Footer: theme selector ── */}
        <div className="sidebar-footer">
          {(!collapsed || isMobile) ? (
            <div className="sidebar-theme-picker">
              <span className="sidebar-theme-label">Theme</span>
              <div className="sidebar-theme-options">
                {availableThemes.map((t) => (
                  <button
                    key={t.id}
                    className={`sidebar-theme-option${t.id === themeId ? ' sidebar-theme-option--active' : ''}`}
                    onClick={() => setThemeId(t.id)}
                    title={t.description}
                    aria-label={t.name}
                    aria-pressed={t.id === themeId}
                  >
                    <span className="sidebar-theme-option-icon">{t.icon}</span>
                    <span className="sidebar-theme-option-name">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button
              className="sidebar-theme-toggle"
              onClick={cycleTheme}
              title={`Current: ${theme.name} — Click to cycle`}
              aria-label={`Current theme: ${theme.name}. Click to change`}
            >
              <span className="sidebar-theme-icon">{theme.icon}</span>
            </button>
          )}
        </div>
      </aside>
    </>
  )
}

export default Sidebar
