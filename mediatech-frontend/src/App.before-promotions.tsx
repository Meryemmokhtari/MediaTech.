import { useState } from 'react'
import {
  Menu,
  Bell,
  RefreshCw,
  Monitor,
} from 'lucide-react'

import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Produits from './pages/Produits'
import Categories from './pages/Categories'
import Stock from './pages/Stock'
import Statistiques from './pages/Statistiques'
import Parametres from './pages/Parametres'
import CentreAide from './pages/CentreAide'

import './App.css'

const pages = [
  'Dashboard',
  'Produits',
  'Catégories',
  'Stock',
  'Statistiques',
  'Paramètres',
  'Centre d’aide',
]

export default function App() {
  const [activePage, setActivePage] = useState('Dashboard')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  function navigate(page: string) {
    if (pages.includes(page)) {
      setActivePage(page)
    }
    setMobileOpen(false)
  }

  function renderPage() {
    switch (activePage) {
      case 'Produits':
        return <Produits />
      case 'Catégories':
        return <Categories />
      case 'Stock':
        return <Stock />
      case 'Statistiques':
        return <Statistiques />
      case 'Paramètres':
        return <Parametres />
      case 'Centre d’aide':
        return <CentreAide />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className={`admin-app ${collapsed ? 'sidebar-is-collapsed' : ''}`}>
      <Sidebar
        activePage={activePage}
        onNavigate={navigate}
        collapsed={collapsed}
        onToggle={() => setCollapsed(value => !value)}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="mobile-menu"
            aria-label="Ouvrir le menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={21} />
          </button>

          <div className="breadcrumb">
            <span className="breadcrumb-brand">
              <Monitor size={17} />
              MediaTech
            </span>
            <span className="breadcrumb-separator">/</span>
            <strong>{activePage}</strong>
          </div>

          <div className="topbar-actions">
            <span className="connection-pill">
              <span className="connection-dot" />
              Administration
            </span>
            <button
              type="button"
              className="icon-button"
              title="Actualiser la page"
              aria-label="Actualiser la page"
              onClick={() => window.location.reload()}
            >
              <RefreshCw size={17} />
            </button>
            <button
              type="button"
              className="icon-button"
              title="Accéder aux alertes de stock"
              aria-label="Accéder aux alertes de stock"
              onClick={() => navigate('Stock')}
            >
              <Bell size={18} />
            </button>
            <div className="topbar-avatar">MT</div>
          </div>
        </header>

        <main className="dashboard-content">
          {renderPage()}
          <footer className="dashboard-footer">
            <span>© {new Date().getFullYear()} MediaTech. Tous droits réservés.</span>
            <span>Administration du catalogue</span>
          </footer>
        </main>
      </div>
    </div>
  )
}
