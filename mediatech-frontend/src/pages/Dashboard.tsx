import { useEffect, useMemo, useState } from 'react'
import {
  Package,
  Boxes,
  Tags,
  CircleDollarSign,
  AlertTriangle,
  RefreshCw,
  Download,
  Printer,
  ArrowRight,
} from 'lucide-react'
import type { Product } from './types'
import './Dashboard.css'

const API_URL = 'http://localhost:5091/api/products'

function extractProducts(data: unknown): Product[] {
  if (Array.isArray(data)) return data as Product[]

  if (typeof data === 'object' && data !== null && 'value' in data) {
    const value = (data as { value?: unknown }).value
    if (Array.isArray(value)) return value as Product[]
  }

  throw new Error('Format de données invalide')
}

function formatPrice(value: number) {
  return `${value.toLocaleString('fr-FR', {
    maximumFractionDigits: 2,
  })} DH`
}

function getStockStatus(stock: number) {
  if (stock <= 0) {
    return { label: 'Épuisé', className: 'dashboard-status-out' }
  }

  if (stock <= 5) {
    return { label: 'Stock faible', className: 'dashboard-status-low' }
  }

  return { label: 'Disponible', className: 'dashboard-status-ok' }
}

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Toutes')

  async function loadProducts() {
    setLoading(true)

    try {
      const response = await fetch(API_URL)
      if (!response.ok) throw new Error('API error')

      const data: unknown = await response.json()
      setProducts(extractProducts(data))
      setError('')
      setLastUpdated(new Date().toLocaleTimeString('fr-FR'))
    } catch {
      setError(
        'Impossible de contacter l’API. Vérifiez que le backend fonctionne.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadProducts()
  }, [])

  const totalUnits = products.reduce(
    (sum, product) => sum + Math.max(0, Number(product.stock) || 0),
    0
  )

  const stockValue = products.reduce(
    (sum, product) =>
      sum +
      Math.max(0, Number(product.price) || 0) *
        Math.max(0, Number(product.stock) || 0),
    0
  )

  const categorySummary = useMemo(() => {
    const grouped = new Map<
      string,
      { name: string; count: number; units: number; value: number }
    >()

    products.forEach(product => {
      const name = product.category?.trim() || 'Autres'
      const item = grouped.get(name) ?? {
        name,
        count: 0,
        units: 0,
        value: 0,
      }

      const stock = Math.max(0, Number(product.stock) || 0)
      const price = Math.max(0, Number(product.price) || 0)

      item.count += 1
      item.units += stock
      item.value += stock * price
      grouped.set(name, item)
    })

    return Array.from(grouped.values()).sort(
      (a, b) => b.count - a.count
    )
  }, [products])

  const categories = useMemo(
    () => ['Toutes', ...categorySummary.map(category => category.name)],
    [categorySummary]
  )

  const recentProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => {
        const dateA = (a as Product & { createdAt?: string }).createdAt
        const dateB = (b as Product & { createdAt?: string }).createdAt

        if (dateA && dateB) {
          return new Date(dateB).getTime() - new Date(dateA).getTime()
        }

        return Number(b.id) - Number(a.id)
      })
      .filter(
        product =>
          selectedCategory === 'Toutes' ||
          (product.category?.trim() || 'Autres') === selectedCategory
      )
      .slice(0, 5)
  }, [products, selectedCategory])

  const alerts = products
    .filter(product => (Number(product.stock) || 0) <= 5)
    .sort(
      (a, b) =>
        (Number(a.stock) || 0) - (Number(b.stock) || 0)
    )

  const cards = [
    {
      label: 'Total des produits',
      value: products.length.toLocaleString('fr-FR'),
      icon: Package,
      color: 'red',
    },
    {
      label: 'Unités en stock',
      value: totalUnits.toLocaleString('fr-FR'),
      icon: Boxes,
      color: 'orange',
    },
    {
      label: 'Catégories',
      value: categorySummary.length.toLocaleString('fr-FR'),
      icon: Tags,
      color: 'blue',
    },
    {
      label: 'Valeur du stock',
      value: formatPrice(stockValue),
      icon: CircleDollarSign,
      color: 'green',
    },
  ]

  function exportCsv() {
    const headers = [
      'Produit',
      'Catégorie',
      'Prix unitaire (DH)',
      'Quantité',
      'Valeur du stock (DH)',
      'État du stock',
    ]

    const rows = products.map(product => {
      const price = Math.max(0, Number(product.price) || 0)
      const stock = Math.max(0, Number(product.stock) || 0)

      return [
        product.name,
        product.category || 'Autres',
        price,
        stock,
        price * stock,
        getStockStatus(Number(product.stock) || 0).label,
      ]
    })

    const escapeCsv = (value: string | number) =>
      `"${String(value ?? '').replace(/"/g, '""')}"`

    const csv = [headers, ...rows]
      .map(row => row.map(escapeCsv).join(';'))
      .join('\r\n')

    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'MediaTech-Catalogue.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <p className="dashboard-eyebrow">ESPACE DE GESTION</p>
          <h1>Dashboard</h1>
          <p className="dashboard-subtitle">
            Vue d’ensemble de votre magasin MediaTech.
          </p>
          {lastUpdated && (
            <p className="dashboard-last-updated">
              Dernière actualisation : {lastUpdated}
            </p>
          )}
        </div>

        <button
          className="dashboard-refresh"
          onClick={() => void loadProducts()}
          disabled={loading}
        >
          <RefreshCw
            size={17}
            className={loading ? 'dashboard-spinning' : ''}
          />
          Actualiser
        </button>
      </div>

      {error && <div className="dashboard-error">{error}</div>}

      <div className="dashboard-stats">
        {cards.map(card => {
          const Icon = card.icon

          return (
            <article className="dashboard-stat-card" key={card.label}>
              <div className={`dashboard-stat-icon ${card.color}`}>
                <Icon size={23} />
              </div>
              <div className="dashboard-stat-info">
                <p>{card.label}</p>
                <strong>{loading ? '...' : card.value}</strong>
              </div>
            </article>
          )
        })}
      </div>

      <section className="dashboard-quick-actions">
        <div>
          <h2>Actions rapides</h2>
          <p>Exportez votre catalogue ou préparez un rapport imprimable.</p>
        </div>
        <div className="dashboard-action-buttons">
          <button
            type="button"
            onClick={exportCsv}
            disabled={loading || products.length === 0}
          >
            <Download size={16} />
            Exporter le catalogue
          </button>
          <button type="button" onClick={() => window.print()}>
            <Printer size={16} />
            Imprimer / PDF
          </button>
        </div>
      </section>

      <div className="dashboard-lower-grid">
        <section className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h2>Produits récemment ajoutés</h2>
              <p>Les dernières références de votre catalogue.</p>
            </div>
            <Package size={21} />
          </div>

          <div className="dashboard-product-filters">
            {categories.map(category => (
              <button
                key={category}
                type="button"
                className={
                  selectedCategory === category
                    ? 'dashboard-filter-active'
                    : ''
                }
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="dashboard-empty">Chargement des produits...</p>
          ) : recentProducts.length === 0 ? (
            <p className="dashboard-empty">
              Aucun produit dans cette catégorie.
            </p>
          ) : (
            <div className="dashboard-product-list">
              {recentProducts.map(product => {
                const stock = Number(product.stock) || 0
                const status = getStockStatus(stock)

                return (
                  <div className="dashboard-product-row" key={product.id}>
                    <div className="dashboard-product-visual">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          loading="lazy"
                          onError={event => {
                            event.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <Package size={20} />
                      )}
                    </div>

                    <div className="dashboard-product-name">
                      <strong>{product.name}</strong>
                      <span>{product.category || 'Autres'}</span>
                      <span
                        className={`dashboard-product-status ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div className="dashboard-product-price">
                      <strong>
                        {formatPrice(Number(product.price) || 0)}
                      </strong>
                      <span>
                        {Math.max(0, stock).toLocaleString('fr-FR')} en stock
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="dashboard-panel dashboard-alert-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h2>Alertes de stock</h2>
              <p>Produits avec 5 unités ou moins, y compris les produits épuisés.</p>
            </div>
            <AlertTriangle size={22} />
          </div>

          <div className="dashboard-alert-number">
            {loading ? '...' : alerts.length}
          </div>
          <p className="dashboard-alert-caption">
            {alerts.length === 1
              ? 'produit nécessite une vérification.'
              : 'produits nécessitent une vérification.'}
          </p>

          {!loading &&
            alerts.slice(0, 5).map(product => {
              const status = getStockStatus(Number(product.stock) || 0)

              return (
                <div className="dashboard-alert-row" key={product.id}>
                  <div className="dashboard-alert-product">
                    <span>{product.name}</span>
                    <small className={status.className}>{status.label}</small>
                  </div>
                  <strong>
                    {Math.max(0, Number(product.stock) || 0)} unité(s)
                  </strong>
                </div>
              )
            })}

          {!loading && alerts.length === 0 && (
            <div className="dashboard-no-alert">
              Tout est en ordre : aucun stock faible.
            </div>
          )}

          {!loading && alerts.length > 5 && (
            <p className="dashboard-more-alerts">
              + {alerts.length - 5} autre(s) produit(s) à surveiller.
            </p>
          )}
        </section>
      </div>

      <section className="dashboard-panel dashboard-categories-panel">
        <div className="dashboard-panel-heading">
          <div>
            <h2>Résumé des catégories</h2>
            <p>Références et unités enregistrées par catégorie.</p>
          </div>
          <Tags size={21} />
        </div>

        {loading ? (
          <p className="dashboard-empty">Chargement des catégories...</p>
        ) : categorySummary.length === 0 ? (
          <p className="dashboard-empty">Aucune catégorie enregistrée.</p>
        ) : (
          <div className="dashboard-categories-grid">
            {categorySummary.map(category => (
              <article
                className="dashboard-category-card"
                key={category.name}
              >
                <div className="dashboard-category-title">
                  <span><Tags size={18} /></span>
                  <strong>{category.name}</strong>
                  <ArrowRight size={16} />
                </div>
                <div className="dashboard-category-metrics">
                  <div>
                    <span>Produits</span>
                    <strong>{category.count}</strong>
                  </div>
                  <div>
                    <span>Unités</span>
                    <strong>
                      {category.units.toLocaleString('fr-FR')}
                    </strong>
                  </div>
                </div>
                <div className="dashboard-category-value">
                  Valeur du stock
                  <strong>{formatPrice(category.value)}</strong>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}

