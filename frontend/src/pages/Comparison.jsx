import { useState, useEffect } from 'react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { getQnzComparison } from '../services/api'
import { tooltipProps, axisTick, ACCENT, ACCENT_WARNING } from '../utils/chartTheme'

function Comparison() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getQnzComparison()
      .then((res) => {
        setData(res.data)
      })
      .catch((err) => console.error('Error fetching comparison data:', err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">Loading Comparison...</div>

  const formatNum = (n) => {
    if (n == null) return '—'
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return n.toFixed(0)
  }

  const chartData = data.map(d => ({
    name: `QNZ ${d.qnz}`,
    tonnage: d.total_tonnage,
    cost: d.total_cost,
    costPerTon: d.cost_per_ton
  }))

  return (
    <div className="page">
      <h2>📈 QNZ Performance Comparison</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>
        Compare total production (tonnage) vs total expenditure (costs) across all quinzaines.
      </p>

      <div className="chart" style={{ height: '500px', padding: '30px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="name" tick={axisTick} />
            <YAxis 
              yId="left" 
              tick={axisTick} 
              tickFormatter={formatNum}
              label={{ value: 'Tonnage (kg)', angle: -90, position: 'insideLeft', style: { fill: 'var(--text-muted)', fontSize: 12 } }}
            />
            <YAxis 
              yId="right" 
              orientation="right" 
              tick={axisTick} 
              tickFormatter={formatNum}
              label={{ value: 'Cost (MAD)', angle: 90, position: 'insideRight', style: { fill: 'var(--text-muted)', fontSize: 12 } }}
            />
            <Tooltip 
              {...tooltipProps} 
              formatter={(v, name) => {
                if (name === 'Tonnage') return [v.toLocaleString() + ' kg', name]
                if (name === 'Cost') return [v.toLocaleString() + ' MAD', name]
                return [v.toFixed(2) + ' MAD/ton', name]
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar yId="left" dataKey="tonnage" name="Tonnage" fill={ACCENT} radius={[4, 4, 0, 0]} barSize={40} />
            <Line yId="right" type="monotone" dataKey="cost" name="Cost" stroke={ACCENT_WARNING} strokeWidth={3} dot={{ r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: '50px' }}>
        <h3>Detailed Comparison Table</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Quinzaine</th>
              <th>Total Tonnage (kg)</th>
              <th>Total Cost (MAD)</th>
              <th>Cost per Ton (MAD/t)</th>
              <th>Efficiency (kg/MAD)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={i}>
                <td><strong>QNZ {d.qnz}</strong></td>
                <td>{d.total_tonnage?.toLocaleString()}</td>
                <td>{d.total_cost?.toLocaleString()}</td>
                <td style={{ fontWeight: 'bold', color: 'var(--accent-warning)' }}>
                  {d.cost_per_ton?.toFixed(2)}
                </td>
                <td style={{ fontWeight: 'bold', color: 'var(--accent)' }}>
                  {d.total_cost > 0 ? (d.total_tonnage / d.total_cost).toFixed(3) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Comparison
