import { useState, useRef } from 'react'

function ChartContainer({ title, children, data, filename }) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const chartRef = useRef(null)

  const exportToPNG = () => {
    const svg = chartRef.current?.querySelector('svg')
    if (!svg) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const svgData = new XMLSerializer().serializeToString(svg)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    
    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      
      canvas.toBlob(blob => {
        const link = document.createElement('a')
        link.download = `${filename || title.replace(/\s+/g, '_')}.png`
        link.href = URL.createObjectURL(blob)
        link.click()
        URL.revokeObjectURL(link.href)
      })
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  const exportToCSV = () => {
    if (!data || !Array.isArray(data)) return
    
    const headers = Object.keys(data[0] || {})
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const link = document.createElement('a')
    link.download = `${filename || title.replace(/\s+/g, '_')}_data.csv`
    link.href = URL.createObjectURL(blob)
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  return (
    <>
      <div className="chart" ref={chartRef} style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={exportToPNG}
              title="Export as PNG"
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: 4,
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                color: 'var(--text-muted)'
              }}
            >📷</button>
            {data && (
              <button
                onClick={exportToCSV}
                title="Export data as CSV"
                style={{
                  background: 'none',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)'
                }}
              >📊</button>
            )}
            <button
              onClick={toggleFullscreen}
              title="Fullscreen"
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: 4,
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                color: 'var(--text-muted)'
              }}
            >⛶</button>
          </div>
        </div>
        {children}
      </div>

      {/* Fullscreen modal */}
      {isFullscreen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            padding: 20
          }}
          onClick={toggleFullscreen}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ color: 'white', margin: 0 }}>{title}</h2>
            <button
              onClick={toggleFullscreen}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 4,
                padding: '8px 12px',
                cursor: 'pointer',
                color: 'white',
                fontSize: '1rem'
              }}
            >✕</button>
          </div>
          <div
            style={{ flex: 1, background: 'white', borderRadius: 8, padding: 20 }}
            onClick={e => e.stopPropagation()}
          >
            {children}
          </div>
        </div>
      )}
    </>
  )
}

export default ChartContainer