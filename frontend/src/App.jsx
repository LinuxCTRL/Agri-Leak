import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useCallback } from 'react'
import Dashboard from './pages/Dashboard'
import Segments from './pages/Segments'
import CostPerTon from './pages/CostPerTon'
import Domain from './pages/Domain'
import Domains from './pages/Domains'
import Productivity from './pages/Productivity'
import CostBreakdown from './pages/CostBreakdown'
import Comparison from './pages/Comparison'
import Varieties from './pages/Varieties'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import ChatPopup from './components/ChatPopup'
import { QnzProvider } from './context/QnzContext'
import './App.css'

function AppContent() {
  const [sidebarWidth, setSidebarWidth] = useState(240)

  const handleWidthChange = useCallback((w) => {
    setSidebarWidth(w)
  }, [])

  return (
    <BrowserRouter>
      <div className="app">
        <Sidebar onWidthChange={handleWidthChange} />
        <Topbar sidebarWidth={sidebarWidth} />
        <main
          className="content"
          style={{ marginLeft: sidebarWidth }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/productivity" element={<Productivity />} />
            <Route path="/varieties" element={<Varieties />} />
            <Route path="/domains" element={<Domains />} />
            <Route path="/segments" element={<Segments />} />
            <Route path="/comparison" element={<Comparison />} />
            <Route path="/groups" element={<Navigate to="/segments" replace />} />
            <Route path="/clubs" element={<Navigate to="/segments?tab=clubs" replace />} />
            <Route path="/cost-per-ton" element={<CostPerTon />} />
            <Route path="/cost-breakdown" element={<CostBreakdown />} />
            <Route path="/domain/:ferme" element={<Domain />} />
          </Routes>
          <ChatPopup />
        </main>
      </div>
    </BrowserRouter>
  )
}

function App() {
  return (
    <QnzProvider>
      <AppContent />
    </QnzProvider>
  )
}

export default App
