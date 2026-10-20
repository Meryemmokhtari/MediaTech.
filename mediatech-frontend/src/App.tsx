
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowRight, BarChart3,
  Bell, Boxes, Check, ChevronDown, CircleHelp, Clock, Cpu,
  LayoutDashboard, Menu, Package, Pencil, Plus, RefreshCw,
  Search, Settings, ShieldCheck, ShoppingBag, SlidersHorizontal,
  Tags, Trash2, X, Eye, Save,
} from 'lucide-react'
import './App.css'

type Product = {
  id: number
  name: string
  description: string
  price: number
  stock: number
  category: string
  imageUrl?: string
}

type ProductForm = {
  name: string
  description: string
  price: string
  stock: string
  category: string
  imageUrl: string
}

type NavItem = {
  label: string
  icon: typeof LayoutDashboard
}

const API_URL = 'http://localhost:5091/api/products'

const EMPTY_FORM: ProductForm = {
  name: '',
  description: '',
  price: '',
  stock: '',
  category: '',
  imageUrl: '',
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Produits', icon: Package },
  { label: 'Catégories', icon: Tags },
  { label: 'Stock', icon: Boxes },
  { label: 'Statistiques', icon: BarChart3 },
]

function App() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Toutes')
  const [activePage, setActivePage] = useState('Dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const [modal, setModal] = useState<'form' | 'details' | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [actionError, setActionError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const loadProducts = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setError('')

    try {
      const response = await fetch(API_URL)
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`)
      }

      const data: Product[] = await response.json()
      setProducts(Array.isArray(data) ? data : [])
      setLastUpdated(new Date())
    } catch {
      setError(
        "Impossible de charger les produits. Vérifiez que l'API fonctionne sur le port 5091.",
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProducts()
  }, [loadProducts])

  // Fermer la fenêtre avec la touche Échap.
  useEffect(() => {
    if (!modal) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) closeModal()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [modal, saving])

  const categories = useMemo(
    () => [
      'Toutes',
      ...new Set(products.map((p) => p.category).filter(Boolean)),
    ],
    [products],
  )

  const stats = useMemo(() => {
    const totalUnits = products.reduce(
      (sum, p) => sum + Math.max(0, Number(p.stock) || 0),
      0,
    )
    const inventoryValue = products.reduce(
      (sum, p) =>
        sum +
        Math.max(0, Number(p.price) || 0) *
          Math.max(0, Number(p.stock) || 0),
      0,
    )
    const lowStock = products.filter(
      (p) => p.stock > 0 && p.stock <= 5,
    ).length
    const outOfStock = products.filter((p) => p.stock <= 0).length
    const categoryCount = new Set(
      products.map((p) => p.category).filter(Boolean),
    ).size

    return {
      totalProducts: products.length,
      totalUnits,
      inventoryValue,
      lowStock,
      outOfStock,
      categoryCount,
    }
  }, [products])

  const categoryStats = useMemo(() => {
    const counts = new Map<string, number>()

    products.forEach((p) => {
      const name = p.category || 'Autres'
      counts.set(name, (counts.get(name) || 0) + 1)
    })

    return Array.from(counts, ([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [products])

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const text = `${p.name} ${p.description || ''} ${p.category || ''}`
      const matchesSearch = text
        .toLowerCase()
        .includes(search.trim().toLowerCase())
      const matchesCategory =
        category === 'Toutes' || p.category === category
      const matchesPage =
        activePage !== 'Stock' || p.stock <= 5

      return matchesSearch && matchesCategory && matchesPage
    })
  }, [products, search, category, activePage])

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      maximumFractionDigits: 2,
    }).format(Number(price) || 0)

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('fr-MA', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)

  function closeModal() {
    setModal(null)
    setSelectedProduct(null)
    setForm(EMPTY_FORM)
    setFormError('')
  }

  function openCreateForm() {
    setSelectedProduct(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setActionError('')
    setModal('form')
  }

  function openEditForm(product: Product) {
    setSelectedProduct(product)
    setForm({
      name: product.name || '',
      description: product.description || '',
      price: String(product.price ?? ''),
      stock: String(product.stock ?? ''),
      category: product.category || '',
      imageUrl: product.imageUrl || '',
    })
    setFormError('')
    setActionError('')
    setModal('form')
  }

  function openDetails(product: Product) {
    setSelectedProduct(product)
    setActionError('')
    setModal('details')
  }

  function navigate(page: string) {
    setActivePage(page)
    setSidebarOpen(false)

    if (page === 'Catégories') setCategory('Toutes')

    if (page === 'Dashboard' || page === 'Statistiques') {
      setSearch('')
      setCategory('Toutes')
    }
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    setActionError('')
    setSuccessMessage('')

    const price = Number(form.price)
    const stock = Number(form.stock)

    if (!form.name.trim()) {
      setFormError('Le nom du produit est obligatoire.')
      return
    }

    if (!form.category.trim()) {
      setFormError('La catégorie est obligatoire.')
      return
    }

    if (form.price.trim() === '' || !Number.isFinite(price) || price < 0) {
      setFormError('Entrez un prix valide, supérieur ou égal à zéro.')
      return
    }

    if (
      form.stock.trim() === '' ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      setFormError('La quantité doit être un entier positif ou nul.')
      return
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price,
      stock,
      category: form.category.trim(),
      imageUrl: form.imageUrl.trim(),
    }

    setSaving(true)

    try {
      const isEditing = selectedProduct !== null
      const url = isEditing
        ? `${API_URL}/${selectedProduct.id}`
        : API_URL

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const details = await response.text()
        throw new Error(
          details || `Échec de l'enregistrement (HTTP ${response.status}).`,
        )
      }

      closeModal()
      setSuccessMessage(
        isEditing
          ? 'Le produit a été modifié avec succès.'
          : 'Le produit a été ajouté avec succès.',
      )
      setActivePage('Produits')
      await loadProducts(false)
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de l'enregistrement.",
      )
    } finally {
      setSaving(false)
    }
  }

  async function deleteProduct(product: Product) {
    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer "${product.name}" ? Cette action est irréversible.`,
    )

    if (!confirmed) return

    setActionError('')
    setSuccessMessage('')

    try {
      const response = await fetch(`${API_URL}/${product.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const details = await response.text()
        throw new Error(
          details || `Échec de la suppression (HTTP ${response.status}).`,
        )
      }

      if (modal) closeModal()

      setSuccessMessage(`Le produit "${product.name}" a été supprimé.`)
      await loadProducts(false)
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : 'Impossible de supprimer ce produit.',
      )
    }
  }

  const pageTitle =
    activePage === 'Dashboard'
      ? "Vue d’ensemble"
      : activePage === 'Stock'
        ? 'Surveillance du stock'
        : activePage === 'Catégories'
          ? 'Catégories de produits'
          : activePage === 'Statistiques'
            ? 'Statistiques'
            : activePage

  return (
    <div className="admin-app">
      {sidebarOpen && (
        <button
          className="sidebar-overlay"
          aria-label="Fermer le menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <a
          className="sidebar-brand"
          href="#dashboard"
          onClick={(e) => {
            e.preventDefault()
            navigate('Dashboard')
          }}
        >
          <span className="brand-icon"><Cpu size={23} /></span>
          <span>
            Media<span className="brand-red">Tech</span>
            <small>ADMINISTRATION</small>
          </span>
        </a>

        <div className="sidebar-label">MENU PRINCIPAL</div>

        <nav className="sidebar-nav">
          {navItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-link ${activePage === label ? 'nav-link-active' : ''}`}
              onClick={() => navigate(label)}
            >
              <Icon size={19} strokeWidth={1.8} />
              <span>{label}</span>
              {label === 'Stock' && stats.lowStock + stats.outOfStock > 0 && (
                <span className="nav-count">
                  {stats.lowStock + stats.outOfStock}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-label sidebar-label-spaced">
          PRÉFÉRENCES
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-link ${activePage === 'Paramètres' ? 'nav-link-active' : ''}`}
            onClick={() => navigate('Paramètres')}
          >
            <Settings size={19} strokeWidth={1.8} />
            <span>Paramètres</span>
          </button>
          <button
            className="nav-link"
            onClick={() =>
              setSuccessMessage(
                "MediaTech — Gérez les produits, les catégories et le stock depuis votre espace d'administration.",
              )
            }
          >
            <CircleHelp size={19} strokeWidth={1.8} />
            <span>Centre d’aide</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help-icon"><ShieldCheck size={20} /></div>
          <strong>Votre espace admin</strong>
          <p>Gérez votre catalogue en toute simplicité.</p>
          <span className="secure-label"><span /> Interface de gestion</span>
        </div>

        <div className="sidebar-profile">
          <div className="profile-avatar">MT</div>
          <div className="profile-text">
            <strong>Administrateur</strong>
            <span>MediaTech Store</span>
          </div>
          <ChevronDown size={16} className="profile-chevron" />
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="mobile-menu"
            aria-label="Ouvrir le menu"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>

          <div className="breadcrumb">
            <span>MediaTech</span>
            <span className="breadcrumb-separator">/</span>
            <strong>{pageTitle}</strong>
          </div>

          <div className="topbar-actions">
            <div className="connection-pill">
              <span className={`connection-dot ${error ? 'connection-error' : ''}`} />
              {error ? 'API déconnectée' : 'Catalogue'}
            </div>
            <button
              className="icon-button"
              aria-label="Actualiser les produits"
              onClick={() => void loadProducts()}
              title="Actualiser"
            >
              <RefreshCw size={18} className={loading ? 'spin' : ''} />
            </button>
            <button
              className="icon-button notification-button"
              aria-label="Notifications stock"
              onClick={() => navigate('Stock')}
            >
              <Bell size={19} />
              {stats.lowStock + stats.outOfStock > 0 && (
                <span className="notification-dot" />
              )}
            </button>
            <div className="topbar-avatar">MT</div>
          </div>
        </header>

        <main className="dashboard-content">
          <section className="welcome-row">
            <div>
              <div className="page-eyebrow">
                <span className="eyebrow-line" /> ESPACE DE GESTION
              </div>
              <h1>{pageTitle}<span className="title-period">.</span></h1>
              <p className="page-subtitle">
                Voici un aperçu de votre catalogue et de votre inventaire.
              </p>
            </div>

            <div className="welcome-actions">
              <span className="updated-label">
                <Clock size={14} />
                {lastUpdated
                  ? `Mis à jour à ${formatDate(lastUpdated)}`
                  : 'En attente des données'}
              </span>
              <button
                className="primary-button"
                onClick={() => {
                  navigate('Produits')
                  openCreateForm()
                }}
              >
                <Plus size={17} /> Ajouter un produit
              </button>
            </div>
          </section>

          {error && (
            <div className="error-banner">
              <AlertTriangle size={20} />
              <div>
                <strong>Connexion à l’API impossible</strong>
                <p>{error}</p>
              </div>
              <button onClick={() => void loadProducts()}>
                <RefreshCw size={15} /> Réessayer
              </button>
            </div>
          )}

          {successMessage && (
            <div className="crud-message crud-success" role="status">
              <Check size={18} />
              <span>{successMessage}</span>
              <button
                aria-label="Fermer le message"
                onClick={() => setSuccessMessage('')}
              >
                <X size={17} />
              </button>
            </div>
          )}

          {actionError && (
            <div className="crud-message crud-error" role="alert">
              <AlertTriangle size={18} />
              <span>{actionError}</span>
              <button
                aria-label="Fermer le message"
                onClick={() => setActionError('')}
              >
                <X size={17} />
              </button>
            </div>
          )}

          {activePage === 'Paramètres' ? (
            <section className="panel settings-panel">
              <div className="panel-heading">
                <div>
                  <h2>Paramètres de l’application</h2>
                  <p>Informations sur la configuration actuelle.</p>
                </div>
              </div>
              <div className="settings-row">
                <div><strong>Nom de la boutique</strong><p>MediaTech</p></div>
                <span className="settings-value">Catalogue informatique</span>
              </div>
              <div className="settings-row">
                <div><strong>API des produits</strong><p>Source des données du catalogue.</p></div>
                <code>localhost:5091/api/products</code>
              </div>
              <div className="settings-row">
                <div><strong>Devise</strong><p>Devise utilisée pour afficher les prix.</p></div>
                <span className="settings-value">MAD — Dirham marocain</span>
              </div>
              <div className="settings-row">
                <div><strong>Connexion</strong><p>État du chargement des produits.</p></div>
                <span className={`status-tag ${error ? 'status-danger' : 'status-success'}`}>
                  {error ? 'Déconnectée' : loading ? 'Chargement...' : 'Catalogue accessible'}
                </span>
              </div>
            </section>
          ) : (
            <>
              <section className="stats-grid">
                <article className="stat-card">
                  <div className="stat-top">
                    <span className="stat-icon stat-icon-red"><Package size={21} /></span>
                    <span className="stat-kicker">CATALOGUE</span>
                  </div>
                  <p className="stat-label">Total des produits</p>
                  <div className="stat-value">
                    {loading ? '—' : stats.totalProducts.toLocaleString('fr-MA')}
                  </div>
                  <div className="stat-footer">
                    <span className="stat-neutral"><Boxes size={14} /> {stats.totalUnits} unités</span>
                    <span className="stat-caption">en stock</span>
                  </div>
                </article>

                <article className="stat-card">
                  <div className="stat-top">
                    <span className="stat-icon stat-icon-dark"><ShoppingBag size={21} /></span>
                    <span className="stat-kicker">VALORISATION</span>
                  </div>
                  <p className="stat-label">Valeur du stock</p>
                  <div className="stat-value stat-value-price">
                    {loading ? '—' : formatPrice(stats.inventoryValue)}
                  </div>
                  <div className="stat-footer">
                    <span className="stat-neutral"><Activity size={14} /> Prix × quantité</span>
                    <span className="stat-caption">estimation</span>
                  </div>
                </article>

                <article className="stat-card">
                  <div className="stat-top">
                    <span className="stat-icon stat-icon-orange"><AlertTriangle size={21} /></span>
                    <span className="stat-kicker">VIGILANCE</span>
                  </div>
                  <p className="stat-label">Stock faible</p>
                  <div className="stat-value">{loading ? '—' : stats.lowStock}</div>
                  <div className="stat-footer">
                    <span className="stat-warning"><ArrowDownRight size={15} /> ≤ 5 unités</span>
                    <button className="text-action" onClick={() => navigate('Stock')}>
                      Surveiller <ArrowRight size={13} />
                    </button>
                  </div>
                </article>

                <article className="stat-card">
                  <div className="stat-top">
                    <span className="stat-icon stat-icon-purple"><Tags size={21} /></span>
                    <span className="stat-kicker">ORGANISATION</span>
                  </div>
                  <p className="stat-label">Catégories</p>
                  <div className="stat-value">{loading ? '—' : stats.categoryCount}</div>
                  <div className="stat-footer">
                    <span className="stat-neutral"><Check size={14} /> Catalogue classé</span>
                    <button className="text-action" onClick={() => navigate('Catégories')}>
                      Explorer <ArrowRight size={13} />
                    </button>
                  </div>
                </article>
              </section>

              <section className="overview-grid">
                <article className="panel category-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Répartition par catégorie</h2>
                      <p>Nombre de produits dans chaque catégorie.</p>
                    </div>
                    <button
                      className="subtle-icon-button"
                      aria-label="Voir les catégories"
                      onClick={() => navigate('Catégories')}
                    >
                      <ArrowRight size={17} />
                    </button>
                  </div>

                  {loading ? (
                    <div className="chart-empty">Chargement des catégories...</div>
                  ) : categoryStats.length === 0 ? (
                    <div className="chart-empty"><Tags size={26} /><span>Aucune catégorie à afficher.</span></div>
                  ) : (
                    <div className="category-chart">
                      <div className="chart-bars">
                        {categoryStats.map((item, index) => {
                          const max = Math.max(
                            ...categoryStats.map((entry) => entry.count),
                            1,
                          )
                          const height = Math.max((item.count / max) * 100, 8)

                          return (
                            <button
                              className="bar-column"
                              key={item.name}
                              onClick={() => {
                                setCategory(item.name)
                                setActivePage('Produits')
                              }}
                              title={`${item.name} : ${item.count} produit(s)`}
                            >
                              <span className="bar-count">{item.count}</span>
                              <span className={`bar-track bar-color-${index}`}>
                                <span style={{ height: `${height}%` }} />
                              </span>
                              <span className="bar-label">{item.name}</span>
                            </button>
                          )
                        })}
                      </div>
                      <div className="chart-baseline" />
                      <div className="chart-summary">
                        <span className="chart-summary-dot" />
                        <span>{stats.totalProducts} produits répartis dans {stats.categoryCount} catégories</span>
                      </div>
                    </div>
                  )}
                </article>

                <article className="panel stock-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>État du stock</h2>
                      <p>Suivi des quantités disponibles.</p>
                    </div>
                    <span className="live-indicator"><span /> EN DIRECT</span>
                  </div>

                  <div className="stock-summary">
                    <div className="stock-summary-number">
                      {loading ? '—' : stats.totalUnits.toLocaleString('fr-MA')}
                      <span> unités</span>
                    </div>
                    <div className="stock-summary-caption">Quantité totale enregistrée</div>
                  </div>

                  <div className="stock-progress">
                    <div className="progress-track">
                      <span
                        className="progress-available"
                        style={{
                          width: `${products.length ? (products.filter((p) => p.stock > 5).length / products.length) * 100 : 0}%`,
                        }}
                      />
                      <span
                        className="progress-low"
                        style={{
                          width: `${products.length ? (stats.lowStock / products.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <div className="progress-legend">
                      <span><i className="legend-green" /> Disponible <strong>{products.filter((p) => p.stock > 5).length}</strong></span>
                      <span><i className="legend-orange" /> Faible <strong>{stats.lowStock}</strong></span>
                      <span><i className="legend-red" /> Épuisé <strong>{stats.outOfStock}</strong></span>
                    </div>
                  </div>

                  <button className="stock-detail-button" onClick={() => navigate('Stock')}>
                    Consulter les alertes stock <ArrowRight size={16} />
                  </button>
                </article>
              </section>

              <section className="panel products-panel" id="products">
                <div className="panel-heading products-heading">
                  <div>
                    <div className="heading-with-icon">
                      <h2>
                        {activePage === 'Stock'
                          ? 'Produits à surveiller'
                          : activePage === 'Catégories'
                            ? 'Catalogue par catégorie'
                            : activePage === 'Statistiques'
                              ? 'Données du catalogue'
                              : activePage === 'Produits'
                                ? 'Gestion des produits'
                                : 'Produits récents'}
                      </h2>
                      <span className="table-count">{filteredProducts.length}</span>
                    </div>
                    <p>
                      {activePage === 'Stock'
                        ? 'Produits dont le stock est faible ou épuisé.'
                        : 'Consultez, ajoutez, modifiez ou supprimez les produits.'}
                    </p>
                  </div>

                  <div className="table-actions">
                    <label className="table-search">
                      <Search size={16} />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher..."
                      />
                    </label>
                    <label className="filter-select">
                      <SlidersHorizontal size={15} />
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        aria-label="Filtrer par catégorie"
                      >
                        {categories.map((item) => (
                          <option key={item} value={item}>
                            {item === 'Toutes' ? 'Toutes catégories' : item}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      className="refresh-table-button"
                      onClick={() => void loadProducts()}
                      title="Actualiser"
                    >
                      <RefreshCw size={16} />
                    </button>
                    <button className="primary-button add-product-button" onClick={openCreateForm}>
                      <Plus size={16} /> Ajouter
                    </button>
                  </div>
                </div>

                <div className="table-wrap">
                  <table className="products-table">
                    <thead>
                      <tr>
                        <th>PRODUIT</th>
                        <th>CATÉGORIE</th>
                        <th>PRIX UNITAIRE</th>
                        <th>QUANTITÉ</th>
                        <th>STATUT</th>
                        <th className="action-column">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={6} className="table-message">Chargement du catalogue...</td></tr>
                      ) : error ? (
                        <tr><td colSpan={6} className="table-message">Les produits ne sont pas disponibles. Réessayez après avoir démarré l’API.</td></tr>
                      ) : filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="table-message">
                            <Search size={21} />
                            <span>Aucun produit ne correspond à votre recherche.</span>
                            <button onClick={() => { setSearch(''); setCategory('Toutes') }}>
                              Réinitialiser les filtres
                            </button>
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((product) => (
                          <tr key={product.id}>
                            <td>
                              <div className="product-cell">
                                <div className="table-product-image">
                                  {product.imageUrl
                                    ? <img src={product.imageUrl} alt={product.name} />
                                    : <Cpu size={22} />}
                                </div>
                                <div className="table-product-info">
                                  <strong>{product.name}</strong>
                                  <span>Réf. MT-{String(product.id).padStart(4, '0')}</span>
                                </div>
                              </div>
                            </td>
                            <td><span className="category-tag">{product.category || 'Autres'}</span></td>
                            <td><strong className="table-price">{formatPrice(product.price)}</strong></td>
                            <td>
                              <div className="quantity-cell">
                                <span className={`quantity-dot ${product.stock <= 0 ? 'quantity-dot-red' : product.stock <= 5 ? 'quantity-dot-orange' : ''}`} />
                                {product.stock} <span className="quantity-unit">unités</span>
                              </div>
                            </td>
                            <td>
                              <span className={`status-tag ${product.stock <= 0 ? 'status-danger' : product.stock <= 5 ? 'status-warning' : 'status-success'}`}>
                                <span />
                                {product.stock <= 0 ? 'Épuisé' : product.stock <= 5 ? 'Stock faible' : 'Disponible'}
                              </span>
                            </td>
                            <td>
                              <div className="product-actions">
                                <button
                                  className="row-action"
                                  title="Voir les détails"
                                  aria-label={`Détails de ${product.name}`}
                                  onClick={() => openDetails(product)}
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  className="row-action edit-action"
                                  title="Modifier"
                                  aria-label={`Modifier ${product.name}`}
                                  onClick={() => openEditForm(product)}
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  className="row-action delete-action"
                                  title="Supprimer"
                                  aria-label={`Supprimer ${product.name}`}
                                  onClick={() => void deleteProduct(product)}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="table-footer">
                  <span>
                    Affichage de <strong>{filteredProducts.length}</strong> produit(s) sur <strong>{products.length}</strong>
                  </span>
                  <span className="table-footer-note">
                    <ShieldCheck size={14} /> Données issues de votre API
                  </span>
                </div>
              </section>
            </>
          )}

          <footer className="dashboard-footer">
            <span>© {new Date().getFullYear()} MediaTech. Tous droits réservés.</span>
            <span><span className="footer-status-dot" /> Administration du catalogue</span>
          </footer>
        </main>
      </div>

      {modal && selectedProduct && modal === 'details' && (
        <div className="modal-overlay" onMouseDown={(e) => {
          if (e.target === e.currentTarget) closeModal()
        }}>
          <section className="product-modal" role="dialog" aria-modal="true" aria-labelledby="details-title">
            <div className="modal-heading">
              <div>
                <span className="page-eyebrow"><span className="eyebrow-line" /> FICHE PRODUIT</span>
                <h2 id="details-title">Détails du produit</h2>
              </div>
              <button className="icon-button" onClick={closeModal} aria-label="Fermer">
                <X size={19} />
              </button>
            </div>

            <div className="product-details">
              {selectedProduct.imageUrl && (
                <img className="details-image" src={selectedProduct.imageUrl} alt={selectedProduct.name} />
              )}
              <h3>{selectedProduct.name}</h3>
              <p>{selectedProduct.description || 'Aucune description renseignée.'}</p>
              <div className="details-row"><span>Référence</span><strong>MT-{String(selectedProduct.id).padStart(4, '0')}</strong></div>
              <div className="details-row"><span>Catégorie</span><strong>{selectedProduct.category || 'Autres'}</strong></div>
              <div className="details-row"><span>Prix unitaire</span><strong>{formatPrice(selectedProduct.price)}</strong></div>
              <div className="details-row"><span>Quantité</span><strong>{selectedProduct.stock} unité(s)</strong></div>
              <div className="details-row">
                <span>Statut</span>
                <strong>{selectedProduct.stock <= 0 ? 'Épuisé' : selectedProduct.stock <= 5 ? 'Stock faible' : 'Disponible'}</strong>
              </div>
              <div className="modal-actions">
                <button className="primary-button" onClick={() => openEditForm(selectedProduct)}>
                  <Pencil size={16} /> Modifier
                </button>
                <button className="secondary-button" onClick={closeModal}>Fermer</button>
              </div>
            </div>
          </section>
        </div>
      )}

      {modal === 'form' && (
        <div className="modal-overlay" onMouseDown={(e) => {
          if (e.target === e.currentTarget && !saving) closeModal()
        }}>
          <section className="product-modal" role="dialog" aria-modal="true" aria-labelledby="form-title">
            <div className="modal-heading">
              <div>
                <span className="page-eyebrow"><span className="eyebrow-line" /> CATALOGUE MEDIATEK</span>
                <h2 id="form-title">{selectedProduct ? 'Modifier le produit' : 'Ajouter un produit'}</h2>
                <p className="modal-description">
                  {selectedProduct ? 'Modifiez les informations puis enregistrez.' : 'Renseignez les informations du nouveau produit.'}
                </p>
              </div>
              <button className="icon-button" onClick={closeModal} disabled={saving} aria-label="Fermer">
                <X size={19} />
              </button>
            </div>

            <form className="product-form" onSubmit={saveProduct}>
              <label>
                Nom du produit *
                <input
                  autoFocus
                  required
                  maxLength={150}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex. Laptop HP"
                />
              </label>

              <label>
                Description
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Description du produit..."
                />
              </label>

              <div className="form-grid">
                <label>
                  Prix (MAD) *
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="6500"
                  />
                </label>
                <label>
                  Quantité en stock *
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    placeholder="10"
                  />
                </label>
              </div>

              <label>
                Catégorie *
                <input
                  required
                  maxLength={100}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Ex. Ordinateurs"
                  list="product-categories"
                />
                <datalist id="product-categories">
                  {categories.filter((c) => c !== 'Toutes').map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </label>

              <label>
                URL de l’image (facultatif)
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://exemple.com/image.jpg"
                />
              </label>

              {formError && (
                <div className="form-error" role="alert">
                  <AlertTriangle size={16} /> {formError}
                </div>
              )}

              <div className="modal-actions">
                <button className="primary-button" type="submit" disabled={saving}>
                  {saving ? <RefreshCw size={16} className="spin" /> : <Save size={16} />}
                  {saving ? 'Enregistrement...' : selectedProduct ? 'Enregistrer les modifications' : 'Ajouter le produit'}
                </button>
                <button className="secondary-button" type="button" disabled={saving} onClick={closeModal}>
                  Annuler
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

export default App
