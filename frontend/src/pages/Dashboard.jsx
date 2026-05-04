import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { getTonnageSummary, getGroups, getClubs, getFarms, getCropTypes } from '../services/api'
import { useQnz } from '../context/QnzContext'
import { tooltipProps, axisTick, cropTypeColors, ACCENT } from '../utils/chartTheme'
import ChartContainer from '../components/ChartContainer'

function Dashboard() {
  const [data, setData] = useState(null)
  const [farms, setFarms] = useState([])
  const [cropTypes, setCropTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { selectedQnz } = useQnz()

  useEffect(() => {
    setLoading(true)
    const load = async () => {
      try {
        const [summaryRes, groupsRes, clubsRes, farmsRes, cropTypesRes] = await Promise.all([
          getTonnageSummary({ qnz: selectedQnz }),
          getGroups({ qnz: selectedQnz }),
          getClubs({ qnz: selectedQnz }),
          getFarms({ qnz: selectedQnz }),
          getCropTypes({ qnz: selectedQnz })
        ])
        setData({
          summary: summaryRes.data,
          groups: groupsRes.data,
          clubs: clubsRes.data
        })
        setFarms(farmsRes.data)
        setCropTypes(cropTypesRes.data)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [selectedQnz])

  const handleFarmClick = (ferme) => {
    navigate(`/domain/${encodeURIComponent(ferme)}`)
  }

  const formatNum = (n) => {
    if (n == null) return '—'
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return n.toFixed(0)
  }

  if (loading) return <div className="loading">Loading Dashboard...</div>

  // ── Chart data ────────────────────────────────────────────────────────────

  // 6.1 Top Farms by Tonnage — horizontal bar chart
  const topFarmsData = (data?.summary?.by_farm ?? [])
    .slice(0, 10)
    .map((f) => ({ name: f.ferme, value: f.tonnage }))

  // 6.2 Tonnage by Group — horizontal bar chart
  const byGroupData = (data?.summary?.by_group ?? [])
    .map((g) => ({ name: g.group, value: g.tonnage }))

  // 6.3 Tonnage by Crop Type — horizontal bar chart with per-type colours
  const byCropTypeData = cropTypes.map((ct) => ({
    name: ct.type,
    value: ct.tonnage,
    color: cropTypeColors[ct.type] || ACCENT,
  }))

  return (
    <div className="page">
      <h2>📊 Dashboard</h2>

      <div className="metrics">
        <div className="metric" style={{ borderLeft: '4px solid var(--accent)' }}>
          <span className="label">Total Tonnage</span>
          <span className="value">{data?.summary?.total_tonnage?.toLocaleString() || 0} kg</span>
        </div>
        <div className="metric" style={{ borderLeft: '4px solid var(--accent-warning)' }}>
          <span className="label">Total Cost</span>
          <span className="value">{formatNum(data?.summary?.total_cost)} MAD</span>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {data?.summary?.cost_per_ton?.toFixed(2)} MAD/kg
          </div>
        </div>
        <div className="metric">
          <span className="label">Yield / Ha</span>
          <span className="value">{data?.summary?.yield_per_ha?.toFixed(0)} kg</span>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {data?.summary?.total_superficie?.toFixed(2)} ha total
          </div>
        </div>
        <div className="metric">
          <span className="label">Entities</span>
          <span className="value" style={{ fontSize: '1.4rem' }}>
            {farms.length} F · {data?.groups?.length} G · {data?.clubs?.length} C
          </span>
        </div>
      </div>

      {/* Crop Type Cards */}
      {cropTypes.length > 0 && (
        <>
          <h3>Production by Crop Type</h3>
          <div className="metrics" style={{ gridTemplateColumns: `repeat(${cropTypes.length}, 1fr)`, marginTop: '20px' }}>
            {cropTypes.map((ct, i) => (
              <div key={i} className="metric" style={{ borderLeft: `4px solid ${cropTypeColors[ct.type] || ACCENT}` }}>
                <span className="label">{ct.type}</span>
                <span className="value" style={{ fontSize: '1.6rem' }}>{formatNum(ct.tonnage)} kg</span>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  <span>{ct.farms} farms</span>
                  <span>{ct.yield_per_ha?.toFixed(0)} kg/ha</span>
                  <span>{ct.pct_tonnage?.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="charts-grid">
        {/* 6.1 Top Farms by Tonnage */}
        <ChartContainer 
          title="Top Farms by Tonnage" 
          data={topFarmsData} 
          filename="top_farms_tonnage"
        >
          {topFarmsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(200, topFarmsData.length * 36)}>
              <BarChart
                data={topFarmsData}
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
                  formatter={(v) => [v.toLocaleString() + ' kg', 'Tonnage']}
                />
                <Bar
                  dataKey="value"
                  radius={[0, 6, 6, 0]}
                  style={{ cursor: 'pointer' }}
                  onClick={(entry) => handleFarmClick(entry.name)}
                >
                  {topFarmsData.map((_, i) => (
                    <Cell key={i} fill={ACCENT} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </ChartContainer>

        {/* 6.2 Tonnage by Group */}
        <ChartContainer 
          title="Tonnage by Group" 
          data={byGroupData} 
          filename="tonnage_by_group"
        >
          {byGroupData.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(200, byGroupData.length * 36)}>
              <BarChart
                data={byGroupData}
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
                  formatter={(v) => [v.toLocaleString() + ' kg', 'Tonnage']}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {byGroupData.map((_, i) => (
                    <Cell key={i} fill={ACCENT} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </ChartContainer>
      </div>

      {/* 6.3 Tonnage by Crop Type */}
      {byCropTypeData.length > 0 && (
        <ChartContainer 
          title="Tonnage by Crop Type" 
          data={byCropTypeData} 
          filename="tonnage_by_crop_type"
        >
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={byCropTypeData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <XAxis
                type="category"
                dataKey="name"
                tick={axisTick}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis type="number" hide />
              <Tooltip
                {...tooltipProps}
                formatter={(v) => [formatNum(v) + ' kg', 'Tonnage']}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {byCropTypeData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      )}

      <h3>All Farms</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Farm</th>
            <th>Code</th>
            <th>Group</th>
            <th>Club</th>
            <th>Tonnage (kg)</th>
            <th>Superficie (ha)</th>
            <th>Varieties</th>
            <th>Harvest Days</th>
          </tr>
        </thead>
        <tbody>
          {farms.map((f, i) => (
            <tr key={i} onClick={() => handleFarmClick(f.ferme)} className="clickable-row">
              <td className="farm-link">{f.ferme}</td>
              <td>{f.code}</td>
              <td>{f.group_name}</td>
              <td>{f.club}</td>
              <td>{f.tonnage?.toLocaleString()}</td>
              <td>{f.superficie?.toFixed(2)}</td>
              <td>{f.varieties}</td>
              <td>{f.harvest_days}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Dashboard
