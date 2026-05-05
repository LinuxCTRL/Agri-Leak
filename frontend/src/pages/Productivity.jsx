import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { getProductivity } from '../services/api'
import { useQnz } from '../context/QnzContext'
import { tooltipProps, axisTick, ACCENT, ACCENT_WARNING, ACCENT_INFO, ACCENT_SUCCESS } from '../utils/chartTheme'
import ChartContainer from '../components/ChartContainer'

// ── Icons ────────────────────────────────────────────────────────────────
function IconYield() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> }
function IconEfficiency() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> }
function IconFarms() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> }
function IconArea() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg> }

function Productivity() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAllFarms, setShowAllFarms] = useState(false)
  const [showAllVarieties, setShowAllVarieties] = useState(false)
  const navigate = useNavigate()
  const { selectedQnz } = useQnz()

  useEffect(() => {
    setLoading(true)
    getProductivity({ qnz: selectedQnz })
      .then(res => setData(res.data))
      .catch(err => console.error('Error:', err))
      .finally(() => setLoading(false))
  }, [selectedQnz])

  if (loading) return <div className="loading">Loading Productivity Data...</div>
  if (!data) return <div className="page"><h2>No data available</h2></div>

  const farmData = data.by_farm || []
  const typeData = data.by_type || []
  const varietyData = data.by_variety || []

  const farmsWithCost = farmData.filter(f => f.total_cost != null)
  const avgYield = farmData.length > 0
    ? farmData.reduce((s, f) => s + f.yield_per_ha, 0) / farmData.length
    : 0
  const bestYieldFarm = farmData.length > 0 ? farmData[0] : null
  const worstYieldFarm = farmData.length > 0 ? farmData[farmData.length - 1] : null

  const avgEfficiency = farmsWithCost.length > 0
    ? farmsWithCost.reduce((s, f) => s + (f.efficiency || 0), 0) / farmsWithCost.length
    : 0

  const CHART_LIMIT = 10
  const farmChartData = (showAllFarms ? farmData : farmData.slice(0, CHART_LIMIT))
    .map((d) => ({ name: d.ferme, value: d.yield_per_ha, aboveAvg: d.yield_per_ha > avgYield }))

  const varietyChartData = (showAllVarieties ? varietyData : varietyData.slice(0, CHART_LIMIT))
    .map((d) => ({ name: d.variety, value: d.yield_per_ha, type: d.type }))

  const formatNum = (n) => {
    if (n == null) return '—'
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return n.toFixed(0)
  }

  const renderCustomBarLabel = ({ x, y, width, height, value }) => (
    <text 
      x={x + width + 10} 
      y={y + height / 2} 
      fill="var(--text-muted)" 
      dominantBaseline="middle"
      style={{ fontSize: '0.75rem', fontWeight: '600' }}
    >
      {formatNum(value)}
    </text>
  )

  return (
    <div className="page">
      <div className="page-header">
        <h2>🌾 Yield & Productivity</h2>
        <p className="subtitle">Analyzing harvest density and operational efficiency</p>
      </div>

      {/* Summary Metrics */}
      <div className="metrics">
        <div className="metric" style={{ borderLeft: '4px solid var(--accent)' }}>
          <div className="metric-header"><IconYield /> <span className="label">Avg Yield</span></div>
          <span className="value">{formatNum(avgYield)} kg/ha</span>
        </div>
        <div className="metric" style={{ borderLeft: '4px solid var(--accent-success)' }}>
          <div className="metric-header"><IconArea /> <span className="label">Best Yield</span></div>
          <span className="value">{bestYieldFarm ? formatNum(bestYieldFarm.yield_per_ha) + ' kg' : '—'}</span>
        </div>
        <div className="metric" style={{ borderLeft: '4px solid var(--accent-info)' }}>
          <div className="metric-header"><IconEfficiency /> <span className="label">Efficiency</span></div>
          <span className="value">{avgEfficiency.toFixed(2)} kg/MAD</span>
        </div>
        <div className="metric" style={{ borderLeft: '4px solid var(--accent-warning)' }}>
          <div className="metric-header"><IconFarms /> <span className="label">Farms</span></div>
          <span className="value">{farmData.length} Analyzed</span>
        </div>
      </div>

      {/* Highlight Cards */}
      {bestYieldFarm && worstYieldFarm && (
        <div className="charts-grid" style={{ marginBottom: '30px' }}>
          <div className="chart" style={{ borderLeft: '4px solid var(--accent-success)' }}>
            <h3 style={{ color: 'var(--accent-success)', marginTop: 0 }}>🏆 Yield Leader</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>{bestYieldFarm.ferme}</div>
              <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Yield/Ha</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--accent-success)' }}>{formatNum(bestYieldFarm.yield_per_ha)} kg</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Total Output</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: '600' }}>{formatNum(bestYieldFarm.tonnage)} kg</div>
                </div>
              </div>
            </div>
          </div>
          <div className="chart" style={{ borderLeft: '4px solid var(--accent-warning)' }}>
            <h3 style={{ color: 'var(--accent-warning)', marginTop: 0 }}>⚠️ Optimization Opportunity</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>{worstYieldFarm.ferme}</div>
              <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Yield/Ha</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--accent-warning)' }}>{formatNum(worstYieldFarm.yield_per_ha)} kg</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Total Output</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: '600' }}>{formatNum(worstYieldFarm.tonnage)} kg</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Crop Type Cards */}
      <h3>Yield by Crop Type</h3>
      <div className="metrics" style={{ gridTemplateColumns: `repeat(${typeData.length}, 1fr)`, marginBottom: '30px' }}>
        {typeData.map((t, i) => (
          <div key={i} className="metric" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <span className="label" style={{ color: 'var(--accent)' }}>{t.type}</span>
            <span className="value" style={{ fontSize: '1.4rem' }}>{formatNum(t.yield_per_ha)} kg/ha</span>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {formatNum(t.tonnage)} kg · {t.farms} farms
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <ChartContainer title="Yield per Hectare by Farm (kg/ha)" data={farmChartData} filename="yield_per_ha_farm">
          <ResponsiveContainer width="100%" height={Math.max(300, farmChartData.length * 40)}>
            <BarChart data={farmChartData} layout="vertical" margin={{ top: 10, right: 60, left: 20, bottom: 10 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={140} tick={axisTick} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipProps} formatter={(v) => [formatNum(v) + ' kg/ha', 'Yield/Ha']} />
              <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={20} label={renderCustomBarLabel} onClick={(e) => navigate(`/domain/${encodeURIComponent(e.name)}`)}>
                {farmChartData.map((entry, i) => <Cell key={i} fill={entry.aboveAvg ? ACCENT : ACCENT_WARNING} fillOpacity={1 - (i * 0.03)} style={{ cursor: 'pointer' }} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {farmData.length > CHART_LIMIT && (
            <button className="expand-btn" onClick={() => setShowAllFarms(!showAllFarms)}>
              {showAllFarms ? 'Show Less' : `Show All ${farmData.length} Farms`}
            </button>
          )}
        </ChartContainer>

        <ChartContainer title="Yield per Hectare by Variety (kg/ha)" data={varietyChartData} filename="yield_per_ha_variety">
          <ResponsiveContainer width="100%" height={Math.max(300, varietyChartData.length * 40)}>
            <BarChart data={varietyChartData} layout="vertical" margin={{ top: 10, right: 60, left: 20, bottom: 10 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={140} tick={axisTick} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipProps} formatter={(v) => [formatNum(v) + ' kg/ha', 'Yield/Ha']} />
              <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={20} label={renderCustomBarLabel}>
                {varietyChartData.map((_, i) => <Cell key={i} fill={ACCENT_INFO} fillOpacity={1 - (i * 0.05)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {varietyData.length > CHART_LIMIT && (
            <button className="expand-btn" onClick={() => setShowAllVarieties(!showAllVarieties)}>
              {showAllVarieties ? 'Show Less' : `Show All ${varietyData.length} Varieties`}
            </button>
          )}
        </ChartContainer>
      </div>

      {/* Full Table */}
      <div style={{ marginTop: '50px' }}>
        <h3>Complete Farm Productivity Table</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Farm</th>
              <th>Group</th>
              <th>Tonnage (kg)</th>
              <th>Surface (ha)</th>
              <th>Yield/Ha (kg)</th>
              <th>Cost/Ton (MAD)</th>
              <th>Efficiency (kg/MAD)</th>
              <th>Varieties</th>
            </tr>
          </thead>
          <tbody>
            {farmData.map((d, i) => (
              <tr key={i} className="clickable-row" onClick={() => navigate(`/domain/${encodeURIComponent(d.ferme)}`)}>
                <td><span className="farm-link">{d.ferme}</span></td>
                <td>{d.group}</td>
                <td style={{ fontWeight: '600' }}>{d.tonnage?.toLocaleString()}</td>
                <td>{d.superficie?.toFixed(2)}</td>
                <td style={{ color: d.yield_per_ha > avgYield ? 'var(--accent)' : 'var(--accent-warning)', fontWeight: 'bold' }}>
                  {d.yield_per_ha?.toFixed(0)}
                </td>
                <td>{d.cost_per_ton != null ? d.cost_per_ton.toFixed(2) : '—'}</td>
                <td>{d.efficiency != null ? d.efficiency.toFixed(3) : '—'}</td>
                <td>{d.varieties}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Productivity
