import { lazy, Suspense, useState } from 'react'
import {
  Menu,
  Bell,
  RefreshCw,
  Monitor,
  LogOut,
} from 'lucide-react'

import Sidebar from './components/Sidebar'
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Produits = lazy(() => import('./pages/Produits'))
const Categories = lazy(() => import('./pages/Categories'))
const Stock = lazy(() => import('./pages/Stock'))
const Promotions = lazy(() => import('./pages/Promotions'))
const Statistiques = lazy(() => import('./pages/Statistiques'))
const Parametres = lazy(() => import('./pages/Parametres'))
const CentreAide = lazy(() => import('./pages/CentreAide'))
import Login from './pages/Login'

import './App.css'

type AuthSession = {
  token: string
  email: string
  expiresAt: number
}

function readSession(): AuthSession | null {
  try {
    const token = sessionStorage.getItem('mediatech_token')
    const email = sessionStorage.getItem('mediatech_email') || ''
    const expiresAt = Number(sessionStorage.getItem('mediatech_expiresAt'))

    if (token && Number.isFinite(expiresAt) && expiresAt > Date.now()) {
      return { token, email, expiresAt }
    }

    sessionStorage.removeItem('mediatech_token')
    sessionStorage.removeItem('mediatech_email')
    sessionStorage.removeItem('mediatech_expiresAt')
  } catch {
    // Si le stockage du navigateur est indisponible, demander une connexion.
  }

  return null
}

const pages = [
  'Dashboard',
  'Produits',
  'Catégories',
  'Stock',
  'Promotions',
  'Statistiques',
  'Paramètres',
  'Centre d’aide',
]

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(() => readSession())
  const [activePage, setActivePage] = useState('Dashboard')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleLogin(token: string, email: string, expiresAt: string) {
    const expiration = Date.parse(expiresAt)

    if (!Number.isFinite(expiration) || expiration <= Date.now()) {
      return
    }

    const nextSession = { token, email, expiresAt: expiration }

    try {
      sessionStorage.setItem('mediatech_token', token)
      sessionStorage.setItem('mediatech_email', email)
      sessionStorage.setItem('mediatech_expiresAt', String(expiration))
    } catch {
      // La session reste active dans l'état React pendant cette visite.
    }

    setSession(nextSession)
    setActivePage('Dashboard')
  }

  function handleLogout() {
    try {
      sessionStorage.removeItem('mediatech_token')
      sessionStorage.removeItem('mediatech_email')
      sessionStorage.removeItem('mediatech_expiresAt')
    } catch {
      // Nettoyage du stockage non disponible.
    }

    setSession(null)
    setActivePage('Dashboard')
    setMobileOpen(false)
  }

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
      case 'Promotions':
        return <Promotions />
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

  if (!session) {
    return <Login onLogin={handleLogin} />
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

            <span className="topbar-user-email" title={session.email}>
              {session.email}
            </span>

            <div className="topbar-avatar">MT</div>

            <button
              type="button"
              className="topbar-logout"
              onClick={handleLogout}
              title="Se déconnecter"
              aria-label="Se déconnecter"
            >
              <LogOut size={16} />
              <span>Déconnexion</span>
            </button>
          </div>
        </header>

        <main className="dashboard-content">
          <Suspense fallback={<div className="page-loading" role="status">Chargement de la page...</div>}>
            {renderPage()}
          </Suspense>

          <footer className="dashboard-footer">
            <span>
              © {new Date().getFullYear()} MediaTech. Tous droits réservés.
            </span>
            <span>Administration du catalogue</span>
          </footer>
        </main>
      </div>
    </div>
  )
}

