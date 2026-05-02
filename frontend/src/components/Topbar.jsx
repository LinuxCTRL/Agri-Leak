import GlobalSearch from './GlobalSearch'

function Topbar({ sidebarWidth }) {
  return (
    <div className="topbar" style={{ left: sidebarWidth }}>
      <GlobalSearch />
    </div>
  )
}

export default Topbar
