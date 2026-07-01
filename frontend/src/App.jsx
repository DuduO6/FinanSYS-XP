import AuthPage from './pages/AuthPage.jsx'
import Achievements from './pages/Achievements.jsx'
import Categories from './pages/Categories.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Goals from './pages/Goals.jsx'
import Investments from './pages/Investments.jsx'
import Profile from './pages/Profile.jsx'
import Rankings from './pages/Rankings.jsx'
import Reports from './pages/Reports.jsx'
import Transactions from './pages/Transactions.jsx'
import { clearAuthToken, getAuthToken } from './services/authService.js'
import { useState } from 'react'
import faviconImage from './data/favicon.png'
import logoImage from './data/logo.png'
import './styles/App.css'
import './styles/DarkTheme.css'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'DB' },
  { id: 'transactions', label: 'Transações', shortLabel: 'TR' },
  { id: 'goals', label: 'Metas', shortLabel: 'MT' },
  { id: 'reports', label: 'Relatórios', shortLabel: 'RL' },
  { id: 'achievements', label: 'Conquistas', shortLabel: 'CQ' },
  { id: 'rankings', label: 'Rankings', shortLabel: 'RK' },
  { id: 'investments', label: 'Investimentos', shortLabel: 'IN' },
  { id: 'categories', label: 'Categorias', shortLabel: 'CT' },
  { id: 'profile', label: 'Perfil', shortLabel: 'PF' },
]

function isMobileViewport() {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 860px)').matches
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getAuthToken()))
  const [activePage, setActivePage] = useState('dashboard')
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => !isMobileViewport())

  function selectPage(pageId) {
    setActivePage(pageId)
    if (isMobileViewport()) {
      setIsSidebarOpen(false)
    }
  }

  function logout() {
    clearAuthToken()
    setIsAuthenticated(false)
    setActivePage('dashboard')
    setIsSidebarOpen(false)
  }

  if (!isAuthenticated) {
    return <AuthPage onSubmitAuth={() => setIsAuthenticated(true)} />
  }

  let page = <Dashboard />

  if (activePage === 'transactions') {
    page = <Transactions />
  }

  if (activePage === 'goals') {
    page = <Goals />
  }

  if (activePage === 'achievements') {
    page = <Achievements />
  }

  if (activePage === 'reports') {
    page = <Reports />
  }

  if (activePage === 'rankings') {
    page = <Rankings />
  }

  if (activePage === 'categories') {
    page = <Categories />
  }

  if (activePage === 'investments') {
    page = <Investments />
  }

  if (activePage === 'profile') {
    page = <Profile onLogout={logout} />
  }

  return (
    <div className={isSidebarOpen ? 'authenticated-shell' : 'authenticated-shell sidebar-collapsed'}>
      <button
        className="mobile-menu-button"
        type="button"
        aria-label="Abrir menu"
        aria-expanded={isSidebarOpen}
        onClick={() => setIsSidebarOpen(true)}
      >
        <span />
        <span />
        <span />
      </button>
      <button
        className="mobile-menu-backdrop"
        type="button"
        aria-label="Fechar menu"
        onClick={() => setIsSidebarOpen(false)}
      />
      <aside className="app-sidebar">
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <img className="sidebar-logo" src={logoImage} alt="FinanSYS XP" />
          </div>
          <button
            className="sidebar-toggle"
            type="button"
            aria-label={isSidebarOpen ? 'Fechar menu lateral' : 'Abrir menu lateral'}
            aria-expanded={isSidebarOpen}
            onClick={() => setIsSidebarOpen((current) => !current)}
          >
            {isSidebarOpen ? '<' : '>'}
          </button>
        </div>

        <div className="sidebar-brand collapsed-brand">
          <img className="sidebar-icon" src={faviconImage} alt="FinanSYS XP" />
        </div>

        <nav className="sidebar-nav" aria-label="Navegacao principal">
          {navItems.map((item) => (
            <button
              className={activePage === item.id ? 'active' : ''}
              key={item.id}
              type="button"
              onClick={() => selectPage(item.id)}
            >
              <span className="nav-short">{item.shortLabel}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <button className="sidebar-logout" type="button" onClick={logout}>
          <span className="nav-short">SA</span>
          <span className="nav-label">Sair</span>
        </button>
      </aside>

      <section className="authenticated-content">{page}</section>
    </div>
  )
}
