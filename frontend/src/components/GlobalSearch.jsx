import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFarms, getGroups, getClubs, getVarieties } from '../services/api'
import { useQnz } from '../context/QnzContext'

function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [searchIndex, setSearchIndex] = useState([])
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const { selectedQnz } = useQnz()

  // Rebuild index whenever selectedQnz changes
  useEffect(() => {
    const params = selectedQnz ? { qnz: selectedQnz } : {}
    Promise.all([getFarms(params), getGroups(params), getClubs(params), getVarieties(params)])
      .then(([farmsRes, groupsRes, clubsRes, varRes]) => {
        const index = []
        farmsRes.data.forEach(f => index.push({ name: f.ferme, type: 'Farm', icon: '🏡', path: `/domain/${encodeURIComponent(f.ferme)}` }))
        groupsRes.data.forEach(g => index.push({ name: g, type: 'Group', icon: '📁', path: `/segments` }))
        clubsRes.data.forEach(c => index.push({ name: c, type: 'Club', icon: '🏠', path: `/segments?tab=clubs` }))
        varRes.data.forEach(v => index.push({ name: v.variety, type: `Variety · ${v.type}`, icon: '🍅', path: `/varieties` }))
        setSearchIndex(index)
      })
      .catch(e => console.error('Failed to build search index', e))
  }, [selectedQnz])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleChange = (e) => {
    const val = e.target.value
    setQuery(val)
    setActiveIndex(-1)
    if (!val.trim()) {
      setResults([])
      setIsOpen(false)
      return
    }
    const term = val.toLowerCase()
    const matches = searchIndex.filter(item => item.name.toLowerCase().includes(term))
    setResults(matches.slice(0, 8))
    setIsOpen(true)
  }

  const handleSelect = useCallback((item) => {
    navigate(item.path)
    setQuery('')
    setIsOpen(false)
    setActiveIndex(-1)
  }, [navigate])

  const handleKeyDown = (e) => {
    if (!isOpen) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      handleSelect(results[activeIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setActiveIndex(-1)
      inputRef.current?.blur()
    }
  }

  return (
    <div className="global-search" ref={wrapperRef}>
      <div className="search-input-wrapper">
        <span className="search-icon-input">🔍</span>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search farms, varieties..."
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query && results.length > 0 && setIsOpen(true)}
          autoComplete="off"
        />
        {query && (
          <button
            className="search-clear-btn"
            onClick={() => { setQuery(''); setResults([]); setIsOpen(false); inputRef.current?.focus() }}
            aria-label="Clear search"
          >×</button>
        )}
      </div>
      {isOpen && (
        <div className="search-dropdown">
          {results.length > 0 ? results.map((item, i) => (
            <div
              key={i}
              className={`search-item${i === activeIndex ? ' search-item--active' : ''}`}
              onMouseDown={() => handleSelect(item)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <span className="search-icon">{item.icon}</span>
              <div className="search-details">
                <div className="search-name">{item.name}</div>
                <div className="search-type">{item.type}</div>
              </div>
            </div>
          )) : (
            <div className="search-empty">No results for "{query}"</div>
          )}
        </div>
      )}
    </div>
  )
}

export default GlobalSearch
