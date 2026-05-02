import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from 'recharts'
import { getCostBreakdown, getCostTrend } from '../services/api'
import { useQnz } from '../context/QnzContext'
import { tooltipProps, axisTick, categoryColors, ACCENT, ACCENT_WARNING } from '../utils/chartTheme'

function CostBreakdown() {
  const [data, setData] = useState(null)
  const [trend, setTrend] = useState([])
  const [loading, setLoading] = useState(true)
  const { selectedQnz } = useQnz()
  const [cumulative, setCumulative] = useState(false)
  const [showAllFarms, setShowAllFarms] = useState(false)

  useEffect(() => {
    setLoading(true)
    const qnzParam = cumulative ? null : selectedQnz
    Promise.all([getCostBreakdown(qnzParam), getCostTrend()])
      .then(([breakdownRes, trendRes]) => {
        setData(breakdownRes.data)
        setTrend(trendRes.data)
      })
      .catch(err => console.error('Error:', err))
      .finally(() => setLoading(false))
  }, [selectedQnz, cumulative])

  if (loading) return <div className="loading">Loading Cost Breakdown...</div>
  if (!data) return <div className="page"><h2>No data available</h2></div>

  const summary = data.summary || []
  const total = data.total || 0
  const farmData = data.by_farm || []
  const CHART_LIMIT = 10
  const farmChartData = showAllFarms ? farmData : farmData.slice(0, CHART_LIMIT)

  const formatNum = (n) => {
    if (n == null) return '—'
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return n.toFixed(0)
  }

  // ── 6.6 "Where Does the Money Go?" chart data ─────────────────────────────
  const summaryChartData = summary.map((cat) => ({
    name: cat.category,
    value: cat.amount,
    pct: cat.percentage,
    color: categoryColors[cat.category] || ACCENT,
  }))

  // ── 6.7 Cost Evolution by Quinzaine chart data ────────────────────────────
  const trendChartData = trend.map((t) => ({
    name: `QNZ ${t.qnz}`,
    value: t.total_cost,
    isSelected: t.qnz === selectedQnz && !cumulative,
  }))

  // ── 6.8 Per-farm stacked bar chart data ───────────────────────────────────
  const stackedFarmData = farmChartData.map((f) => ({
    name: f.Domaine,
    main_doeuvre: f.main_doeuvre || 0,
    echassier: f.echassier || 0,
    poste_fixe: f.poste_fixe || 0,
    depenses_externe: f.depenses_externe || 0,
    depenses_interne: f.depenses_interne || 0,
  }))

  return (
    <div className="page">
      <h2>💸 Cost Structure Analysis</h2>

      {/* Cumulative Toggle */}
      <div className="filter" style={{ gap: '20px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setCumulative(!cumulative)}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            border: cumulative ? '2px solid var(--accent)' : '2px solid var(--border)',
            background: cumulative ? 'var(--accent)' : 'var(--bg-card)',
            color: cumulative ? 'white' : 'var(--text-primary)',
            fontFamily: 'inherit',
            fontWeight: '600',
            fontSize: '0.95rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
        >
          {cumulative ? '✅ Cumulative (QNZ 1→22)' : '📊 Cumulative'}
        </button>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          {cumulative ? 'Showing total across all 22 quinzaines' : `Showing QNZ ${selectedQnz} only`}
        </span>
      </div>

      {/* Total Cost Metric */}
      <div className="metrics">
        <div className="metric">
          <span className="label">{cumulative ? 'Cumulative Cost' : `QNZ ${selectedQnz} Cost`}</span>
          <span className="value">{formatNum(total)} MAD</span>
        </div>
        <div className="metric">
          <span className="label">Farms</span>
          <span className="value">{farmData.length}</span>
        </div>
        <div className="metric">
          <span className="label">Largest Category</span>
          <span className="value">{summary.length > 0 ? summary[0].category : '—'}</span>
        </div>
        <div className="metric">
          <span className="label">Largest %</span>
          <span className="value">{summary.length > 0 ? summary[0].percentage.toFixed(1) + '%' : '—'}</span>
        </div>
      </div>

      <div className="charts-grid">
        {/* 6.6 Where Does the Money Go? */}
        <div className="chart">
          <h3>Where Does the Money Go?</h3>
          {summaryChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(200, summaryChartData.length * 48)}>
              <BarChart
                data={summaryChartData}
                layout="vertical"
                margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={150}
                  tick={axisTick}
                />
                <Tooltip
                  {...tooltipProps}
                  formatter={(v, _name, props) => [
                    `${formatNum(v)} MAD (${props.payload.pct?.toFixed(1)}%)`,
                    'Amount',
                  ]}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {summaryChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </div>

        {/* 6.7 Cost Evolution by Quinzaine — selected QNZ highlighted */}
        <div className="chart">
          <h3>Cost Evolution by Quinzaine</h3>
          {trendChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(200, trendChartData.length * 36)}>
              <BarChart
                data={trendChartData}
                layout="vertical"
                margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={70}
                  tick={axisTick}
                />
                <Tooltip
                  {...tooltipProps}
                  formatter={(v) => [formatNum(v) + ' MAD', 'Total Cost']}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {trendChartData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.isSelected ? ACCENT_WARNING : ACCENT}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </div>
      </div>

      {/* 6.8 Per-Farm Stacked Breakdown */}
      <div style={{ marginTop: '50px' }}>
        <h3>Cost per Farm {!showAllFarms && farmData.length > CHART_LIMIT ? `— Top ${CHART_LIMIT}` : ''}</h3>
        <div className="chart" style={{ marginTop: '20px' }}>
          {stackedFarmData.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(200, stackedFarmData.length * 36)}>
              <BarChart
                data={stackedFarmData}
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
                  formatter={(v, name) => {
                    const labels = {
                      main_doeuvre: "Main D'œuvre",
                      echassier: 'Echassier',
                      poste_fixe: 'Poste Fixe',
                      depenses_externe: 'Dép. Externes',
                      depenses_interne: 'Dép. Internes',
                    }
                    return [formatNum(v) + ' MAD', labels[name] || name]
                  }}
                />
                <Legend
                  formatter={(value) => {
                    const labels = {
                      main_doeuvre: "Main D'œuvre",
                      echassier: 'Echassier',
                      poste_fixe: 'Poste Fixe',
                      depenses_externe: 'Dép. Externes',
                      depenses_interne: 'Dép. Internes',
                    }
                    return <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{labels[value] || value}</span>
                  }}
                />
                <Bar dataKey="main_doeuvre" stackId="a" fill={categoryColors["Main D'œuvre"]} radius={[0, 0, 0, 0]} />
                <Bar dataKey="echassier" stackId="a" fill={categoryColors['Echassier']} />
                <Bar dataKey="poste_fixe" stackId="a" fill={categoryColors['Poste Fixe']} />
                <Bar dataKey="depenses_externe" stackId="a" fill={categoryColors['Dépenses Externes']} />
                <Bar dataKey="depenses_interne" stackId="a" fill={categoryColors['Dépenses Internes']} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : null}

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
      </div>

      {/* Full Table */}
      <div style={{ marginTop: '50px' }}>
        <h3>Detailed Farm Cost Table {cumulative ? '(Cumulative)' : `(QNZ ${selectedQnz})`}</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Farm</th>
                <th>Total Cost (MAD)</th>
                <th>Main D&apos;œuvre</th>
                <th>Echassier</th>
                <th>Poste Fixe</th>
                <th>Dép. Externes</th>
                <th>Dép. Internes</th>
                <th>Superficie (ha)</th>
                <th>Cost/Ha (MAD)</th>
              </tr>
            </thead>
            <tbody>
              {farmData.map((f, i) => (
                <tr key={i}>
                  <td><strong>{f.Domaine}</strong></td>
                  <td style={{ fontWeight: 'bold' }}>{f.total_cost?.toLocaleString()}</td>
                  <td>{f.main_doeuvre?.toLocaleString()}</td>
                  <td>{f.echassier?.toLocaleString()}</td>
                  <td>{f.poste_fixe?.toLocaleString()}</td>
                  <td>{f.depenses_externe?.toLocaleString()}</td>
                  <td>{f.depenses_interne?.toLocaleString()}</td>
                  <td>{f.superficie?.toFixed(2)}</td>
                  <td style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{f.cost_per_ha?.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default CostBreakdown
