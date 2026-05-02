import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { getGroups, getGroupDetails, getClubs, getClubDetails } from '../services/api'
import { useQnz } from '../context/QnzContext'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

// ---------------------------------------------------------------------------
// Shared tooltip style (uses CSS design tokens)
// ---------------------------------------------------------------------------
const tooltipStyle = {
  contentStyle: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--text)',
    fontSize: 13,
  },
  cursor: { fill: 'rgba(255,255,255,0.05)' },
}

// ---------------------------------------------------------------------------
// GroupsTab
// ---------------------------------------------------------------------------
function GroupsTab() {
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [groupData, setGroupData] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { selectedQnz } = useQnz()

  useEffect(() => {
    setLoading(true)
    setSelectedGroup(null)
    setGroupData(null)
    getGroups({ qnz: selectedQnz })
      .then(res => {
        setGroups(res.data)
        if (res.data.length > 0) setSelectedGroup(res.data[0])
      })
      .catch(err => console.error('Error loading groups:', err))
      .finally(() => setLoading(false))
  }, [selectedQnz])

  useEffect(() => {
    if (!selectedGroup) return
    getGroupDetails(selectedGroup, { qnz: selectedQnz })
      .then(res => setGroupData(res.data))
      .catch(err => console.error('Error loading group details:', err))
  }, [selectedGroup, selectedQnz])

  const handleFarmClick = (ferme) => {
    navigate(`/domain/${encodeURIComponent(ferme)}`)
  }

  if (loading) return <div className="loading"><span className="loading-spinner" /></div>

  const maxTonnage = groupData?.farms?.[0]?.tonnage || 1
  const chartData = groupData?.farms?.map((f) => ({
    name: f.ferme,
    value: f.tonnage,
  })) ?? []

  return (
    <div>
      <div className="filter">
        <label>Select Group:</label>
        <select
          value={selectedGroup || ''}
          onChange={(e) => setSelectedGroup(e.target.value)}
        >
          {groups.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      {groupData && (
        <>
          <div className="metrics">
            <div className="metric">
              <span className="label">Total Tonnage</span>
              <span className="value">
                {groupData.summary.total_tonnage?.toLocaleString() || 0} kg
              </span>
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
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Farm</th>
                  <th>Code</th>
                  <th>Club</th>
                  <th>Tonnage (kg)</th>
                  <th>Superficie (ha)</th>
                  <th>Varieties</th>
                  <th>Harvest Days</th>
                </tr>
              </thead>
              <tbody>
                {groupData.farms.map((f, i) => (
                  <tr
                    key={i}
                    onClick={() => handleFarmClick(f.ferme)}
                    className="clickable-row"
                  >
                    <td className="farm-link">{f.ferme}</td>
                    <td>{f.code}</td>
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

          <h3>Farm Comparison</h3>
          {chartData.length > 0 ? (
            <div className="chart">
              <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 36)}>
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
                >
                  <XAxis
                    type="number"
                    hide
                    domain={[0, maxTonnage]}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={140}
                    tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                  />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(v) => [v.toLocaleString() + ' kg', 'Tonnage']}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill="var(--accent)" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// ClubsTab
// ---------------------------------------------------------------------------
function ClubsTab() {
  const [clubs, setClubs] = useState([])
  const [selectedClub, setSelectedClub] = useState(null)
  const [clubData, setClubData] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { selectedQnz } = useQnz()

  useEffect(() => {
    setLoading(true)
    setSelectedClub(null)
    setClubData(null)
    getClubs({ qnz: selectedQnz })
      .then(res => {
        setClubs(res.data)
        if (res.data.length > 0) setSelectedClub(res.data[0])
      })
      .catch(err => console.error('Error loading clubs:', err))
      .finally(() => setLoading(false))
  }, [selectedQnz])

  useEffect(() => {
    if (!selectedClub) return
    getClubDetails(selectedClub, { qnz: selectedQnz })
      .then(res => setClubData(res.data))
      .catch(err => console.error('Error loading club details:', err))
  }, [selectedClub, selectedQnz])

  const handleFarmClick = (ferme) => {
    navigate(`/domain/${encodeURIComponent(ferme)}`)
  }

  if (loading) return <div className="loading"><span className="loading-spinner" /></div>

  const maxTonnage = clubData?.farms?.[0]?.tonnage || 1
  const chartData = clubData?.farms?.map((f) => ({
    name: f.ferme,
    value: f.tonnage,
  })) ?? []

  return (
    <div>
      <div className="filter">
        <label>Select Club:</label>
        <select
          value={selectedClub || ''}
          onChange={(e) => setSelectedClub(e.target.value)}
        >
          {clubs.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {clubData && (
        <>
          <div className="metrics">
            <div className="metric">
              <span className="label">Total Tonnage</span>
              <span className="value">
                {clubData.summary.total_tonnage?.toLocaleString() || 0} kg
              </span>
            </div>
            <div className="metric">
              <span className="label">Farms</span>
              <span className="value">{clubData.summary.farms || 0}</span>
            </div>
            <div className="metric">
              <span className="label">Groups</span>
              <span className="value">{clubData.summary.groups || 0}</span>
            </div>
            <div className="metric">
              <span className="label">Varieties</span>
              <span className="value">{clubData.summary.varieties || 0}</span>
            </div>
          </div>

          <h3>Farms in {selectedClub}</h3>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Farm</th>
                  <th>Code</th>
                  <th>Group</th>
                  <th>Tonnage (kg)</th>
                  <th>Superficie (ha)</th>
                  <th>Varieties</th>
                  <th>Harvest Days</th>
                </tr>
              </thead>
              <tbody>
                {clubData.farms.map((f, i) => (
                  <tr
                    key={i}
                    onClick={() => handleFarmClick(f.ferme)}
                    className="clickable-row"
                  >
                    <td className="farm-link">{f.ferme}</td>
                    <td>{f.code}</td>
                    <td>{f.group_name}</td>
                    <td>{f.tonnage?.toLocaleString()}</td>
                    <td>{f.superficie?.toFixed(2)}</td>
                    <td>{f.varieties}</td>
                    <td>{f.harvest_days}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3>Farm Comparison</h3>
          {chartData.length > 0 ? (
            <div className="chart">
              <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 36)}>
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
                >
                  <XAxis
                    type="number"
                    hide
                    domain={[0, maxTonnage]}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={140}
                    tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                  />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(v) => [v.toLocaleString() + ' kg', 'Tonnage']}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill="var(--accent)" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Segments page
// ---------------------------------------------------------------------------
function Segments() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Initialize tab from ?tab=clubs URL param; default to 'groups'
  const initialTab = searchParams.get('tab') === 'clubs' ? 'clubs' : 'groups'
  const [activeTab, setActiveTab] = useState(initialTab)

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab === 'clubs') {
      setSearchParams({ tab: 'clubs' })
    } else {
      setSearchParams({})
    }
  }

  return (
    <div className="page">
      <h2>📂 Segments</h2>

      {/* Tab buttons */}
      <div className="segments-tabs">
        <button
          className={`tab-btn${activeTab === 'groups' ? ' tab-btn--active' : ''}`}
          onClick={() => handleTabChange('groups')}
        >
          📁 Groups
        </button>
        <button
          className={`tab-btn${activeTab === 'clubs' ? ' tab-btn--active' : ''}`}
          onClick={() => handleTabChange('clubs')}
        >
          🏠 Clubs
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'groups' ? <GroupsTab /> : <ClubsTab />}
    </div>
  )
}

export default Segments
