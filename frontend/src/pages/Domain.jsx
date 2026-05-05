import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { getDomainDetails } from '../services/api'
import { useQnz } from '../context/QnzContext'
import { tooltipProps, axisTick, cropTypeColors, categoryColors, ACCENT, ACCENT_INFO } from '../utils/chartTheme'
import ChartContainer from '../components/ChartContainer'

// ── Icons ────────────────────────────────────────────────────────────────
function IconCode() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> }
function IconGroup() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> }
function IconClub() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> }
function IconTonnage() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> }
function IconArea() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg> }

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
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
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
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <div style={{ flex: 1 }}>
          <h2 style={{ marginBottom: '4px' }}>🏡 {details?.ferme}</h2>
          <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><IconCode /> {details?.code}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><IconGroup /> {details?.group}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><IconClub /> {details?.club}</span>
          </div>
        </div>
        <button className="report-btn" onClick={() => navigate(`/report/${encodeURIComponent(ferme)}`)}>Report</button>
      </div>

      {/* Key Metrics */}
      <div className="metrics">
        <div className="metric" style={{ borderLeft: '4px solid var(--accent)' }}>
          <div className="metric-header"><IconTonnage /> <span className="label">Total Tonnage</span></div>
          <span className="value">{summary?.total_tonnage?.toLocaleString() || 0} kg</span>
        </div>
        <div className="metric" style={{ borderLeft: '4px solid var(--accent-info)' }}>
          <div className="metric-header"><IconArea /> <span className="label">Superficie</span></div>
          <span className="value">{summary?.total_superficie?.toFixed(2) || 0} ha</span>
        </div>
        <div className="metric">
          <span className="label">Yield / Ha</span>
          <span className="value best">{summary?.yield_per_ha ? formatNum(summary.yield_per_ha) + ' kg' : '—'}</span>
        </div>
        <div className="metric">
          <span className="label">Activity</span>
          <span className="value">{summary?.harvest_days || 0} Days · {summary?.varieties_count || 0} Var.</span>
        </div>
      </div>

      {/* Cost Information */}
      {cost && (
        <div className="charts-grid" style={{ marginTop: '20px' }}>
          <ChartContainer title="Cost Performance" filename={`${details?.ferme}_costs`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Total Investment</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text)', marginTop: '4px' }}>{cost.total_cost?.toLocaleString()} MAD</div>
                </div>
                <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Cost per Ton</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent)', marginTop: '4px' }}>{cost.cost_per_ton?.toFixed(2)} MAD</div>
                </div>
              </div>
              <div style={{ padding: '0 10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cost Efficiency (MAD/Ha)</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{cost.cost_per_ha?.toLocaleString()}</span>
                </div>
                <div style={{ height: '8px', background: 'var(--bg)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--accent)', width: '65%', borderRadius: '4px' }} />
                </div>
              </div>
            </div>
          </ChartContainer>

          <ChartContainer title="Cost Breakdown" data={costBreakdownData} filename={`${details?.ferme}_breakdown`}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={costBreakdownData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={100} tick={axisTick} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipProps} formatter={(v) => [v.toLocaleString() + ' MAD', 'Amount']} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                  {costBreakdownData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      )}

      {/* Production Pattern */}
      <ChartContainer title="Daily Harvest Pattern (kg)" data={dailyChartData} filename={`${details?.ferme}_pattern`}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dailyChartData} margin={{ top: 20, right: 20, left: 10, bottom: 60 }}>
            <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} angle={-45} textAnchor="end" interval={Math.floor(dailyChartData.length / 15)} />
            <YAxis tick={axisTick} tickFormatter={formatNum} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipProps} formatter={(v) => [v.toLocaleString() + ' kg', 'Tonnage']} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {dailyChartData.map((_, i) => <Cell key={i} fill={ACCENT_INFO} fillOpacity={0.8} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Varieties & Serres in one grid */}
      <div className="charts-grid" style={{ marginTop: '30px' }}>
        <div className="chart">
          <h3>🌾 Varieties Performance</h3>
          <table className="data-table">
            <thead>
              <tr><th>Variety</th><th>Tonnage</th><th>Yield/Ha</th></tr>
            </thead>
            <tbody>
              {by_variety?.map((v, i) => (
                <tr key={i}>
                  <td><strong>{v.variety}</strong><br/><small style={{ color: 'var(--text-muted)' }}>{v.type}</small></td>
                  <td>{v.tonnage?.toLocaleString()}</td>
                  <td style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{v.yield_per_ha?.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="chart">
          <h3>🏚️ Serre Breakdown</h3>
          <table className="data-table">
            <thead>
              <tr><th>Serre</th><th>Variety</th><th>Tonnage</th></tr>
            </thead>
            <tbody>
              {by_serre?.map((s, i) => (
                <tr key={i}>
                  <td><strong>#{s.serre}</strong></td>
                  <td>{s.variety}</td>
                  <td style={{ fontWeight: '600' }}>{s.tonnage?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Domain
