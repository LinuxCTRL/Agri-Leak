import { useState, useEffect } from 'react'
import { getGroups, getGroupDetails } from '../services/api'

function Groups() {
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [groupData, setGroupData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    try {
      const res = await getGroups()
      setGroups(res.data)
      if (res.data.length > 0) {
        setSelectedGroup(res.data[0])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedGroup) {
      loadGroupDetails(selectedGroup)
    }
  }, [selectedGroup])

  const loadGroupDetails = async (group) => {
    try {
      const res = await getGroupDetails(group)
      setGroupData(res.data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="page">
      <h2>📁 Groups</h2>

      <div className="filter">
        <label>Select Group:</label>
        <select value={selectedGroup || ''} onChange={(e) => setSelectedGroup(e.target.value)}>
          {groups.map(g => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      {groupData && (
        <>
          <div className="metrics">
            <div className="metric">
              <span className="label">Total Tonnage</span>
              <span className="value">{groupData.summary.total_tonnage?.toLocaleString() || 0} kg</span>
            </div>
            <div className="metric">
              <span className="label">Farms</span>
              <span className="value">{groupData.summary.farms || 0}</span>
            </div>
            <div className="metric">
              <span className="label">Clubs</span>
              <span className="value">{groupData.summary.clubs || 0}</span>
            </div>
            <div className="metric">
              <span className="label">Varieties</span>
              <span className="value">{groupData.summary.varieties || 0}</span>
            </div>
          </div>

          <h3>Farms in {selectedGroup}</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Farm</th>
                <th>Tonnage (kg)</th>
                <th>Variety</th>
                <th>Type</th>
                <th>Superficie (ha)</th>
              </tr>
            </thead>
            <tbody>
              {groupData.by_farm.map((f, i) => (
                <tr key={i}>
                  <td>{f.ferme}</td>
                  <td>{f.tonnage?.toLocaleString()}</td>
                  <td>{f.variety}</td>
                  <td>{f.type}</td>
                  <td>{f.superficie}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Farm Comparison (Bar Chart)</h3>
          <div className="bar-chart">
            {groupData.by_farm.map((f, i) => (
              <div key={i} className="bar-row">
                <span className="bar-label">{f.ferme}</span>
                <div className="bar-container">
                  <div 
                    className="bar" 
                    style={{ width: `${(f.tonnage / groupData.by_farm[0].tonnage) * 100}%` }}
                  ></div>
                </div>
                <span className="bar-value">{f.tonnage.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default Groups