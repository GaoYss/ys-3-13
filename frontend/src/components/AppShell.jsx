export function AppShell({ activePage, navItems, onNavigate, title, subtitle, headerIcon: HeaderIcon, children }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <HeaderIcon size={24} />
          <div>
            <strong>{title}</strong>
            <span>{subtitle}</span>
          </div>
        </div>
        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.key}
                className={activePage === item.key ? 'nav-item active' : 'nav-item'}
                onClick={() => onNavigate(item.key)}
                type="button"
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  )
}
