import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts'
import { getDomainDetails, getCostPerTon, getProductivity, getFarms } from '../services/api'
import { useQnz } from '../context/QnzContext'
import { tooltipProps, axisTick, cropTypeColors, ACCENT, ACCENT_INFO, ACCENT_WARNING } from '../utils/chartTheme'
import ChartContainer from '../components/ChartContainer'

function IconCode() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> }
function IconGroup() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> }
function IconClub() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> }
function IconTonnage() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> }
function IconArea() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg> }
function IconYield() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> }
function IconEfficiency() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> }

function ReportsSelector() {
  const [farms, setFarms] = useState([])
  const [loading, setLoading] = useState(true)
  const { selectedQnz } = useQnz()

  useEffect(() => {
    setLoading(true)
    getFarms({ qnz: selectedQnz })
      .then(res => setFarms(res.data))
      .catch(err => console.error('Error:', err))
      .finally(() => setLoading(false))
  }, [selectedQnz])

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="page">
      <div className="page-header">
        <h2>Generate Farm Report</h2>
        <p className="subtitle">Select a farm to generate a comprehensive report</p>
      </div>
      <div className="report-selector-grid">
        {farms.map((f, i) => (
          <a key={i} href={`/report/${encodeURIComponent(f.ferme)}?qnz=${selectedQnz}`} className="report-card">
            <div className="report-card-header">
              <h3>{f.ferme}</h3>
              <span className="report-card-code">{f.code}</span>
            </div>
            <div className="report-card-meta">
              <span>{f.group_name}</span>
              <span>{f.club}</span>
            </div>
            <div className="report-card-stats">
              <div><strong>{formatNum(f.tonnage)}</strong><br/>kg</div>
              <div><strong>{f.superficie?.toFixed(2)}</strong><br/>ha</div>
              <div><strong>{f.varieties}</strong><br/>varieties</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

const formatNum = (n) => {
  if (n == null) return '—'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toFixed(0)
}

function ReportsDetail() {
  const { ferme } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const reportRef = useRef()
  const [data, setData] = useState(null)
  const [costPerTon, setCostPerTon] = useState(null)
  const [productivity, setProductivity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { availableQnz } = useQnz()

  const qnzParam = searchParams.get('qnz')
  const selectedQnz = qnzParam ? parseInt(qnzParam) : 0

  useEffect(() => { loadData() }, [ferme, selectedQnz])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [domainRes, cptRes, prodRes] = await Promise.all([
        getDomainDetails(decodeURIComponent(ferme), { qnz: selectedQnz }),
        getCostPerTon({ qnz: selectedQnz }),
        getProductivity({ qnz: selectedQnz }),
      ])
      setData(domainRes.data)
      setCostPerTon(cptRes.data)
      setProductivity(prodRes.data)
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to load report data')
    } finally { setLoading(false) }
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'
  const handlePrint = () => window.print()

  if (loading) return <div className="loading">Generating Report...</div>
  if (error) return <div className="page"><h2>{error}</h2></div>

  const { details, summary, by_variety, by_serre, daily_harvest, cost } = data
  const costPerTonFarm = costPerTon?.by_farm?.find(f => f.Domaine === details?.ferme)
  const productivityFarm = productivity?.by_farm?.find(f => f.ferme === details?.ferme)

  const allFarmProductivity = productivity?.by_farm || []
  const farmRank = allFarmProductivity.sort((a, b) => (b.yield_per_ha || 0) - (a.yield_per_ha || 0)).findIndex(f => f.ferme === details?.ferme) + 1
  const allFarmCostPerTon = (costPerTon?.by_farm || []).sort((a, b) => (a.cost_per_ton || 0) - (b.cost_per_ton || 0))
  const costRank = allFarmCostPerTon.findIndex(f => f.Domaine === details?.ferme) + 1
  const totalFarmsInCost = allFarmCostPerTon.length

  const costBreakdownData = cost ? [
    { name: "Main D'œuvre", value: cost.main_doeuvre, color: '#10b981' },
    { name: 'Echassier', value: cost.echassier, color: '#3b82f6' },
    { name: 'Poste Fixe', value: cost.poste_fixe, color: '#8b5cf6' },
    { name: 'Dépenses Externes', value: cost.depenses_externe, color: '#f59e0b' },
    { name: 'Dépenses Internes', value: cost.depenses_interne, color: '#ef4444' },
  ].filter(c => c.value > 0).sort((a, b) => b.value - a.value) : []

  const dailyChartData = (daily_harvest || [])
    .sort((a, b) => b.tonnage - a.tonnage).slice(0, 20)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(d => ({ date: formatDate(d.date), value: d.tonnage }))

  const varietyChartData = (by_variety || []).map(v => ({
    name: v.variety, value: v.tonnage,
    color: cropTypeColors[v.type] || ACCENT,
  }))

  const serreChartData = (by_serre || []).map(s => ({ name: `#${s.serre}`, value: s.tonnage }))

  const qnzLabel = selectedQnz === 0
    ? `All Quinzaines (QNZ ${Math.min(...availableQnz)} - ${Math.max(...availableQnz)})`
    : `QNZ ${selectedQnz}`
  const reportDate = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="page">
      <div className="page-header no-print">
        <div style={{ flex: 1 }}>
          <h2>Report: {details?.ferme}</h2>
          <p className="subtitle">{qnzLabel} — Generated {reportDate}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
          <button className="report-btn" onClick={() => navigate(-1)}>Back</button>
          <button className="report-btn report-btn--primary" onClick={handlePrint}>Print</button>
        </div>
      </div>

      <div ref={reportRef} className="report-content">

        <div className="report-header">
          <h1 className="report-title">{details?.ferme}</h1>
          <div className="report-meta">
            <span><IconCode /> {details?.code}</span>
            <span><IconGroup /> {details?.group}</span>
            <span><IconClub /> {details?.club}</span>
          </div>
          <p className="report-period">{qnzLabel} — Generated on {reportDate}</p>
        </div>

        <section className="report-section">
          <h2 className="report-section-title">1. Production Overview</h2>
          <div className="metrics">
            <div className="metric" style={{ borderLeft: '4px solid var(--accent)' }}><div className="metric-header"><IconTonnage /> <span className="label">Total Tonnage</span></div><span className="value">{summary?.total_tonnage?.toLocaleString()} kg</span></div>
            <div className="metric" style={{ borderLeft: '4px solid var(--accent-info)' }}><div className="metric-header"><IconArea /> <span className="label">Superficie</span></div><span className="value">{summary?.total_superficie?.toFixed(2)} ha</span></div>
            <div className="metric" style={{ borderLeft: '4px solid var(--accent-success)' }}><div className="metric-header"><IconYield /> <span className="label">Yield / Ha</span></div><span className="value">{summary?.yield_per_ha?.toFixed(0)} kg/ha</span></div>
            <div className="metric" style={{ borderLeft: '4px solid var(--accent-warning)' }}><div className="metric-header"><IconEfficiency /> <span className="label">Rankings</span></div><span className="value">#{farmRank} Yield · #{costRank}/{totalFarmsInCost} Cost</span></div>
          </div>
        </section>

        {cost && (
<section className="report-section">
          <h2 className="report-section-title">2. Cost Analysis</h2>
          <div className="metrics" style={{ marginBottom: '20px' }}>
            <div className="metric" style={{ borderLeft: '4px solid var(--accent)' }}><span className="label">Total Investment</span><span className="value">{cost.total_cost?.toLocaleString()} MAD</span></div>
            <div className="metric" style={{ borderLeft: '4px solid var(--accent-warning)' }}><span className="label">Cost / Ton</span><span className="value">{cost.cost_per_ton?.toFixed(2)} MAD</span></div>
            <div className="metric" style={{ borderLeft: '4px solid var(--accent-info)' }}><span className="label">Cost / Ha</span><span className="value">{cost.cost_per_ha?.toLocaleString()} MAD</span></div>
            <div className="metric" style={{ borderLeft: '4px solid var(--accent-success)' }}><span className="label">Cost / Ton (Global)</span><span className="value">{costPerTonFarm?.cost_per_ton?.toFixed(2) ?? '—'} MAD</span></div>
          </div>
          <ChartContainer title="Cost Breakdown" data={costBreakdownData} filename={`${details?.ferme}_cost`}>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
              {costBreakdownData.map((e, i) => {
                const total = cost.total_cost || 1
                const pct = ((e.value / total) * 100).toFixed(1)
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                    <span style={{ width: '16px', height: '16px', borderRadius: '3px', background: e.color, flexShrink: 0 }} />
                    <span style={{ width: '140px', fontSize: '0.9rem', fontWeight: '600', color: '#333', flexShrink: 0 }}>{e.name}</span>
                    <div style={{ flex: 1, height: '18px', background: '#eee', borderRadius: '4px', minWidth: '100px' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: e.color, borderRadius: '4px' }} />
                    </div>
                    <span style={{ width: '80px', fontSize: '0.85rem', fontWeight: '700', textAlign: 'right', color: '#333', flexShrink: 0 }}>{e.value.toLocaleString()}</span>
                    <span style={{ width: '50px', fontSize: '0.8rem', color: '#666', textAlign: 'right', flexShrink: 0 }}>{pct}%</span>
                  </div>
                )
              })}
            </div>
          </ChartContainer>
          <div className="chart" style={{ marginTop: '20px', width: '100%' }}>
            <table className="data-table" style={{ width: '100%' }}><thead><tr><th>Category</th><th>Amount (MAD)</th></tr></thead><tbody>{[{n:'Main D\'œuvre',v:cost.main_doeuvre},{n:'Echassier',v:cost.echassier},{n:'Poste Fixe',v:cost.poste_fixe},{n:'Dépenses Externes',v:cost.depenses_externe},{n:'Dépenses Internes',v:cost.depenses_interne}].map((r,i) => <tr key={i}><td>{r.n}</td><td>{r.v?.toLocaleString()}</td></tr>)}<tr style={{fontWeight:'bold',borderTop:'2px solid #ccc'}}><td>Total</td><td>{cost.total_cost?.toLocaleString()}</td></tr></tbody></table>
          </div>
        </section>
        )}

        <section className="report-section">
          <h2 className="report-section-title">3. Variety Performance</h2>
          <ChartContainer title="Tonnage by Variety" data={varietyChartData} filename={`${details?.ferme}_varieties`}>
            <div style={{ padding: '15px', width: '100%' }}>
              <ResponsiveContainer width="100%" height={Math.max(280, (by_variety?.length || 0) * 40)}>
                <BarChart data={varietyChartData} layout="vertical" margin={{ top: 0, right: 50, left: 0, bottom: 0 }}>
                  <XAxis type="number" tick={axisTick} tickFormatter={formatNum} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fill: '#333', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => [v.toLocaleString() + ' kg', 'Tonnage']} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>{varietyChartData.map((e, i) => <Cell key={i} fill={e.color} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartContainer>
          <div className="chart" style={{ marginTop: '20px', width: '100%' }}>
            <table className="data-table" style={{ width: '100%' }}><thead><tr><th>Variety</th><th>Type</th><th>Tonnage</th><th>Yield/Ha</th></tr></thead><tbody>{by_variety?.map((v, i) => <tr key={i}><td><strong>{v.variety}</strong></td><td>{v.type}</td><td>{v.tonnage?.toLocaleString()} kg</td><td style={{ fontWeight: 'bold', color: '#10b981' }}>{v.yield_per_ha?.toFixed(0)} kg/ha</td></tr>)}</tbody></table>
          </div>
        </section>

        <section className="report-section">
          <h2 className="report-section-title">4. Greenhouse (Serre) Breakdown</h2>
          <ChartContainer title="Tonnage by Serre" data={serreChartData} filename={`${details?.ferme}_serres`}>
            <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>{serreChartData.map((e, i) => { const max = serreChartData[0]?.value || 1; const pct = ((e.value / max) * 100).toFixed(0); const colors = ['#10b981', '#3b82f6', '#3b82f6', '#3b82f6', '#8b5cf6', '#8b5cf6', '#8b5cf6', '#8b5cf6', '#8b5cf6', '#8b5cf6', '#8b5cf6', '#8b5cf6', '#8b5cf6', '#8b5cf6', '#8b5cf6', '#8b5cf6', '#8b5cf6', '#8b5cf6', '#8b5cf6', '#8b5cf6']; const color = colors[i] || '#8b5cf6'; return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}><span style={{ width: '60px', fontSize: '0.8rem', fontWeight: '600', color: '#333', textAlign: 'right', flexShrink: 0 }}>{e.name}</span><div style={{ flex: 1, height: '20px', background: '#eee', borderRadius: '4px', minWidth: '50px' }}><div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '4px' }} /></div><span style={{ width: '65px', fontSize: '0.8rem', fontWeight: '600', textAlign: 'right', color: '#333', flexShrink: 0 }}>{formatNum(e.value)}</span><span style={{ width: '40px', fontSize: '0.7rem', color: '#666', textAlign: 'right', flexShrink: 0 }}>{pct}%</span></div>})}</div>
          </ChartContainer>
          <div className="chart" style={{ marginTop: '20px', width: '100%' }}>
            <table className="data-table" style={{ width: '100%' }}><thead><tr><th>Serre</th><th>Variety</th><th>Type</th><th>Tonnage</th></tr></thead><tbody>{by_serre?.map((s, i) => <tr key={i}><td><strong>{s.serre}</strong></td><td>{s.variety}</td><td>{s.type}</td><td>{s.tonnage?.toLocaleString()} kg</td></tr>)}</tbody></table>
          </div>
        </section>

        <section className="report-section">
          <h2 className="report-section-title">5. Daily Harvest Pattern</h2>
          <ChartContainer title="Daily Tonnage (Top 20 Days)" data={dailyChartData} filename={`${details?.ferme}_daily`}>
            <div style={{ padding: '10px', width: '100%' }}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dailyChartData} margin={{ top: 15, right: 25, left: 35, bottom: 70 }}>
                  <XAxis dataKey="date" tick={{ fill: '#333', fontSize: 9 }} angle={-45} textAnchor="end" interval={0} height={70} />
                  <YAxis tick={axisTick} tickFormatter={formatNum} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => [v.toLocaleString() + ' kg', 'Tonnage']} />
                  <Bar dataKey="value" radius={[3, 3, 0, 0]}>{dailyChartData.map((_, i) => <Cell key={i} fill="#3b82f6" />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartContainer>
        </section>

        <section className="report-section">
          <h2 className="report-section-title">6. Efficiency Benchmarking</h2>
          <div className="metrics">
            <div className="metric" style={{ borderLeft: '4px solid var(--accent-success)' }}><span className="label">Yield Rank</span><span className="value">#{farmRank} / {allFarmProductivity.length}</span></div>
            <div className="metric" style={{ borderLeft: '4px solid var(--accent-warning)' }}><span className="label">Cost Efficiency Rank</span><span className="value">#{costRank} / {totalFarmsInCost}</span></div>
            {productivityFarm && (<><div className="metric" style={{ borderLeft: '4px solid var(--accent)' }}><span className="label">kg per MAD</span><span className="value">{productivityFarm.efficiency?.toFixed(3)}</span></div><div className="metric" style={{ borderLeft: '4px solid var(--accent-info)' }}><span className="label">Cost / Ton</span><span className="value">{productivityFarm.cost_per_ton?.toFixed(2)} MAD</span></div></>)}
          </div>
        </section>

        <div className="report-footer">
          <p>Agri-Leak Agricultural Data Lake — Report generated on {reportDate}</p>
          <p>{qnzLabel} | Farm: {details?.ferme} | Code: {details?.code}</p>
        </div>
      </div>
    </div>
  )
}

export default function Reports() {
  const { ferme } = useParams()
  return ferme ? <ReportsDetail /> : <ReportsSelector />
}