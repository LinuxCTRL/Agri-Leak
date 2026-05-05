import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { getCostPerTon } from '../services/api'
import { useQnz } from '../context/QnzContext'
import { tooltipProps, axisTick, ACCENT, ACCENT_WARNING, ACCENT_INFO, ACCENT_SUCCESS } from '../utils/chartTheme'
import ChartContainer from '../components/ChartContainer'

// ── Icons ────────────────────────────────────────────────────────────────
function IconTonnage() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> }
function IconCost() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> }
function IconEfficiency() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> }
function IconFarms() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> }

function CostPerTon() {
  const [data, setData] = useState({ by_farm: [], by_variety: [] })
  const [loading, setLoading] = useState(true)
  const [showAllFarms, setShowAllFarms] = useState(false)
  const [showAllVarieties, setShowAllVarieties] = useState(false)
  const navigate = useNavigate()
  const { selectedQnz } = useQnz()

  useEffect(() => {
    setLoading(true)
    getCostPerTon({ qnz: selectedQnz })
      .then(res => setData(res.data))
      .catch(err => console.error('Error:', err))
      .finally(() => setLoading(false))
  }, [selectedQnz])

  if (loading) return <div className="loading">Loading Cost Analytics...</div>

  // Farm data sorted by cost_per_ton ascending (cheapest first)
  const farmData = [...(data.by_farm || [])].sort((a, b) => a.cost_per_ton - b.cost_per_ton)

  // Aggregate variety data
  const rawVariety = data.by_variety || []
  const varietyAggMap = {}
  rawVariety.forEach(d => {
    const key = d.variety
    if (!varietyAggMap[key]) {
      varietyAggMap[key] = { variety: d.variety, weightedSum: 0, totalTonnage: 0, farmCount: new Set() }
    }
    varietyAggMap[key].weightedSum += d.cost_per_ton * (d.tonnage || 0)
    varietyAggMap[key].totalTonnage += (d.tonnage || 0)
    varietyAggMap[key].farmCount.add(d.Domaine)
  })
  const varietyAgg = Object.values(varietyAggMap)
    .map(v => ({
      variety: v.variety,
      cost_per_ton: v.totalTonnage > 0 ? v.weightedSum / v.totalTonnage : 0,
      total_tonnage: v.totalTonnage,
      farm_count: v.farmCount.size
    }))
    .sort((a, b) => a.cost_per_ton - b.cost_per_ton)

  // Farm metrics
  const totalTonnage = farmData.reduce((s, d) => s + (d.total_tonnage || 0), 0)
  const totalCost = farmData.reduce((s, d) => s + (d.total_cost || 0), 0)
  const avgCostPerTon = totalTonnage > 0 ? totalCost / totalTonnage : 0
  const bestFarm = farmData.length > 0 ? farmData[0] : null
  const worstFarm = farmData.length > 0 ? farmData[farmData.length - 1] : null

  const avgVarietyCost = varietyAgg.length > 0
    ? varietyAgg.reduce((s, v) => s + v.cost_per_ton, 0) / varietyAgg.length
    : 0

  const CHART_LIMIT = 10

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
      {value.toFixed(1)}
    </text>
  )

  // ── 6.9 Farm chart data ───────────────────────────────────────────────────
  const farmChartData = (showAllFarms ? farmData : farmData.slice(0, CHART_LIMIT))
    .map((d) => ({
      name: d.Domaine,
      value: d.cost_per_ton,
      aboveAvg: d.cost_per_ton > avgCostPerTon,
    }))

  // ── 6.10 Variety chart data ───────────────────────────────────────────────
  const varietyChartData = (showAllVarieties ? varietyAgg : varietyAgg.slice(0, CHART_LIMIT))
    .map((d) => ({
      name: d.variety,
      value: d.cost_per_ton,
      aboveAvg: d.cost_per_ton > avgVarietyCost,
    }))

  return (
    <div className="page">
      <div className="page-header">
        <h2>📈 Cost Efficiency Analysis</h2>
        <p className="subtitle">Ranking farms and varieties by cost per ton produced</p>
      </div>

      {/* Summary Metrics */}
      <div className="metrics">
        <div className="metric" style={{ borderLeft: '4px solid var(--accent-info)' }}>
          <div className="metric-header"><IconTonnage /> <span className="label">Total Volume</span></div>
          <span className="value">{formatNum(totalTonnage)} kg</span>
        </div>
        <div className="metric" style={{ borderLeft: '4px solid var(--accent-warning)' }}>
          <div className="metric-header"><IconCost /> <span className="label">Total Cost</span></div>
          <span className="value">{formatNum(totalCost)} MAD</span>
        </div>
        <div className="metric" style={{ borderLeft: '4px solid var(--accent)' }}>
          <div className="metric-header"><IconEfficiency /> <span className="label">Avg Cost/Ton</span></div>
          <span className="value">{avgCostPerTon.toFixed(2)} MAD</span>
        </div>
        <div className="metric" style={{ borderLeft: '4px solid var(--accent-success)' }}>
          <div className="metric-header"><IconFarms /> <span className="label">Farms</span></div>
          <span className="value">{farmData.length} Analyzed</span>
        </div>
      </div>

      {/* Best / Worst Highlight Cards */}
      {bestFarm && worstFarm && (
        <div className="charts-grid" style={{ marginBottom: '30px' }}>
          <div className="chart" style={{ borderLeft: '4px solid var(--accent-success)' }}>
            <h3 style={{ color: 'var(--accent-success)', marginTop: 0 }}>🏆 Efficiency Leader</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>{bestFarm.Domaine}</div>
              <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Cost/Ton</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--accent-success)' }}>{bestFarm.cost_per_ton.toFixed(2)} MAD</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Output</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: '600' }}>{formatNum(bestFarm.total_tonnage)} kg</div>
                </div>
              </div>
            </div>
          </div>
          <div className="chart" style={{ borderLeft: '4px solid var(--accent-warning)' }}>
            <h3 style={{ color: 'var(--accent-warning)', marginTop: 0 }}>⚠️ Optimization Required</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>{worstFarm.Domaine}</div>
              <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Cost/Ton</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--accent-warning)' }}>{worstFarm.cost_per_ton.toFixed(2)} MAD</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Output</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: '600' }}>{formatNum(worstFarm.total_tonnage)} kg</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="charts-grid">
        <ChartContainer title="Cost per Ton by Farm (MAD)" data={farmChartData} filename="cost_per_ton_farm">
          <ResponsiveContainer width="100%" height={Math.max(300, farmChartData.length * 40)}>
            <BarChart data={farmChartData} layout="vertical" margin={{ top: 10, right: 60, left: 20, bottom: 10 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={140} tick={axisTick} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipProps} formatter={(v) => [v.toFixed(2) + ' MAD', 'Cost/Ton']} />
              <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={20} label={renderCustomBarLabel} onClick={(e) => navigate(`/domain/${encodeURIComponent(e.name)}`)}>
                {farmChartData.map((entry, i) => <Cell key={i} fill={entry.aboveAvg ? ACCENT_WARNING : ACCENT_SUCCESS} style={{ cursor: 'pointer' }} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {farmData.length > CHART_LIMIT && (
            <button className="expand-btn" onClick={() => setShowAllFarms(!showAllFarms)}>
              {showAllFarms ? 'Show Less' : `Show All ${farmData.length} Farms`}
            </button>
          )}
        </ChartContainer>

        <ChartContainer title="Cost per Ton by Variety (MAD)" data={varietyChartData} filename="cost_per_ton_variety">
          <ResponsiveContainer width="100%" height={Math.max(300, varietyChartData.length * 40)}>
            <BarChart data={varietyChartData} layout="vertical" margin={{ top: 10, right: 60, left: 20, bottom: 10 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={140} tick={axisTick} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipProps} formatter={(v) => [v.toFixed(2) + ' MAD', 'Cost/Ton']} />
              <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={20} label={renderCustomBarLabel}>
                {varietyChartData.map((entry, i) => <Cell key={i} fill={entry.aboveAvg ? ACCENT_WARNING : ACCENT_INFO} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {varietyAgg.length > CHART_LIMIT && (
            <button className="expand-btn" onClick={() => setShowAllVarieties(!showAllVarieties)}>
              {showAllVarieties ? 'Show Less' : `Show All ${varietyAgg.length} Varieties`}
            </button>
          )}
        </ChartContainer>
      </div>

      {/* Tables */}
      <div style={{ marginTop: '50px' }}>
        <h3>Detailed Cost Analytics Breakdown</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Farm</th>
              <th>Tonnage (kg)</th>
              <th>Total Cost (MAD)</th>
              <th>Superficie (ha)</th>
              <th>Cost/Ton (MAD)</th>
              <th>Cost/Ha (MAD)</th>
            </tr>
          </thead>
          <tbody>
            {farmData.map((d, i) => (
              <tr key={i} className="clickable-row" onClick={() => navigate(`/domain/${encodeURIComponent(d.Domaine)}`)}>
                <td><span className="farm-link">{d.Domaine}</span></td>
                <td style={{ fontWeight: '600' }}>{d.total_tonnage?.toLocaleString()}</td>
                <td>{d.total_cost?.toLocaleString()}</td>
                <td>{d.superficie?.toFixed(2)}</td>
                <td style={{ color: d.cost_per_ton > avgCostPerTon ? 'var(--accent-warning)' : 'var(--accent-success)', fontWeight: 'bold' }}>
                  {d.cost_per_ton?.toFixed(2)}
                </td>
                <td>{d.cost_per_ha?.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CostPerTon
