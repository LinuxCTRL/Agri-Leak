import { useState, useEffect, useRef } from 'react'
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
  Cell,
} from 'recharts'
import { getQnzComparison, getAvailableQnz } from '../services/api'
import { tooltipProps, axisTick, ACCENT, ACCENT_WARNING } from '../utils/chartTheme'

/* ─── Color palette for bars ─── */
const BAR_COLORS = [
  '#0d9488', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
  '#3b82f6', '#a855f7', '#e11d48', '#10b981', '#eab308',
  '#64748b', '#0ea5e9', '#d946ef', '#22c55e', '#f43f5e',
  '#38bdf8', '#c084fc',
]

function Comparison() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [availableQnz, setAvailableQnz] = useState([])
  const [selectedQnz, setSelectedQnz] = useState([])
  const [cumulative, setCumulative] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchQnz, setSearchQnz] = useState('')
  const dropdownRef = useRef(null)

  useEffect(() => {
    Promise.all([getQnzComparison(), getAvailableQnz()])
      .then(([compRes, qnzRes]) => {
        setData(compRes.data)
        setAvailableQnz(qnzRes.data)
        setSelectedQnz(qnzRes.data)
      })
      .catch((err) => console.error('Error fetching comparison data:', err))
      .finally(() => setLoading(false))
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleExport = () => {
    const filteredData = cumulative
      ? [
          data.reduce(
            (acc, d) => ({
              qnz: 'Cumulative',
              total_tonnage: (acc.total_tonnage || 0) + (d.total_tonnage || 0),
              total_cost: (acc.total_cost || 0) + (d.total_cost || 0),
            }),
            {},
          ),
        ]
      : data.filter((d) => selectedQnz.includes(d.qnz))

    const csv = [
      ['Quinzaine', 'Total Tonnage (kg)', 'Total Cost (MAD)', 'Cost per Ton (MAD/t)', 'Efficiency (kg/MAD)'],
      ...filteredData.map((d) => [
        d.qnz,
        d.total_tonnage || 0,
        d.total_cost || 0,
        d.cost_per_ton ? d.cost_per_ton.toFixed(2) : '',
        d.total_cost > 0 ? (d.total_tonnage / d.total_cost).toFixed(3) : '',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `qnz_comparison${cumulative ? '_cumulative' : '_selected'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleQnz = (qnz) => {
    setSelectedQnz((prev) => (prev.includes(qnz) ? prev.filter((q) => q !== qnz) : [...prev, qnz].sort((a, b) => a - b)))
  }

  const selectAll = () => setSelectedQnz(availableQnz)
  const clearAll = () => setSelectedQnz([])

  // Filtered QNZ list for dropdown search
  const filteredAvailable = availableQnz.filter((q) => String(q).includes(searchQnz))

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
        <span>Loading Comparison…</span>
      </div>
    )
  }

  const displayedData = cumulative
    ? [
        data
          .filter((d) => d.total_tonnage != null)
          .reduce(
            (acc, d) => ({
              qnz: 'Cumulative (QNZ 1→22)',
              total_tonnage: (acc.total_tonnage || 0) + (d.total_tonnage || 0),
              total_cost: (acc.total_cost || 0) + (d.total_cost || 0),
              farms_count: acc.farms_count || 0,
              domains_count: acc.domains_count || 0,
            }),
            {},
          ),
      ]
    : data.filter((d) => selectedQnz.includes(d.qnz) && d.total_tonnage != null).sort((a, b) => a.qnz - b.qnz)

  const formatNum = (n) => {
    if (n == null) return '—'
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return n.toFixed(0)
  }

  const formatMoney = (n) => {
    if (n == null) return '—'
    if (n >= 1000000) return (n / 1000000).toFixed(1) + ' M MAD'
    if (n >= 1000) return (n / 1000).toFixed(1) + ' K MAD'
    return n.toFixed(0) + ' MAD'
  }

  if (displayedData.length === 0 && !cumulative) {
    return (
      <div className="page comparison-page">
        <h2>📈 QNZ Performance Comparison</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 30 }}>
          Compare total production (tonnage) vs total expenditure (costs) across selected quinzaines.
        </p>

        {/* Show selector even when nothing selected */}
        <div className="comparison-controls">
          <div className="comparison-mode-toggle">
            <button
              className={`comparison-mode-btn ${!cumulative ? 'comparison-mode-btn--active' : ''}`}
              onClick={() => setCumulative(false)}
            >
              Compare Selected
            </button>
            <button
              className={`comparison-mode-btn ${cumulative ? 'comparison-mode-btn--active' : ''}`}
              onClick={() => setCumulative(true)}
            >
              Cumulative View
            </button>
          </div>

          <div className="comparison-multiselect" ref={dropdownRef}>
            <div
              className="comparison-multiselect-trigger"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="comparison-chips">
                {selectedQnz.length === 0 ? (
                  <span className="comparison-placeholder">Select QNZs to compare…</span>
                ) : (
                  selectedQnz.map((q) => (
                    <span key={q} className="comparison-chip">
                      QNZ {q}
                      <button
                        className="comparison-chip-remove"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleQnz(q)
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
              <span className="comparison-multiselect-arrow">▾</span>
            </div>

            {dropdownOpen && (
              <div className="comparison-multiselect-dropdown">
                <div className="comparison-multiselect-search">
                  <input
                    type="text"
                    placeholder="Search QNZ…"
                    value={searchQnz}
                    onChange={(e) => setSearchQnz(e.target.value)}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="comparison-multiselect-options">
                  {filteredAvailable.map((q) => (
                    <label
                      key={q}
                      className={`comparison-multiselect-option ${selectedQnz.includes(q) ? 'comparison-multiselect-option--checked' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedQnz.includes(q)}
                        onChange={() => toggleQnz(q)}
                      />
                      <span className="comparison-option-label">QNZ {q}</span>
                    </label>
                  ))}
                  {filteredAvailable.length === 0 && (
                    <div className="comparison-multiselect-empty">No QNZ found</div>
                  )}
                </div>
                <div className="comparison-multiselect-actions">
                  <button onClick={selectAll}>Select All</button>
                  <button onClick={clearAll}>Clear</button>
                </div>
              </div>
            )}
          </div>

          <button className="comparison-export-btn" onClick={handleExport}>
            📥 Export CSV
          </button>
        </div>

        <div className="comparison-empty-state">
          <span style={{ fontSize: 48 }}>📊</span>
          <h3>No QNZ selected</h3>
          <p>Select one or more quinzaines from the dropdown above to see the comparison.</p>
        </div>
      </div>
    )
  }

  // Build chart data
  const chartData = displayedData.map((d) => ({
    name: cumulative ? 'Cumulative' : `QNZ ${d.qnz}`,
    qnz: d.qnz,
    tonnage: d.total_tonnage,
    cost: d.total_cost,
    costPerTon: d.cost_per_ton,
  }))

  // Summary stats
  const bestTonnage = [...displayedData].sort((a, b) => (b.total_tonnage || 0) - (a.total_tonnage || 0))[0]
  const bestCostPerTon = [...displayedData].sort((a, b) => (a.cost_per_ton || Infinity) - (b.cost_per_ton || Infinity))[0]
  const totalTonnage = displayedData.reduce((s, d) => s + (d.total_tonnage || 0), 0)
  const totalCost = displayedData.reduce((s, d) => s + (d.total_cost || 0), 0)

  return (
    <div className="page comparison-page">
      <div className="comparison-header">
        <div>
          <h2>📈 QNZ Performance Comparison</h2>
          <p className="comparison-subtitle">
            Compare total production (tonnage) vs total expenditure (costs) across selected quinzaines.
          </p>
        </div>
        <button className="comparison-export-btn" onClick={handleExport}>
          📥 Export CSV
        </button>
      </div>

      {/* ── Mode Toggle ── */}
      <div className="comparison-mode-toggle">
        <button
          className={`comparison-mode-btn ${!cumulative ? 'comparison-mode-btn--active' : ''}`}
          onClick={() => setCumulative(false)}
        >
          <span className="comparison-mode-icon">🔀</span>
          Compare Selected
          <span className="comparison-mode-badge">{selectedQnz.length}</span>
        </button>
        <button
          className={`comparison-mode-btn ${cumulative ? 'comparison-mode-btn--active' : ''}`}
          onClick={() => setCumulative(true)}
        >
          <span className="comparison-mode-icon">➕</span>
          Cumulative View
        </button>
      </div>

      {/* ── QNZ Selector (only in compare mode) ── */}
      {!cumulative && (
        <div className="comparison-multiselect" ref={dropdownRef}>
          <div className="comparison-multiselect-trigger" onClick={() => setDropdownOpen(!dropdownOpen)}>
            <div className="comparison-chips">
              {selectedQnz.length === 0 ? (
                <span className="comparison-placeholder">Select QNZs to compare…</span>
              ) : (
                selectedQnz.map((q) => (
                  <span key={q} className="comparison-chip">
                    QNZ {q}
                    <button
                      className="comparison-chip-remove"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleQnz(q)
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
            <div className="comparison-multiselect-meta">
              <span className="comparison-multiselect-count">{selectedQnz.length} / {availableQnz.length}</span>
              <span className="comparison-multiselect-arrow">{dropdownOpen ? '▴' : '▾'}</span>
            </div>
          </div>

          {dropdownOpen && (
            <div className="comparison-multiselect-dropdown">
              <div className="comparison-multiselect-search">
                <span className="comparison-search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Filter quinzaines…"
                  value={searchQnz}
                  onChange={(e) => setSearchQnz(e.target.value)}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
                {searchQnz && (
                  <button className="comparison-search-clear" onClick={() => setSearchQnz('')}>
                    ×
                  </button>
                )}
              </div>
              <div className="comparison-multiselect-options">
                {filteredAvailable.map((q) => (
                  <label
                    key={q}
                    className={`comparison-multiselect-option ${selectedQnz.includes(q) ? 'comparison-multiselect-option--checked' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedQnz.includes(q)}
                      onChange={() => toggleQnz(q)}
                    />
                    <span className="comparison-option-label">QNZ {q}</span>
                    {selectedQnz.includes(q) && <span className="comparison-option-check">✓</span>}
                  </label>
                ))}
                {filteredAvailable.length === 0 && (
                  <div className="comparison-multiselect-empty">No matching quinzaines</div>
                )}
              </div>
              <div className="comparison-multiselect-actions">
                <button onClick={selectAll} className="comparison-action-btn">
                  Select All
                </button>
                <button onClick={clearAll} className="comparison-action-btn comparison-action-btn--danger">
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Summary Cards ── */}
      {!cumulative && displayedData.length >= 2 && (
        <div className="comparison-summary">
          <div className="comparison-summary-card">
            <span className="comparison-summary-label">🏆 Best Tonnage</span>
            <span className="comparison-summary-value">
              QNZ {bestTonnage?.qnz}
            </span>
            <span className="comparison-summary-detail">
              {bestTonnage?.total_tonnage?.toLocaleString()} kg
            </span>
          </div>
          <div className="comparison-summary-card">
            <span className="comparison-summary-label">💰 Best Cost / Ton</span>
            <span className="comparison-summary-value">
              QNZ {bestCostPerTon?.qnz}
            </span>
            <span className="comparison-summary-detail">
              {bestCostPerTon?.cost_per_ton?.toFixed(2)} MAD/t
            </span>
          </div>
          <div className="comparison-summary-card">
            <span className="comparison-summary-label">📦 Combined Tonnage</span>
            <span className="comparison-summary-value">
              {totalTonnage.toLocaleString()} kg
            </span>
            <span className="comparison-summary-detail">
              across {displayedData.length} quinzaines
            </span>
          </div>
          <div className="comparison-summary-card">
            <span className="comparison-summary-label">💸 Combined Cost</span>
            <span className="comparison-summary-value">
              {totalCost.toLocaleString()} MAD
            </span>
            <span className="comparison-summary-detail">
              avg {totalTonnage > 0 ? (totalCost / totalTonnage).toFixed(2) : '—'} MAD/ton
            </span>
          </div>
        </div>
      )}

      {/* ── Chart ── */}
      <div className="comparison-chart">
        <div className="comparison-chart-header">
          <h3>{cumulative ? 'Cumulative Overview' : `Comparing ${displayedData.length} Quinzaines`}</h3>
          <span className="comparison-chart-hint">Hover bars for details — bar width represents tonnage, line shows cost</span>
        </div>
        <div style={{ height: 420 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, bottom: 10, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" tick={axisTick} angle={chartData.length > 8 ? -35 : 0} textAnchor={chartData.length > 8 ? 'end' : 'middle'} height={chartData.length > 8 ? 60 : 30} />
              <YAxis
                yId="left"
                tick={axisTick}
                tickFormatter={formatNum}
                label={{
                  value: 'Tonnage (kg)',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: 'var(--text-muted)', fontSize: 12 },
                }}
              />
              <YAxis
                yId="right"
                orientation="right"
                tick={axisTick}
                tickFormatter={formatNum}
                label={{
                  value: 'Cost (MAD)',
                  angle: 90,
                  position: 'insideRight',
                  style: { fill: 'var(--text-muted)', fontSize: 12 },
                }}
              />
              <Tooltip
                {...tooltipProps}
                formatter={(v, name) => {
                  if (name === 'Tonnage') return [v.toLocaleString() + ' kg', name]
                  if (name === 'Cost') return [v.toLocaleString() + ' MAD', name]
                  return [v.toFixed(2) + ' MAD/ton', name]
                }}
              />
              <Legend wrapperStyle={{ paddingTop: 10 }} />
              <Bar yId="left" dataKey="tonnage" name="Tonnage" radius={[6, 6, 0, 0]} barSize={chartData.length > 12 ? 16 : 32}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} fillOpacity={0.85} />
                ))}
              </Bar>
              <Line
                yId="right"
                type="monotone"
                dataKey="cost"
                name="Cost"
                stroke={ACCENT_WARNING}
                strokeWidth={2.5}
                dot={{ r: 5, fill: ACCENT_WARNING, strokeWidth: 0 }}
                activeDot={{ r: 7 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Cost per Ton Chart ── */}
      {!cumulative && displayedData.length >= 2 && (
        <div className="comparison-chart">
          <div className="comparison-chart-header">
            <h3>💡 Cost per Ton Comparison</h3>
            <span className="comparison-chart-hint">Lower is better — indicates more efficient spending</span>
          </div>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 30, bottom: 10, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" tick={axisTick} angle={chartData.length > 8 ? -35 : 0} textAnchor={chartData.length > 8 ? 'end' : 'middle'} height={chartData.length > 8 ? 60 : 30} />
                <YAxis tick={axisTick} tickFormatter={(v) => v.toFixed(0) + ' MAD'} />
                <Tooltip
                  {...tooltipProps}
                  formatter={(v) => [v.toFixed(2) + ' MAD/ton', 'Cost per Ton']}
                />
                <Bar dataKey="costPerTon" name="Cost per Ton" radius={[6, 6, 0, 0]} barSize={chartData.length > 12 ? 16 : 36}>
                  {chartData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={BAR_COLORS[i % BAR_COLORS.length]}
                      fillOpacity={0.75}
                    />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Detailed Table ── */}
      <div className="comparison-table-section">
        <h3>Detailed Comparison Table</h3>
        <div className="comparison-table-wrapper">
          <table className="data-table comparison-data-table">
            <thead>
              <tr>
                <th>Quinzaine</th>
                <th>Total Tonnage (kg)</th>
                <th>Total Cost (MAD)</th>
                <th>Cost per Ton (MAD/t)</th>
                <th>Efficiency (kg/MAD)</th>
                <th>% of Combined</th>
              </tr>
            </thead>
            <tbody>
              {displayedData.map((d, i) => {
                const pctOfTotal = totalTonnage > 0 ? ((d.total_tonnage || 0) / totalTonnage * 100).toFixed(1) : '—'
                return (
                  <tr key={i}>
                    <td>
                      <span className="comparison-table-qnz" style={{ '--bar-color': BAR_COLORS[i % BAR_COLORS.length] }}>
                        QNZ {d.qnz}
                      </span>
                    </td>
                    <td>{d.total_tonnage?.toLocaleString()}</td>
                    <td>{d.total_cost?.toLocaleString()}</td>
                    <td className="comparison-cell-cost">
                      {d.cost_per_ton?.toFixed(2)}
                    </td>
                    <td className="comparison-cell-efficiency">
                      {d.total_cost > 0 ? (d.total_tonnage / d.total_cost).toFixed(3) : '—'}
                    </td>
                    <td>
                      <div className="comparison-pct-bar">
                        <div
                          className="comparison-pct-fill"
                          style={{ width: `${Math.min(Number(pctOfTotal) || 0, 100)}%`, background: BAR_COLORS[i % BAR_COLORS.length] }}
                        />
                        <span>{pctOfTotal}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {/* Total row */}
              {!cumulative && displayedData.length > 1 && (
                <tr className="comparison-total-row">
                  <td><strong>Combined</strong></td>
                  <td><strong>{totalTonnage.toLocaleString()}</strong></td>
                  <td><strong>{totalCost.toLocaleString()}</strong></td>
                  <td className="comparison-cell-cost">
                    <strong>{(totalCost / totalTonnage).toFixed(2)}</strong>
                  </td>
                  <td className="comparison-cell-efficiency">
                    <strong>{(totalTonnage / totalCost).toFixed(3)}</strong>
                  </td>
                  <td><strong>100%</strong></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Comparison
