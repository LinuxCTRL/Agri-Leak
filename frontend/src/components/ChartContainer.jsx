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
      // Match current theme background
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--surface') || 'white'
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

  const toggleFullscreen = (e) => {
    if (e) e.stopPropagation()
    setIsFullscreen(!isFullscreen)
  }

  return (
    <>
      <div className="chart" ref={chartRef}>
        <div className="chart-container-header">
          <h3 style={{ margin: 0 }}>{title}</h3>
          <div className="chart-actions">
            <button
              className="chart-action-btn"
              onClick={exportToPNG}
              title="Export as PNG"
            >
              📷
            </button>
            {data && (
              <button
                className="chart-action-btn"
                onClick={exportToCSV}
                title="Export data as CSV"
              >
                📊
              </button>
            )}
            <button
              className="chart-action-btn"
              onClick={toggleFullscreen}
              title="Fullscreen"
            >
              ⛶
            </button>
          </div>
        </div>
        <div className="chart-content">
          {children}
        </div>
      </div>

      {/* Fullscreen modal */}
      {isFullscreen && (
        <div className="chart-fullscreen-overlay" onClick={toggleFullscreen}>
          <div className="chart-fullscreen-header">
            <h2 className="chart-fullscreen-title">{title}</h2>
            <button className="chart-fullscreen-close" onClick={toggleFullscreen}>
              ✕
            </button>
          </div>
          <div className="chart-fullscreen-content" onClick={e => e.stopPropagation()}>
            {children}
          </div>
        </div>
      )}
    </>
  )
}

export default ChartContainer
