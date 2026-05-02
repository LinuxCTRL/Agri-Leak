import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFarms } from '../services/api'
import { useQnz } from '../context/QnzContext'

function Domains() {
  const [farms, setFarms] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [groupFilter, setGroupFilter] = useState('ALL')
  const [clubFilter, setClubFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('tonnage')
  const navigate = useNavigate()
  const { selectedQnz } = useQnz()

  useEffect(() => {
    setLoading(true)
    getFarms({ qnz: selectedQnz })
      .then(res => setFarms(res.data))
      .catch(err => console.error('Error:', err))
      .finally(() => setLoading(false))
  }, [selectedQnz])

  const groups = useMemo(() => ['ALL', ...new Set(farms.map(f => f.group_name).filter(Boolean))], [farms])
  const clubs = useMemo(() => ['ALL', ...new Set(farms.map(f => f.club).filter(Boolean))], [farms])

  const filtered = useMemo(() => {
    return farms.filter(f => {
      const matchesSearch = !searchTerm || f.ferme.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesGroup = groupFilter === 'ALL' || f.group_name === groupFilter
      const matchesClub = clubFilter === 'ALL' || f.club === clubFilter
      return matchesSearch && matchesGroup && matchesClub
    })
  }, [farms, searchTerm, groupFilter, clubFilter])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortBy] ?? 0, bv = b[sortBy] ?? 0
      return bv - av // desc
    })
  }, [filtered, sortBy])

  const formatNum = (n) => {
    if (n == null) return '—'
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return n.toFixed(0)
  }

  if (loading) return <div className="loading">Loading Domains...</div>

  return (
    <div className="page">
      <h2>🏡 Domains Registry</h2>

      <div className="metrics">
        <div className="metric">
          <span className="label">Total Domains</span>
          <span className="value">{farms.length}</span>
        </div>
        <div className="metric">
          <span className="label">Groups</span>
          <span className="value">{groups.length - 1}</span>
        </div>
        <div className="metric">
          <span className="label">Clubs</span>
          <span className="value">{clubs.length - 1}</span>
        </div>
        <div className="metric">
          <span className="label">Total Tonnage</span>
          <span className="value">{formatNum(farms.reduce((s, f) => s + (f.tonnage || 0), 0))} kg</span>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="🔍 Search domains..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '10px 14px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface)',
            color: 'var(--text)',
            fontSize: '0.9rem',
            minWidth: 220,
            outline: 'none',
          }}
        />
        
        <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} style={{
          padding: '10px 32px 10px 12px',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--surface)',
          color: 'var(--text)',
          fontSize: '0.9rem',
          cursor: 'pointer',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 10px center',
        }}>
          {groups.map(g => <option key={g} value={g}>{g === 'ALL' ? 'All Groups' : g}</option>)}
        </select>
        
        <select value={clubFilter} onChange={(e) => setClubFilter(e.target.value)} style={{
          padding: '10px 32px 10px 12px',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--surface)',
          color: 'var(--text)',
          fontSize: '0.9rem',
          cursor: 'pointer',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 10px center',
        }}>
          {clubs.map(c => <option key={c} value={c}>{c === 'ALL' ? 'All Clubs' : c}</option>)}
        </select>
        
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{
          padding: '10px 32px 10px 12px',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--surface)',
          color: 'var(--text)',
          fontSize: '0.9rem',
          cursor: 'pointer',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 10px center',
        }}>
          <option value="tonnage">Tonnage</option>
          <option value="superficie">Surface</option>
          <option value="varieties">Varieties</option>
          <option value="harvest_days">Harvest Days</option>
        </select>

        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {sorted.length} domain{sorted.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Domain cards grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 20,
        marginTop: 24
      }}>
        {sorted.map((farm, i) => (
          <div
            key={i}
            onClick={() => navigate(`/domain/${encodeURIComponent(farm.ferme)}`)}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: 20,
              cursor: 'pointer',
              transition: 'all 200ms ease',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = 'var(--accent)'
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = 'var(--shadow-md)'
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = 'var(--border)'
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = 'none'
            }}
          >
            {/* Header */}
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text)' }}>{farm.ferme}</h3>
              <div style={{ display: 'flex', gap: 8, marginTop: 6, fontSize: '0.8rem' }}>
                <span style={{
                  background: 'var(--accent)',
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontWeight: 600
                }}>{farm.code}</span>
                <span style={{
                  background: 'var(--bg)',
                  color: 'var(--text-muted)',
                  padding: '2px 8px',
                  borderRadius: 12,
                  border: '1px solid var(--border)'
                }}>{farm.group_name}</span>
                <span style={{
                  background: 'var(--bg)',
                  color: 'var(--text-muted)',
                  padding: '2px 8px',
                  borderRadius: 12,
                  border: '1px solid var(--border)'
                }}>{farm.club}</span>
              </div>
            </div>

            {/* Key metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tonnage</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent)' }}>{formatNum(farm.tonnage)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Surface</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)' }}>{farm.superficie?.toFixed(1)} ha</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Yield/Ha</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)' }}>
                  {farm.superficie > 0 ? Math.round(farm.tonnage / farm.superficie).toLocaleString() : '—'} kg
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Varieties</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)' }}>{farm.varieties}</div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              {farm.harvest_days} harvest days
            </div>

            {/* Click indicator */}
            <div style={{
              position: 'absolute',
              top: 16,
              right: 16,
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              opacity: 0.6
            }}>→</div>
          </div>
        ))}
      </div>

      {sorted.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          No domains match your filters
        </div>
      )}
    </div>
  )
}

export default Domains