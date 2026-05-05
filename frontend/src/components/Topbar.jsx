import GlobalSearch from './GlobalSearch'
import { useQnz } from '../context/QnzContext'

function Topbar({ sidebarWidth }) {
  const { selectedQnz, setSelectedQnz, availableQnz } = useQnz()

  return (
    <div className="topbar" style={{ left: sidebarWidth }}>
      <GlobalSearch />
      
      <div className="topbar-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
        {availableQnz.length > 0 && (
          <div className="topbar-qnz" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Period</span>
            <select
              value={selectedQnz === 0 ? 0 : (selectedQnz || '')}
              onChange={(e) => setSelectedQnz(Number(e.target.value))}
              style={{
                padding: '6px 32px 6px 12px',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text)',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                outline: 'none',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 8px center',
                minWidth: '100px'
              }}
            >
              <option value={0}>All Quinzaines</option>
              {availableQnz.map((q) => (
                <option key={q} value={q}>
                  QNZ {q}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  )
}

export default Topbar
