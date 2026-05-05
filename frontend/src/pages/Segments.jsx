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
import ChartContainer from '../components/ChartContainer'
import { tooltipProps, axisTick, ACCENT, ACCENT_INFO, ACCENT_WARNING } from '../utils/chartTheme'

// ── Icons ────────────────────────────────────────────────────────────────
function IconFarms() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> }
function IconTonnage() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> }
function IconVarieties() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> }
function IconYield() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> }

const formatNum = (n) => {
  if (n == null) return '—'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toFixed(0)
}

const renderCustomBarLabel = ({ x, y, width, height, value }) => (
  <text 
    x={x + width + 10} 
    y={y + height / 2} 
    fill="var(--text-muted)" 
    dominantBaseline="middle"
    style={{ fontSize: '0.75rem', fontWeight: '600' }}
  >
    {formatNum(value)}
  </text>
)

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

  if (loading) return <div className="loading">Loading Groups...</div>

  const farms = groupData?.farms ?? []
  const tonnageChartData = farms.map(f => ({ name: f.ferme, value: f.tonnage }))
  const yieldChartData = farms.map(f => ({ 
    name: f.ferme, 
    value: f.tonnage / (f.superficie || 1) 
  })).sort((a, b) => b.value - a.value)

  const avgYield = farms.length > 0 
    ? farms.reduce((sum, f) => sum + (f.tonnage / (f.superficie || 1)), 0) / farms.length 
    : 0

  return (
    <div className="tab-content">
      <div className="segment-selector-bar">
        <div className="selector-group">
          <label>📁 Active Group</label>
          <select value={selectedGroup || ''} onChange={(e) => setSelectedGroup(e.target.value)}>
            {groups.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div className="selector-meta">
          <span>{farms.length} Farms Analyzed</span>
        </div>
      </div>

      {groupData && (
        <>
          <div className="metrics">
            <div className="metric" style={{ borderLeft: '4px solid var(--accent)' }}>
              <div className="metric-header"><IconTonnage /> <span className="label">Total Tonnage</span></div>
              <span className="value">{groupData.summary.total_tonnage?.toLocaleString()} kg</span>
            </div>
            <div className="metric" style={{ borderLeft: '4px solid var(--accent-info)' }}>
              <div className="metric-header"><IconFarms /> <span className="label">Entities</span></div>
              <span className="value">{groupData.summary.farms} Farms · {groupData.summary.clubs} Clubs</span>
            </div>
            <div className="metric" style={{ borderLeft: '4px solid var(--accent-success)' }}>
              <div className="metric-header"><IconYield /> <span className="label">Avg Yield</span></div>
              <span className="value">{formatNum(avgYield)} kg/ha</span>
            </div>
            <div className="metric" style={{ borderLeft: '4px solid var(--accent-warning)' }}>
              <div className="metric-header"><IconVarieties /> <span className="label">Varieties</span></div>
              <span className="value">{groupData.summary.varieties} Active</span>
            </div>
          </div>

          <div className="charts-grid">
            <ChartContainer title="Production by Farm (kg)" data={tonnageChartData} filename={`${selectedGroup}_tonnage`}>
              <ResponsiveContainer width="100%" height={Math.max(300, tonnageChartData.length * 40)}>
                <BarChart data={tonnageChartData} layout="vertical" margin={{ top: 10, right: 60, left: 20, bottom: 10 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={140} tick={axisTick} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipProps} formatter={(v) => [v.toLocaleString() + ' kg', 'Tonnage']} />
                  <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={20} label={renderCustomBarLabel} onClick={(e) => navigate(`/domain/${encodeURIComponent(e.name)}`)}>
                    {tonnageChartData.map((_, i) => <Cell key={i} fill={ACCENT} fillOpacity={1 - (i * 0.05)} style={{ cursor: 'pointer' }} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>

            <ChartContainer title="Yield per Hectare (kg/ha)" data={yieldChartData} filename={`${selectedGroup}_yield`}>
              <ResponsiveContainer width="100%" height={Math.max(300, yieldChartData.length * 40)}>
                <BarChart data={yieldChartData} layout="vertical" margin={{ top: 10, right: 60, left: 20, bottom: 10 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={140} tick={axisTick} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipProps} formatter={(v) => [v.toFixed(0) + ' kg/ha', 'Yield']} />
                  <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={20} label={renderCustomBarLabel} onClick={(e) => navigate(`/domain/${encodeURIComponent(e.name)}`)}>
                    {yieldChartData.map((entry, i) => <Cell key={i} fill={entry.value > avgYield ? ACCENT_INFO : ACCENT_WARNING} style={{ cursor: 'pointer' }} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          <h3>Detailed Performance Table</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Farm</th>
                <th>Club</th>
                <th>Tonnage</th>
                <th>Surface</th>
                <th>Yield/Ha</th>
                <th>Varieties</th>
                <th>Days</th>
              </tr>
            </thead>
            <tbody>
              {farms.map((f, i) => (
                <tr key={i} onClick={() => navigate(`/domain/${encodeURIComponent(f.ferme)}`)} className="clickable-row">
                  <td className="farm-link">{f.ferme}</td>
                  <td>{f.club}</td>
                  <td style={{ fontWeight: '600' }}>{f.tonnage?.toLocaleString()}</td>
                  <td>{f.superficie?.toFixed(2)} ha</td>
                  <td style={{ color: (f.tonnage / f.superficie) > avgYield ? 'var(--accent)' : 'var(--accent-warning)', fontWeight: 'bold' }}>
                    {formatNum(f.tonnage / f.superficie)}
                  </td>
                  <td>{f.varieties}</td>
                  <td>{f.harvest_days}</td>
                </tr>
              ))}
            </tbody>
          </table>
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

  if (loading) return <div className="loading">Loading Clubs...</div>

  const farms = clubData?.farms ?? []
  const tonnageChartData = farms.map(f => ({ name: f.ferme, value: f.tonnage }))
  const yieldChartData = farms.map(f => ({ 
    name: f.ferme, 
    value: f.tonnage / (f.superficie || 1) 
  })).sort((a, b) => b.value - a.value)

  const avgYield = farms.length > 0 
    ? farms.reduce((sum, f) => sum + (f.tonnage / (f.superficie || 1)), 0) / farms.length 
    : 0

  return (
    <div className="tab-content">
      <div className="segment-selector-bar">
        <div className="selector-group">
          <label>🏠 Active Club</label>
          <select value={selectedClub || ''} onChange={(e) => setSelectedClub(e.target.value)}>
            {clubs.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="selector-meta">
          <span>{farms.length} Farms Analyzed</span>
        </div>
      </div>

      {clubData && (
        <>
          <div className="metrics">
            <div className="metric" style={{ borderLeft: '4px solid var(--accent)' }}>
              <div className="metric-header"><IconTonnage /> <span className="label">Total Tonnage</span></div>
              <span className="value">{clubData.summary.total_tonnage?.toLocaleString()} kg</span>
            </div>
            <div className="metric" style={{ borderLeft: '4px solid var(--accent-info)' }}>
              <div className="metric-header"><IconFarms /> <span className="label">Entities</span></div>
              <span className="value">{clubData.summary.farms} Farms · {clubData.summary.groups} Groups</span>
            </div>
            <div className="metric" style={{ borderLeft: '4px solid var(--accent-success)' }}>
              <div className="metric-header"><IconYield /> <span className="label">Avg Yield</span></div>
              <span className="value">{formatNum(avgYield)} kg/ha</span>
            </div>
            <div className="metric" style={{ borderLeft: '4px solid var(--accent-warning)' }}>
              <div className="metric-header"><IconVarieties /> <span className="label">Varieties</span></div>
              <span className="value">{clubData.summary.varieties} Active</span>
            </div>
          </div>

          <div className="charts-grid">
            <ChartContainer title="Production by Farm (kg)" data={tonnageChartData} filename={`${selectedClub}_tonnage`}>
              <ResponsiveContainer width="100%" height={Math.max(300, tonnageChartData.length * 40)}>
                <BarChart data={tonnageChartData} layout="vertical" margin={{ top: 10, right: 60, left: 20, bottom: 10 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={140} tick={axisTick} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipProps} formatter={(v) => [v.toLocaleString() + ' kg', 'Tonnage']} />
                  <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={20} label={renderCustomBarLabel} onClick={(e) => navigate(`/domain/${encodeURIComponent(e.name)}`)}>
                    {tonnageChartData.map((_, i) => <Cell key={i} fill={ACCENT_INFO} fillOpacity={1 - (i * 0.05)} style={{ cursor: 'pointer' }} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>

            <ChartContainer title="Yield per Hectare (kg/ha)" data={yieldChartData} filename={`${selectedClub}_yield`}>
              <ResponsiveContainer width="100%" height={Math.max(300, yieldChartData.length * 40)}>
                <BarChart data={yieldChartData} layout="vertical" margin={{ top: 10, right: 60, left: 20, bottom: 10 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={140} tick={axisTick} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipProps} formatter={(v) => [v.toFixed(0) + ' kg/ha', 'Yield']} />
                  <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={20} label={renderCustomBarLabel} onClick={(e) => navigate(`/domain/${encodeURIComponent(e.name)}`)}>
                    {yieldChartData.map((entry, i) => <Cell key={i} fill={entry.value > avgYield ? ACCENT : ACCENT_WARNING} style={{ cursor: 'pointer' }} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          <h3>Detailed Performance Table</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Farm</th>
                <th>Group</th>
                <th>Tonnage</th>
                <th>Surface</th>
                <th>Yield/Ha</th>
                <th>Varieties</th>
                <th>Days</th>
              </tr>
            </thead>
            <tbody>
              {farms.map((f, i) => (
                <tr key={i} onClick={() => navigate(`/domain/${encodeURIComponent(f.ferme)}`)} className="clickable-row">
                  <td className="farm-link">{f.ferme}</td>
                  <td>{f.group_name}</td>
                  <td style={{ fontWeight: '600' }}>{f.tonnage?.toLocaleString()}</td>
                  <td>{f.superficie?.toFixed(2)} ha</td>
                  <td style={{ color: (f.tonnage / f.superficie) > avgYield ? 'var(--accent)' : 'var(--accent-warning)', fontWeight: 'bold' }}>
                    {formatNum(f.tonnage / f.superficie)}
                  </td>
                  <td>{f.varieties}</td>
                  <td>{f.harvest_days}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
  const initialTab = searchParams.get('tab') === 'clubs' ? 'clubs' : 'groups'
  const [activeTab, setActiveTab] = useState(initialTab)

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab === 'clubs') setSearchParams({ tab: 'clubs' })
    else setSearchParams({})
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>📂 Segments Analytics</h2>
        <p className="subtitle">Analyze performance across Groups and Clubs</p>
      </div>

      <div className="segments-tabs">
        <button className={`tab-btn${activeTab === 'groups' ? ' tab-btn--active' : ''}`} onClick={() => handleTabChange('groups')}>
          📁 Groups
        </button>
        <button className={`tab-btn${activeTab === 'clubs' ? ' tab-btn--active' : ''}`} onClick={() => handleTabChange('clubs')}>
          🏠 Clubs
        </button>
      </div>

      {activeTab === 'groups' ? <GroupsTab /> : <ClubsTab />}
    </div>
  )
}

export default Segments
