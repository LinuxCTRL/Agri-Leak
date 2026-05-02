import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { getCostPerTon } from '../services/api'
import { useQnz } from '../context/QnzContext'
import { tooltipProps, axisTick, ACCENT, ACCENT_WARNING } from '../utils/chartTheme'

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

  const formatNum = (n) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return n.toFixed(0)
  }

  return (
    <div className="page">
      <h2>📈 Cost per Ton Analysis</h2>

      {/* Summary Metrics */}
      <div className="metrics">
        <div className="metric">
          <span className="label">Total Tonnage</span>
          <span className="value">{formatNum(totalTonnage)} kg</span>
        </div>
        <div className="metric">
          <span className="label">Total Cost</span>
          <span className="value">{formatNum(totalCost)} MAD</span>
        </div>
        <div className="metric">
          <span className="label">Weighted Avg Cost/Ton</span>
          <span className="value">{formatNum(avgCostPerTon)} MAD</span>
        </div>
        <div className="metric">
          <span className="label">Farms Analyzed</span>
          <span className="value">{farmData.length}</span>
        </div>
      </div>

      {/* Best / Worst Highlight Cards */}
      {bestFarm && worstFarm && (
        <div className="charts-grid" style={{ marginBottom: '30px' }}>
          <div className="chart" style={{ borderLeft: '4px solid var(--accent)' }}>
            <h3 style={{ color: 'var(--accent)' }}>🏆 Most Efficient Farm</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', fontFamily: 'Outfit, sans-serif' }}>{bestFarm.Domaine}</div>
              <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Cost/Ton</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--accent)', fontFamily: 'Outfit' }}>{bestFarm.cost_per_ton.toFixed(2)} MAD</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Tonnage</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: '600', fontFamily: 'Outfit' }}>{formatNum(bestFarm.total_tonnage)} kg</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Total Cost</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: '600', fontFamily: 'Outfit' }}>{formatNum(bestFarm.total_cost)} MAD</div>
                </div>
              </div>
            </div>
          </div>
          <div className="chart" style={{ borderLeft: '4px solid var(--accent-warning)' }}>
            <h3 style={{ color: 'var(--accent-warning)' }}>⚠️ Least Efficient Farm</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', fontFamily: 'Outfit, sans-serif' }}>{worstFarm.Domaine}</div>
              <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Cost/Ton</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--accent-warning)', fontFamily: 'Outfit' }}>{worstFarm.cost_per_ton.toFixed(2)} MAD</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Tonnage</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: '600', fontFamily: 'Outfit' }}>{formatNum(worstFarm.total_tonnage)} kg</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Total Cost</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: '600', fontFamily: 'Outfit' }}>{formatNum(worstFarm.total_cost)} MAD</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* 6.9 Cost/Ton by Farm */}
        <div className="chart">
          <h3>
            Cost/Ton by Farm (MAD)
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
                  formatter={(v) => [v.toFixed(2) + ' MAD', 'Cost/Ton']}
                />
                <Bar
                  dataKey="value"
                  radius={[0, 6, 6, 0]}
                  style={{ cursor: 'pointer' }}
                  onClick={(entry) => navigate(`/domain/${encodeURIComponent(entry.name)}`)}
                >
                  {farmChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.aboveAvg ? ACCENT_WARNING : ACCENT} />
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
                cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', fontFamily: 'inherit',
                transition: 'all 0.2s'
              }}
            >
              {showAllFarms ? 'Show Less' : `Show All ${farmData.length} Farms`}
            </button>
          )}
        </div>

        {/* 6.10 Cost/Ton by Variety */}
        <div className="chart">
          <h3>
            Cost/Ton by Variety (MAD)
            {!showAllVarieties && varietyAgg.length > CHART_LIMIT ? ` — Top ${CHART_LIMIT}` : ''}
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
                  formatter={(v) => [v.toFixed(2) + ' MAD', 'Cost/Ton']}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {varietyChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.aboveAvg ? ACCENT_WARNING : ACCENT} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          {varietyAgg.length > CHART_LIMIT && (
            <button
              onClick={() => setShowAllVarieties(!showAllVarieties)}
              style={{
                marginTop: '16px', background: 'none', border: '1px solid var(--border)',
                color: 'var(--accent)', padding: '8px 16px', borderRadius: '8px',
                cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', fontFamily: 'inherit',
                transition: 'all 0.2s'
              }}
            >
              {showAllVarieties ? 'Show Less' : `Show All ${varietyAgg.length} Varieties`}
            </button>
          )}
        </div>
      </div>

      {/* Farm Details Table */}
      <div style={{ marginTop: '50px' }}>
        <h3>Farm Analytics Breakdown</h3>
        <div style={{ overflowX: 'auto' }}>
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
                  <td>{d.total_tonnage?.toLocaleString()}</td>
                  <td>{d.total_cost?.toLocaleString()}</td>
                  <td>{d.superficie?.toFixed(2)}</td>
                  <td style={{ color: d.cost_per_ton > avgCostPerTon ? 'var(--accent-warning)' : 'var(--accent)', fontWeight: 'bold' }}>
                    {d.cost_per_ton?.toFixed(2)}
                  </td>
                  <td>{d.cost_per_ha?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Variety Summary Table */}
      <div style={{ marginTop: '50px' }}>
        <h3>Variety Cost Summary (Aggregated)</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Variety</th>
                <th>Total Tonnage (kg)</th>
                <th>Weighted Avg Cost/Ton (MAD)</th>
                <th>Farms Growing</th>
              </tr>
            </thead>
            <tbody>
              {varietyAgg.map((d, i) => (
                <tr key={i}>
                  <td><strong>{d.variety}</strong></td>
                  <td>{d.total_tonnage?.toLocaleString()}</td>
                  <td style={{ color: d.cost_per_ton > avgVarietyCost ? 'var(--accent-warning)' : 'var(--accent)', fontWeight: 'bold' }}>
                    {d.cost_per_ton?.toFixed(2)}
                  </td>
                  <td>{d.farm_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default CostPerTon
