import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { getVarieties } from '../services/api'
import { useQnz } from '../context/QnzContext'
import { tooltipProps, axisTick, cropTypeColors, ACCENT } from '../utils/chartTheme'
import ChartContainer from '../components/ChartContainer'

// ── Icons ────────────────────────────────────────────────────────────────
function IconVariety() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> }
function IconType() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> }

const TYPES = ['ALL', 'TOMATE RONDE', 'CERISE ALLONGE', 'CERISE RONDE', 'POIVRON']

function SortIcon({ col, sortCol, sortDir }) {
  if (sortCol !== col) return <span style={{ opacity: 0.2, marginLeft: 4 }}>↕</span>
  return <span style={{ marginLeft: 4, color: 'var(--accent)' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
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
      <div className="page-header">
        <h2>🍅 Varieties Registry</h2>
        <p className="subtitle">Catalogue of crop varieties and their performance benchmarks</p>
      </div>

      {/* Summary Metrics */}
      <div className="metrics">
        <div className="metric" style={{ borderLeft: '4px solid var(--accent)' }}>
          <div className="metric-header"><IconVariety /> <span className="label">Total Varieties</span></div>
          <span className="value">{data.length} Registered</span>
        </div>
        {typeStats.map(t => (
          <div
            key={t.type}
            className="metric"
            style={{
              borderLeft: `4px solid ${cropTypeColors[t.type] || ACCENT}`,
              cursor: 'pointer',
              opacity: typeFilter !== 'ALL' && typeFilter !== t.type ? 0.4 : 1,
              transition: 'all 200ms'
            }}
            onClick={() => setTypeFilter(f => f === t.type ? 'ALL' : t.type)}
          >
            <div className="metric-header"><IconType /> <span className="label">{t.type}</span></div>
            <span className="value" style={{ fontSize: '1.4rem' }}>{t.count} Varieties</span>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
              {totalTonnage ? ((t.tonnage / totalTonnage) * 100).toFixed(1) : 0}% share of total volume
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: 10, margin: '30px 0 10px', flexWrap: 'wrap' }}>
        {TYPES.map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            style={{
              padding: '6px 16px', borderRadius: '30px',
              border: `1px solid ${t === 'ALL' ? 'var(--border)' : (cropTypeColors[t] || ACCENT)}`,
              background: typeFilter === t
                ? (t === 'ALL' ? 'var(--accent)' : cropTypeColors[t] || ACCENT) + (t === 'ALL' ? '' : '30')
                : 'transparent',
              color: typeFilter === t ? (t === 'ALL' ? '#fff' : cropTypeColors[t] || ACCENT) : 'var(--text-muted)',
              fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 150ms'
            }}
          >
            {t === 'ALL' ? `All Varieties (${data.length})` : `${t} (${data.filter(d => d.type === t).length})`}
          </button>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="charts-grid" style={{ marginBottom: 40 }}>
        <ChartContainer title="Production by Variety (kg)" data={top10Tonnage} filename="variety_production">
          <ResponsiveContainer width="100%" height={Math.max(260, top10Tonnage.length * 40)}>
            <BarChart data={top10Tonnage} layout="vertical" margin={{ top: 10, right: 60, left: 10, bottom: 10 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={140} tick={{...axisTick, fontSize: 11}} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipProps} formatter={(v) => [v.toLocaleString() + ' kg', 'Tonnage']} />
              <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={20}>
                {top10Tonnage.map((e, i) => <Cell key={i} fill={e.color} fillOpacity={0.9} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Average Yield by Variety (kg/ha)" data={top10Yield} filename="variety_yield">
          <ResponsiveContainer width="100%" height={Math.max(260, top10Yield.length * 40)}>
            <BarChart data={top10Yield} layout="vertical" margin={{ top: 10, right: 60, left: 10, bottom: 10 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={140} tick={{...axisTick, fontSize: 11}} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipProps} formatter={(v) => [v.toLocaleString() + ' kg/ha', 'Yield']} />
              <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={20}>
                {top10Yield.map((e, i) => <Cell key={i} fill={e.color} fillOpacity={0.9} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Data Table */}
      <h3>Complete Varieties Catalogue {typeFilter !== 'ALL' && `— ${typeFilter}`}</h3>
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
            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('yield_per_ha')}>
              Yield/Ha (kg) <SortIcon col="yield_per_ha" sortCol={sortCol} sortDir={sortDir} />
            </th>
            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('farm_count')}>
              Farms <SortIcon col="farm_count" sortCol={sortCol} sortDir={sortDir} />
            </th>
            <th>Active Domains</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((d, i) => (
            <tr key={i}>
              <td><strong>{d.variety}</strong></td>
              <td>
                <span style={{
                  display: 'inline-block', padding: '4px 12px', borderRadius: '12px',
                  fontSize: '0.75rem', fontWeight: '700',
                  background: (cropTypeColors[d.type] || ACCENT) + '20',
                  color: cropTypeColors[d.type] || ACCENT,
                  border: `1px solid ${(cropTypeColors[d.type] || ACCENT)}40`
                }}>{d.type}</span>
              </td>
              <td style={{ fontWeight: '600' }}>{d.tonnage?.toLocaleString()}</td>
              <td style={{ fontWeight: '700', color: 'var(--accent)' }}>{d.yield_per_ha?.toFixed(0)}</td>
              <td>{d.farm_count}</td>
              <td>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {d.farms.map((farm, j) => (
                    <span
                      key={j}
                      onClick={() => navigate(`/domain/${encodeURIComponent(farm)}`)}
                      style={{
                        fontSize: '0.7rem', padding: '3px 10px', fontWeight: '600',
                        background: 'var(--bg)', border: '1px solid var(--border)',
                        borderRadius: '6px', cursor: 'pointer', color: 'var(--text-muted)',
                        transition: 'all 0.2s'
                      }}
                      className="variety-farm-tag"
                    >{farm}</span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Varieties
