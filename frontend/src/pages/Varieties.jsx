import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { getVarieties } from '../services/api'
import { useQnz } from '../context/QnzContext'
import { tooltipProps, axisTick, cropTypeColors, ACCENT } from '../utils/chartTheme'

const TYPES = ['ALL', 'TOMATE RONDE', 'CERISE ALLONGE', 'CERISE RONDE', 'POIVRON']

function SortIcon({ col, sortCol, sortDir }) {
  if (sortCol !== col) return <span style={{ opacity: 0.3, marginLeft: 4 }}>↕</span>
  return <span style={{ marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
}

function Varieties() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [sortCol, setSortCol] = useState('tonnage')
  const [sortDir, setSortDir] = useState('desc')
  const navigate = useNavigate()
  const { selectedQnz } = useQnz()

  useEffect(() => {
    setLoading(true)
    getVarieties({ qnz: selectedQnz })
      .then(res => setData(res.data))
      .catch(err => console.error('Error:', err))
      .finally(() => setLoading(false))
  }, [selectedQnz])

  const filtered = useMemo(() =>
    typeFilter === 'ALL' ? data : data.filter(d => d.type === typeFilter),
    [data, typeFilter]
  )

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortCol] ?? 0, bv = b[sortCol] ?? 0
      return sortDir === 'asc' ? av - bv : bv - av
    })
  }, [filtered, sortCol, sortDir])

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  const formatNum = (n) => {
    if (n == null) return '—'
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return n.toFixed(0)
  }

  // Per-type summary metrics
  const typeStats = useMemo(() =>
    TYPES.slice(1).map(t => {
      const rows = data.filter(d => d.type === t)
      return { type: t, count: rows.length, tonnage: rows.reduce((s, r) => s + (r.tonnage || 0), 0) }
    }),
    [data]
  )
  const totalTonnage = typeStats.reduce((s, t) => s + t.tonnage, 0)

  const top10Tonnage = filtered.slice(0, 10).map(d => ({ name: d.variety, value: d.tonnage, color: cropTypeColors[d.type] || ACCENT }))
  const top10Yield = [...filtered].sort((a, b) => (b.yield_per_ha || 0) - (a.yield_per_ha || 0)).slice(0, 10)
    .map(d => ({ name: d.variety, value: Math.round(d.yield_per_ha || 0), color: cropTypeColors[d.type] || ACCENT }))

  if (loading) return <div className="loading">Loading Varieties...</div>
  if (!data.length) return <div className="page"><h2>No data available</h2></div>

  return (
    <div className="page">
      <h2>🍅 Varieties Registry</h2>

      {/* Type summary metrics */}
      <div className="metrics">
        <div className="metric">
          <span className="label">Total Varieties</span>
          <span className="value">{data.length}</span>
        </div>
        {typeStats.map(t => (
          <div
            key={t.type}
            className="metric"
            style={{
              borderLeft: `4px solid ${cropTypeColors[t.type] || ACCENT}`,
              cursor: 'pointer',
              opacity: typeFilter !== 'ALL' && typeFilter !== t.type ? 0.45 : 1,
              transition: 'opacity 150ms'
            }}
            onClick={() => setTypeFilter(f => f === t.type ? 'ALL' : t.type)}
          >
            <span className="label">{t.type}</span>
            <span className="value" style={{ fontSize: '1.4rem' }}>{t.count} vars</span>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {totalTonnage ? ((t.tonnage / totalTonnage) * 100).toFixed(1) : 0}% of tonnage
            </div>
          </div>
        ))}
      </div>

      {/* Type filter pills */}
      <div style={{ display: 'flex', gap: 8, margin: '24px 0 8px', flexWrap: 'wrap' }}>
        {TYPES.map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            style={{
              padding: '5px 14px',
              borderRadius: 20,
              border: `1px solid ${t === 'ALL' ? 'var(--border)' : (cropTypeColors[t] || ACCENT)}`,
              background: typeFilter === t
                ? (t === 'ALL' ? 'var(--accent)' : cropTypeColors[t] || ACCENT) + (t === 'ALL' ? '' : '30')
                : 'transparent',
              color: typeFilter === t ? (t === 'ALL' ? '#fff' : cropTypeColors[t] || ACCENT) : 'var(--text-muted)',
              fontWeight: typeFilter === t ? 600 : 400,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 150ms'
            }}
          >
            {t === 'ALL' ? `All (${data.length})` : `${t} (${data.filter(d => d.type === t).length})`}
          </button>
        ))}
      </div>

      {/* Charts side by side */}
      <div className="charts-grid" style={{ marginBottom: 40 }}>
        <div className="chart">
          <h3>Top 10 by Tonnage</h3>
          <ResponsiveContainer width="100%" height={Math.max(200, top10Tonnage.length * 40)}>
            <BarChart data={top10Tonnage} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={150} tick={axisTick} />
              <Tooltip {...tooltipProps} formatter={(v) => [formatNum(v) + ' kg', 'Tonnage']} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {top10Tonnage.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart">
          <h3>Top 10 by Yield/Ha</h3>
          <ResponsiveContainer width="100%" height={Math.max(200, top10Yield.length * 40)}>
            <BarChart data={top10Yield} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={150} tick={axisTick} />
              <Tooltip {...tooltipProps} formatter={(v) => [v.toLocaleString() + ' kg/ha', 'Yield/Ha']} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {top10Yield.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sortable table */}
      <h3>All Varieties {typeFilter !== 'ALL' && `— ${typeFilter}`} <span style={{ fontWeight: 400, fontSize: '0.9rem', color: 'var(--text-muted)' }}>({sorted.length})</span></h3>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('variety')}>
                Variety <SortIcon col="variety" sortCol={sortCol} sortDir={sortDir} />
              </th>
              <th>Type</th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('tonnage')}>
                Tonnage (kg) <SortIcon col="tonnage" sortCol={sortCol} sortDir={sortDir} />
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('superficie')}>
                Superficie (ha) <SortIcon col="superficie" sortCol={sortCol} sortDir={sortDir} />
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('yield_per_ha')}>
                Yield/Ha (kg) <SortIcon col="yield_per_ha" sortCol={sortCol} sortDir={sortDir} />
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('farm_count')}>
                Farms <SortIcon col="farm_count" sortCol={sortCol} sortDir={sortDir} />
              </th>
              <th>Domains</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((d, i) => (
              <tr key={i}>
                <td><strong>{d.variety}</strong></td>
                <td>
                  <span style={{
                    display: 'inline-block', padding: '3px 10px', borderRadius: 12,
                    fontSize: '0.78rem', fontWeight: 600,
                    background: (cropTypeColors[d.type] || ACCENT) + '25',
                    color: cropTypeColors[d.type] || ACCENT
                  }}>{d.type}</span>
                </td>
                <td>{d.tonnage?.toLocaleString()}</td>
                <td>{d.superficie?.toFixed(2)}</td>
                <td style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{d.yield_per_ha?.toFixed(0)}</td>
                <td>{d.farm_count}</td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {d.farms.map((farm, j) => (
                      <span
                        key={j}
                        onClick={() => navigate(`/domain/${encodeURIComponent(farm)}`)}
                        style={{
                          fontSize: '0.78rem', padding: '2px 8px',
                          background: 'var(--bg-card)', border: '1px solid var(--border)',
                          borderRadius: 4, cursor: 'pointer', color: 'var(--accent)'
                        }}
                      >{farm}</span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Varieties
