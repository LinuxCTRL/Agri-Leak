import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Groups from './pages/Groups'
import Clubs from './pages/Clubs'
import CostPerTon from './pages/CostPerTon'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="sidebar">
          <h1>🌱 Agri Data Lake</h1>
          <ul>
            <li><Link to="/">📊 Dashboard</Link></li>
            <li><Link to="/groups">📁 Groups</Link></li>
            <li><Link to="/clubs">🏠 Clubs</Link></li>
            <li><Link to="/cost-per-ton">📈 Cost/Ton</Link></li>
          </ul>
        </nav>
        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/clubs" element={<Clubs />} />
            <Route path="/cost-per-ton" element={<CostPerTon />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App