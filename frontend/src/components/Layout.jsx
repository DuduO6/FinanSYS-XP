export default function Layout({ children }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <strong>FinanSYS XP</strong>
        <nav>
          <a href="/">Dashboard</a>
          <a href="/">Transações</a>
          <a href="/">Metas</a>
          <a href="/">Relatórios</a>
          <a href="/">Conquistas</a>
          <a href="/">Perfil</a>
        </nav>
      </aside>

      <div className="content-shell">
        <header className="topbar">
          <h1>FinanSYS XP</h1>
        </header>

        <main className="main-content">{children}</main>
      </div>
    </div>
  )
}
