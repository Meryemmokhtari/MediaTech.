import {
  LayoutDashboard,
  Package,
  Tags,
  Boxes,
  BadgePercent,
  BarChart3,
  Settings,
  CircleHelp,
  Monitor,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import './Sidebar.css'

type SidebarProps = {
  activePage: string
  onNavigate: (page: string) => void
  collapsed?: boolean
  onToggle?: () => void
  mobileOpen?: boolean
  onClose?: () => void
}

const navigation = [
  {
    title: 'MENU PRINCIPAL',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard },
      { label: 'Produits', icon: Package },
      { label: 'Catégories', icon: Tags },
      { label: 'Stock', icon: Boxes },
      { label: 'Promotions', icon: BadgePercent },
      { label: 'Statistiques', icon: BarChart3 },
    ],
  },
  {
    title: 'PRÉFÉRENCES',
    items: [
      { label: 'Paramètres', icon: Settings },
      { label: 'Centre d’aide', icon: CircleHelp },
    ],
  },
]

export default function Sidebar({
  activePage,
  onNavigate,
  collapsed = false,
  onToggle,
  mobileOpen = false,
  onClose,
}: SidebarProps) {
  function handleNavigate(page: string) {
    onNavigate(page)
    onClose?.()
  }

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Fermer le menu"
          onClick={onClose}
        />
      )}

      <aside
        className={[
          'mediatech-sidebar',
          collapsed ? 'sidebar-collapsed' : '',
          mobileOpen ? 'sidebar-mobile-open' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <Monitor size={23} strokeWidth={2.5} />
          </div>

          <div className="sidebar-brand-text">
            <strong>
              Media<span>Tech</span>
            </strong>
            <small>GESTION DE MAGASIN</small>
          </div>

          <button
            type="button"
            className="sidebar-mobile-close"
            onClick={onClose}
            aria-label="Fermer le menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-navigation">
          {navigation.map((section) => (
            <div className="sidebar-section" key={section.title}>
              <p className="sidebar-section-title">{section.title}</p>

              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = activePage === item.label

                return (
                  <button
                    type="button"
                    key={item.label}
                    className={`sidebar-link ${isActive ? 'active' : ''}`}
                    onClick={() => handleNavigate(item.label)}
                    title={collapsed ? item.label : undefined}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon size={20} strokeWidth={isActive ? 2.4 : 1.9} />
                    <span className="sidebar-link-label">{item.label}</span>
                    {isActive && <span className="sidebar-active-mark" />}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-help-card">
            <div className="sidebar-help-icon">
              <CircleHelp size={20} />
            </div>

            <div className="sidebar-help-text">
              <strong>Besoin d’aide ?</strong>
              <p>Consultez notre centre d’aide.</p>
              <button
                type="button"
                onClick={() => handleNavigate('Centre d’aide')}
              >
                Consulter <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {onToggle && (
            <button
              type="button"
              className="sidebar-collapse-button"
              onClick={onToggle}
              aria-label={
                collapsed ? 'Développer le menu' : 'Réduire le menu'
              }
            >
              {collapsed ? (
                <ChevronRight size={18} />
              ) : (
                <ChevronLeft size={18} />
              )}
              {!collapsed && <span>Réduire le menu</span>}
            </button>
          )}
        </div>
      </aside>
    </>
  )
}

