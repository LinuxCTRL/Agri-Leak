import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { getProductivity } from '../services/api'
import { useQnz } from '../context/QnzContext'
import { tooltipProps, axisTick, ACCENT, ACCENT_WARNING } from '../utils/chartTheme'

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
    ? farmsWithCost.reduce((s, f) => s + f.efficiency, 0) / farmsWithCost.length
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

  return (
    <div className="page">
      <h2>🌾 Productivity &amp; Yield Analysis</h2>

      {/* Summary Metrics */}
      <div className="metrics">
        <div className="metric">
          <span className="label">Avg Yield / Ha</span>
          <span className="value">{formatNum(avgYield)} kg</span>
        </div>
        <div className="metric">
          <span className="label">Best Yield / Ha</span>
          <span className="value best">{bestYieldFarm ? formatNum(bestYieldFarm.yield_per_ha) + ' kg' : '—'}</span>
        </div>
        <div className="metric">
          <span className="label">Avg Efficiency</span>
          <span className="value">{avgEfficiency.toFixed(2)} kg/MAD</span>
        </div>
        <div className="metric">
          <span className="label">Farms Analyzed</span>
          <span className="value">{farmData.length}</span>
        </div>
      </div>

      {/* Highlight Cards */}
      {bestYieldFarm && worstYieldFarm && (
        <div className="charts-grid" style={{ marginBottom: '30px' }}>
          <div className="chart" style={{ borderLeft: '4px solid var(--accent)' }}>
            <h3 style={{ color: 'var(--accent)' }}>🏆 Highest Yield Farm</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', fontFamily: 'var(--font-heading)' }}>{bestYieldFarm.ferme}</div>
              <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Yield/Ha</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--accent)', fontFamily: 'var(--font-heading)' }}>{formatNum(bestYieldFarm.yield_per_ha)} kg</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Total Tonnage</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: '600', fontFamily: 'var(--font-heading)' }}>{formatNum(bestYieldFarm.tonnage)} kg</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Superficie</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: '600', fontFamily: 'var(--font-heading)' }}>{bestYieldFarm.superficie?.toFixed(1)} ha</div>
                </div>
              </div>
            </div>
          </div>
          <div className="chart" style={{ borderLeft: '4px solid var(--accent-warning)' }}>
            <h3 style={{ color: 'var(--accent-warning)' }}>⚠️ Lowest Yield Farm</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', fontFamily: 'var(--font-heading)' }}>{worstYieldFarm.ferme}</div>
              <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Yield/Ha</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--accent-warning)', fontFamily: 'var(--font-heading)' }}>{formatNum(worstYieldFarm.yield_per_ha)} kg</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Total Tonnage</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: '600', fontFamily: 'var(--font-heading)' }}>{formatNum(worstYieldFarm.tonnage)} kg</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Superficie</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: '600', fontFamily: 'var(--font-heading)' }}>{worstYieldFarm.superficie?.toFixed(1)} ha</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Crop Type Cards */}
      <h3>Yield by Crop Type</h3>
      <div className="metrics" style={{ gridTemplateColumns: `repeat(${typeData.length}, 1fr)` }}>
        {typeData.map((t, i) => (
          <div key={i} className="metric">
            <span className="label">{t.type}</span>
            <span className="value">{formatNum(t.yield_per_ha)} kg/ha</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {formatNum(t.tonnage)} kg total · {t.farms} farms
            </span>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* 6.4 Yield per Hectare by Farm — color-coded cells */}
        <div className="chart">
          <h3>
            Yield per Hectare by Farm (kg/ha)
            {!showAllFarms && farmData.length > CHART_LIMIT ? ` — Top ${CHART_LIMIT}` : ''}
          </h3>
          {farmChartData.length > 0 && (
            <ResponsiveContainer width="100%" height={Math.max(200, farmChartData.length * 36)}>
              <BarChart
                data={farmChartData}
                layout="vertical"
                margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={140}
                  tick={axisTick}
                />
                <Tooltip
                  {...tooltipProps}
                  formatter={(v) => [formatNum(v) + ' kg/ha', 'Yield/Ha']}
                />
                <Bar
                  dataKey="value"
                  radius={[0, 6, 6, 0]}
                  style={{ cursor: 'pointer' }}
                  onClick={(entry) => navigate(`/domain/${encodeURIComponent(entry.name)}`)}
                >
                  {farmChartData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.aboveAvg ? ACCENT : ACCENT_WARNING}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          {farmData.length > CHART_LIMIT && (
            <button
              onClick={() => setShowAllFarms(!showAllFarms)}
              style={{
                marginTop: '16px', background: 'none', border: '1px solid var(--border)',
                color: 'var(--accent)', padding: '8px 16px', borderRadius: '8px',
                cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', fontFamily: 'inherit'
              }}
            >
              {showAllFarms ? 'Show Less' : `Show All ${farmData.length} Farms`}
            </button>
          )}
        </div>

        {/* 6.5 Yield per Hectare by Variety */}
        <div className="chart">
          <h3>
            Yield per Hectare by Variety (kg/ha)
            {!showAllVarieties && varietyData.length > CHART_LIMIT ? ` — Top ${CHART_LIMIT}` : ''}
          </h3>
          {varietyChartData.length > 0 && (
            <ResponsiveContainer width="100%" height={Math.max(200, varietyChartData.length * 36)}>
              <BarChart
                data={varietyChartData}
                layout="vertical"
                margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={140}
                  tick={axisTick}
                />
                <Tooltip
                  {...tooltipProps}
                  formatter={(v) => [formatNum(v) + ' kg/ha', 'Yield/Ha']}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {varietyChartData.map((_, i) => (
                    <Cell key={i} fill={ACCENT} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          {varietyData.length > CHART_LIMIT && (
            <button
              onClick={() => setShowAllVarieties(!showAllVarieties)}
              style={{
                marginTop: '16px', background: 'none', border: '1px solid var(--border)',
                color: 'var(--accent)', padding: '8px 16px', borderRadius: '8px',
                cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', fontFamily: 'inherit'
              }}
            >
              {showAllVarieties ? 'Show Less' : `Show All ${varietyData.length} Varieties`}
            </button>
          )}
        </div>
      </div>

      {/* Full Table */}
      <div style={{ marginTop: '50px' }}>
        <h3>Complete Farm Productivity Table</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Farm</th>
                <th>Group</th>
                <th>Tonnage (kg)</th>
                <th>Superficie (ha)</th>
                <th>Yield/Ha (kg)</th>
                <th>Cost/Ton (MAD)</th>
                <th>Efficiency (kg/MAD)</th>
                <th>Varieties</th>
                <th>Harvest Days</th>
              </tr>
            </thead>
            <tbody>
              {farmData.map((d, i) => (
                <tr key={i} className="clickable-row" onClick={() => navigate(`/domain/${encodeURIComponent(d.ferme)}`)}>
                  <td><span className="farm-link">{d.ferme}</span></td>
                  <td>{d.group}</td>
                  <td>{d.tonnage?.toLocaleString()}</td>
                  <td>{d.superficie?.toFixed(2)}</td>
                  <td style={{ color: d.yield_per_ha > avgYield ? 'var(--accent)' : 'var(--accent-warning)', fontWeight: 'bold' }}>
                    {d.yield_per_ha?.toFixed(0)}
                  </td>
                  <td>{d.cost_per_ton != null ? d.cost_per_ton.toFixed(2) : '—'}</td>
                  <td>{d.efficiency != null ? d.efficiency.toFixed(4) : '—'}</td>
                  <td>{d.varieties}</td>
                  <td>{d.harvest_days}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Productivity
