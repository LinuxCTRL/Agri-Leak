import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { getDomainDetails } from '../services/api'
import { useQnz } from '../context/QnzContext'
import { tooltipProps, axisTick, cropTypeColors, categoryColors, ACCENT } from '../utils/chartTheme'

function Domain() {
  const { ferme } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { selectedQnz } = useQnz()

  useEffect(() => {
    loadDomainDetails()
  }, [ferme, selectedQnz])

  const loadDomainDetails = async () => {
    try {
      const res = await getDomainDetails(decodeURIComponent(ferme), { qnz: selectedQnz })
      setData(res.data)
    } catch (err) {
      console.error('Error:', err)
      setError('Domain not found')
    } finally {
      setLoading(false)
    }
  }

  const formatNum = (n) => {
    if (n == null) return '—'
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return n.toFixed(0)
  }

  const formatDate = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (loading) return <div className="loading">Loading Farm Details...</div>
  if (error) return <div className="page"><h2>{error}</h2></div>

  const { details, summary, by_variety, by_serre, daily_harvest, cost } = data

  // ── 6.13 Cost Breakdown chart data ────────────────────────────────────────
  const costBreakdownData = cost
    ? [
        { name: "Main D'œuvre", value: cost.main_doeuvre, color: categoryColors["Main D'œuvre"] },
        { name: 'Echassier', value: cost.echassier, color: categoryColors['Echassier'] },
        { name: 'Poste Fixe', value: cost.poste_fixe, color: categoryColors['Poste Fixe'] },
        { name: 'Dép. Externes', value: cost.depenses_externe, color: categoryColors['Dépenses Externes'] },
        { name: 'Dép. Internes', value: cost.depenses_interne, color: categoryColors['Dépenses Internes'] },
      ]
        .filter((c) => c.value > 0)
        .sort((a, b) => b.value - a.value)
    : []

  // ── 6.12 Daily Harvest chart data ─────────────────────────────────────────
  const dailyChartData = (daily_harvest ?? []).map((d) => ({
    date: formatDate(d.date),
    value: d.tonnage,
  }))

  return (
    <div className="page">
      <button className="back-btn" onClick={() => navigate(-1)}>Back</button>

      <h2>🏡 {details?.ferme}</h2>

      {/* Farm Info */}
      <div className="info-grid">
        <div className="info-item">
          <span className="info-label">Code</span>
          <span className="info-value">{details?.code}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Group</span>
          <span className="info-value">{details?.group}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Club</span>
          <span className="info-value">{details?.club}</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics">
        <div className="metric">
          <span className="label">Total Tonnage</span>
          <span className="value">{summary?.total_tonnage?.toLocaleString() || 0} kg</span>
        </div>
        <div className="metric">
          <span className="label">Superficie</span>
          <span className="value">{summary?.total_superficie?.toFixed(2) || 0} ha</span>
        </div>
        <div className="metric">
          <span className="label">Yield / Ha</span>
          <span className="value best">{summary?.yield_per_ha ? formatNum(summary.yield_per_ha) + ' kg' : '—'}</span>
        </div>
        <div className="metric">
          <span className="label">Harvest Days</span>
          <span className="value">{summary?.harvest_days || 0}</span>
        </div>
        <div className="metric">
          <span className="label">Varieties</span>
          <span className="value">{summary?.varieties_count || 0}</span>
        </div>
        <div className="metric">
          <span className="label">Serres</span>
          <span className="value">{summary?.serres_count || 0}</span>
        </div>
      </div>

      {/* Cost Information */}
      {cost && (
        <>
          <h3>💰 Cost Information</h3>
          <div className="charts-grid" style={{ marginTop: '20px' }}>
            <div className="chart" style={{ borderLeft: '4px solid var(--accent)' }}>
              <h3 style={{ marginTop: '0' }}>Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '15px' }}>
                <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Total Cost</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: '700', fontFamily: 'var(--font-heading)' }}>{cost.total_cost?.toLocaleString()} MAD</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Cost/Ha</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: '700', fontFamily: 'var(--font-heading)' }}>{cost.cost_per_ha?.toFixed(0)} MAD</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Cost/Ton</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--accent)', fontFamily: 'var(--font-heading)' }}>{cost.cost_per_ton?.toFixed(2)} MAD</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 6.13 Cost Breakdown — Recharts horizontal BarChart */}
            <div className="chart">
              <h3 style={{ marginTop: '0' }}>Cost Breakdown</h3>
              {costBreakdownData.length > 0 ? (
                <ResponsiveContainer width="100%" height={Math.max(160, costBreakdownData.length * 44)}>
                  <BarChart
                    data={costBreakdownData}
                    layout="vertical"
                    margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      tick={axisTick}
                    />
                    <Tooltip
                      {...tooltipProps}
                      formatter={(v) => [formatNum(v) + ' MAD', 'Amount']}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {costBreakdownData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          </div>
        </>
      )}

      {/* By Variety */}
      <h3>🌾 Production by Variety</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Variety</th>
            <th>Type</th>
            <th>Tonnage (kg)</th>
            <th>Superficie (ha)</th>
            <th>Yield/Ha (kg)</th>
            <th>Plant Date</th>
            <th>Harvest Days</th>
          </tr>
        </thead>
        <tbody>
          {by_variety?.map((v, i) => (
            <tr key={i}>
              <td><strong>{v.variety}</strong></td>
              <td>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  background: (cropTypeColors[v.type] || ACCENT) + '20',
                  color: cropTypeColors[v.type] || ACCENT
                }}>
                  {v.type}
                </span>
              </td>
              <td>{v.tonnage?.toLocaleString()}</td>
              <td>{v.superficie?.toFixed(2)}</td>
              <td style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{v.yield_per_ha?.toFixed(0)}</td>
              <td>{formatDate(v.plant_date)}</td>
              <td>{v.harvest_days}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* By Serre */}
      <h3>🏚️ Production by Serre</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Serre</th>
            <th>Variety</th>
            <th>Type</th>
            <th>Tonnage (kg)</th>
            <th>Superficie (ha)</th>
          </tr>
        </thead>
        <tbody>
          {by_serre?.map((s, i) => (
            <tr key={i}>
              <td><strong>{s.serre}</strong></td>
              <td>{s.variety}</td>
              <td>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  background: (cropTypeColors[s.type] || ACCENT) + '20',
                  color: cropTypeColors[s.type] || ACCENT
                }}>
                  {s.type}
                </span>
              </td>
              <td>{s.tonnage?.toLocaleString()}</td>
              <td>{s.superficie?.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 6.12 Daily Harvest Pattern — Recharts vertical BarChart */}
      <h3>📈 Daily Harvest Pattern</h3>
      {dailyChartData.length > 0 ? (
        <div className="chart" style={{ marginTop: '20px' }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={dailyChartData}
              margin={{ top: 16, right: 16, left: 8, bottom: 60 }}
            >
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                tick={axisTick}
                tickFormatter={(v) => formatNum(v)}
              />
              <Tooltip
                {...tooltipProps}
                formatter={(v) => [formatNum(v) + ' kg', 'Tonnage']}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {dailyChartData.map((_, i) => (
                  <Cell key={i} fill={ACCENT} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </div>
  )
}

export default Domain
