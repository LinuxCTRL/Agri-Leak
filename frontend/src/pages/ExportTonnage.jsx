import { useState, useEffect, useMemo } from 'react'
import { getExportTonnage, getExportAvailableQnz } from '../services/api'

function ExportTonnage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [availableQnz, setAvailableQnz] = useState([])
  const [selectedQnz, setSelectedQnz] = useState(null)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('export_total_all')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => {
    getExportAvailableQnz()
      .then((res) => {
        const qnzList = (res.data || []).sort((a, b) => b - a)
        setAvailableQnz(qnzList)
        if (qnzList.length && !selectedQnz) setSelectedQnz(qnzList[0])
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!selectedQnz) return
    setLoading(true)
    getExportTonnage({ qnz: selectedQnz })
      .then((res) => setData(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedQnz])

  const formatNum = (n) => {
    if (n == null) return '—'
    return n.toLocaleString('fr-FR', { maximumFractionDigits: 0 })
  }

  const formatDec = (n) => {
    if (n == null) return '—'
    return n.toFixed(2)
  }

  const formatPct = (n) => {
    if (n == null) return '—'
    return (n * 100).toFixed(1) + '%'
  }

  // ── Aggregates ──
  const filtered = useMemo(() => {
    if (!search) return data
    const q = search.toLowerCase()
    return data.filter(
      (r) =>
        (r.ferme || '').toLowerCase().includes(q) ||
        String(r.code || '').toLowerCase().includes(q) ||
        (r.type || '').toLowerCase().includes(q) ||
        (r.variety || '').toLowerCase().includes(q)
    )
  }, [data, search])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortField] ?? 0
      const bv = b[sortField] ?? 0
      return sortDir === 'desc' ? bv - av : av - bv
    })
  }, [filtered, sortField, sortDir])

  const handleSort = (field) => {
    setSortField(field)
    setSortDir((d) => (sortField === field && d === 'desc' ? 'asc' : 'desc'))
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span style={{ opacity: 0.25 }}> ↕</span>
    return <span style={{ color: 'var(--accent)' }}> {sortDir === 'desc' ? '↓' : '↑'}</span>
  }

  const totalFarms = new Set(data.map((r) => r.ferme)).size
  const sumQnz = data.reduce((s, r) => s + (r.tonnage_qnz || 0), 0)
  const sumCumul = data.reduce((s, r) => s + (r.tonnage_cumul || 0), 0)
  const sumExport = data.reduce((s, r) => s + (r.export_total_all || 0), 0)
  const sumLocal = data.reduce((s, r) => s + (r.export_local || 0), 0)
  const sumEcart = data.reduce((s, r) => s + (r.ecart_total || 0), 0)

  const cols = [
    { key: 'ferme', label: 'Domaine', align: 'left' },
    { key: 'code', label: 'Code' },
    { key: 'type', label: 'Type', align: 'left' },
    { key: 'variety', label: 'Variété', align: 'left' },
    { key: 'superficie', label: 'Superficie', fmt: formatDec },
    { key: 'tonnage_qnz', label: 'Total / Quinzaine', fmt: formatNum },
    { key: 'tonnage_cumul', label: 'Tonnage Cumulé', fmt: formatNum },
    { key: 'export_qnz', label: 'Export Quinzaine', fmt: formatNum },
    { key: 'export_qnz_ha', label: 'Export/Ha', fmt: formatNum },
    { key: 'export_cumul', label: 'Export Total', fmt: formatNum },
    { key: 'ecart_total', label: 'Écart Total', fmt: formatNum },
    { key: 'ecart_ha', label: 'Écart/Ha', fmt: formatNum },
    { key: 'ecart_pct', label: '% Écart', fmt: formatPct },
    { key: 'serre', label: 'Serre', align: 'left' },
    { key: 'export_local', label: 'Export Local', fmt: formatNum },
    { key: 'export_total_all', label: 'Total Export', fmt: formatNum },
  ]

  if (loading) return <div className="loading">Chargement Export...</div>

  return (
    <div className="page">
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <h2>📤 Export Tonnage</h2>
        <select
          value={selectedQnz ?? ''}
          onChange={(e) => setSelectedQnz(Number(e.target.value))}
          style={{
            padding: '10px 36px 10px 14px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface)',
            color: 'var(--text)',
            fontSize: '0.9rem',
            cursor: 'pointer',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 10px center',
          }}
        >
          {availableQnz.map((q) => (
            <option key={q} value={q}>QNZ {q}</option>
          ))}
        </select>
      </div>

      {/* ── Metrics ── */}
      <div className="metrics">
        <div className="metric">
          <span className="label">Domaines</span>
          <span className="value">{totalFarms}</span>
        </div>
        <div className="metric">
          <span className="label">Total / Quinzaine</span>
          <span className="value">{formatNum(sumQnz)} kg</span>
        </div>
        <div className="metric">
          <span className="label">Tonnage Cumulé</span>
          <span className="value">{formatNum(sumCumul)} kg</span>
        </div>
        <div className="metric">
          <span className="label">Total Export</span>
          <span className="value">{formatNum(sumExport)} kg</span>
        </div>
      </div>

      <div className="metrics">
        <div className="metric">
          <span className="label">Export Local</span>
          <span className="value">{formatNum(sumLocal)} kg</span>
        </div>
        <div className="metric">
          <span className="label">Écart Total</span>
          <span className="value">{formatNum(sumEcart)} kg</span>
        </div>
        <div className="metric">
          <span className="label">Export %</span>
          <span className="value">
            {sumCumul > 0 ? ((sumExport / sumCumul) * 100).toFixed(1) : 0}%
          </span>
        </div>
        <div className="metric">
          <span className="label">Lignes</span>
          <span className="value">{filtered.length}</span>
        </div>
      </div>

      {/* ── Search ── */}
      <div style={{ marginBottom: 24 }}>
        <input
          type="text"
          placeholder="Rechercher domaine, code, type, variété..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '10px 14px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface)',
            color: 'var(--text)',
            fontSize: '0.9rem',
            width: '100%',
            maxWidth: 420,
            outline: 'none',
          }}
        />
      </div>

      {/* ── Table ── */}
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table" style={{ fontSize: '0.82rem' }}>
          <thead>
            <tr>
              {cols.map((c) => (
                <th
                  key={c.key}
                  onClick={() => handleSort(c.key)}
                  style={{
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    textAlign: c.align || 'right',
                  }}
                >
                  {c.label}
                  <SortIcon field={c.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr key={i}>
                {cols.map((c) => {
                  const val = row[c.key]
                  const display = c.fmt ? c.fmt(val) : (val ?? '—')
                  const isLeft = c.align === 'left'
                  return (
                    <td
                      key={c.key}
                      style={{
                        whiteSpace: 'nowrap',
                        textAlign: isLeft ? 'left' : 'right',
                        fontFamily: isLeft ? 'inherit' : 'var(--font-heading)',
                        fontWeight: c.key === 'ferme' ? 600 : 'inherit',
                        color: c.key === 'ferme' ? 'var(--accent)' : 'inherit',
                      }}
                    >
                      {display}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          Aucune donnée
        </div>
      )}
    </div>
  )
}

export default ExportTonnage
