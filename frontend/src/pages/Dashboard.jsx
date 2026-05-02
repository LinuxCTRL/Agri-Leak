import { useState, useEffect } from 'react'
import { getTonnageSummary, getGroups, getClubs } from '../services/api'

function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [summaryRes, groupsRes, clubsRes] = await Promise.all([
        getTonnageSummary(),
        getGroups(),
        getClubs()
      ])
      setData({
        summary: summaryRes.data,
        groups: groupsRes.data,
        clubs: clubsRes.data
      })
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="page">
      <h2>📊 Dashboard</h2>

      <div className="metrics">
        <div className="metric">
          <span className="label">Total Tonnage</span>
          <span className="value">{data?.summary?.total_tonnage?.toLocaleString() || 0} kg</span>
        </div>
        <div className="metric">
          <span className="label">Groups</span>
          <span className="value">{data?.groups?.length || 0}</span>
        </div>
        <div className="metric">
          <span className="label">Clubs</span>
          <span className="value">{data?.clubs?.length || 0}</span>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart">
          <h3>Top Farms by Tonnage</h3>
          <div className="bar-chart">
            {data?.summary?.by_farm?.slice(0, 10).map((farm, i) => (
              <div key={i} className="bar-row">
                <span className="bar-label">{farm.ferme}</span>
                <div className="bar-container">
                  <div 
                    className="bar" 
                    style={{ width: `${(farm.tonnage / data.summary.by_farm[0].tonnage) * 100}%` }}
                  ></div>
                </div>
                <span className="bar-value">{farm.tonnage.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart">
          <h3>Tonnage by Group</h3>
          <div className="bar-chart">
            {data?.summary?.by_group?.map((g, i) => (
              <div key={i} className="bar-row">
                <span className="bar-label">{g.group_name}</span>
                <div className="bar-container">
                  <div 
                    className="bar bar-group" 
                    style={{ width: `${(g.tonnage / data.summary.by_group[0].tonnage) * 100}%` }}
                  ></div>
                </div>
                <span className="bar-value">{g.tonnage.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard