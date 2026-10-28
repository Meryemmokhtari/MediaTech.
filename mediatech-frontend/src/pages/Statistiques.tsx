import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import {
  Boxes,
  Package,
  AlertTriangle,
  CircleDollarSign,
  Download,
  Printer,
  TrendingUp,
} from 'lucide-react'
import type { Product } from './types'
import './Statistiques.css'

const StatistiquesCharts = lazy(() => import('./StatistiquesCharts'))

const API_URL = 'http://localhost:5091/api/products'

function extractProducts(data: unknown): Product[] {
  if (Array.isArray(data)) {
    return data as Product[]
  }

  if (typeof data === 'object' && data !== null && 'value' in data) {
    const value = (data as { value?: unknown }).value
    if (Array.isArray(value)) {
      return value as Product[]
    }
  }

  throw new Error('Format des produits invalide')
}

function getStockStatus(stock: number) {
  if (stock <= 0) {
    return { label: 'Épuisé', className: 'status-out' }
  }

  if (stock <= 5) {
    return { label: 'Stock faible', className: 'status-low' }
  }

  return { label: 'Disponible', className: 'status-available' }
}

export default function Statistiques() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCharts, setShowCharts] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadProducts() {
      try {
        const response = await fetch(API_URL)

        if (!response.ok) {
          throw new Error('Erreur HTTP')
        }

        const data: unknown = await response.json()
        const list = extractProducts(data)

        if (!cancelled) {
          setProducts(list)
          setError('')
        }
      } catch {
        if (!cancelled) {
          setError(
            'Impossible de charger les statistiques. Vérifiez le backend.'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadProducts()

    return () => {
      cancelled = true
    }
  }, [])

  const stats = useMemo(() => {
    const totalUnits = products.reduce(
      (sum, product) => sum + Math.max(0, Number(product.stock) || 0),
      0
    )

    const stockValue = products.reduce((sum, product) => {
      const price = Math.max(0, Number(product.price) || 0)
      const stock = Math.max(0, Number(product.stock) || 0)
      return sum + price * stock
    }, 0)

    const lowStock = products.filter(product => {
      const stock = Number(product.stock) || 0
      return stock > 0 && stock <= 5
    }).length

    const outOfStock = products.filter(
      product => (Number(product.stock) || 0) <= 0
    ).length

    const grouped = products.reduce<
      Record<string, { category: string; count: number; units: number }>
    >((acc, product) => {
      const category = product.category?.trim() || 'Sans catégorie'

      if (!acc[category]) {
        acc[category] = { category, count: 0, units: 0 }
      }

      acc[category].count += 1
      acc[category].units += Math.max(0, Number(product.stock) || 0)

      return acc
    }, {})

    const categoryData = Object.values(grouped).sort(
      (a, b) => b.count - a.count
    )

    const stockData = [
      {
        name: 'Disponible',
        value: products.filter(
          product => (Number(product.stock) || 0) > 5
        ).length,
      },
      { name: 'Stock faible', value: lowStock },
      { name: 'Épuisé', value: outOfStock },
    ]

    const rankedProducts = products
      .map(product => ({
        product,
        value:
          Math.max(0, Number(product.price) || 0) *
          Math.max(0, Number(product.stock) || 0),
      }))
      .sort((a, b) => b.value - a.value)

    return {
      totalProducts: products.length,
      totalUnits,
      stockValue,
      lowStock,
      outOfStock,
      categoryData,
      stockData,
      rankedProducts,
    }
  }, [products])

  const formatPrice = (value: number) =>
    `${value.toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })} DH`

  function exportCsv() {
    const headers = [
      'Produit',
      'Catégorie',
      'Prix unitaire (DH)',
      'Quantité en stock',
      'Valeur du stock (DH)',
      'État du stock',
    ]

    const rows = products.map(product => {
      const price = Math.max(0, Number(product.price) || 0)
      const stock = Math.max(0, Number(product.stock) || 0)
      const status = getStockStatus(Number(product.stock) || 0)

      return [
        product.name,
        product.category || 'Sans catégorie',
        price,
        stock,
        price * stock,
        status.label,
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
    link.download = 'MediaTech-Statistiques.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const maxProductValue = stats.rankedProducts[0]?.value || 1

  return (
    <div className="statistics-page">
      <div className="statistics-heading">
        <div>
          <h2>Statistiques</h2>
          <p>
            Analyse globale de vos produits et de votre stock.
          </p>
        </div>

        <div className="statistics-actions">
          <span className="statistics-live">
            <span /> Données actuelles
          </span>

          <button type="button" onClick={exportCsv} disabled={loading || products.length === 0}>
            <Download size={16} />
            Exporter CSV
          </button>

          <button type="button" onClick={() => window.print()}>
            <Printer size={16} />
            Imprimer / PDF
          </button>
        </div>
      </div>

      {error && <p className="statistics-error">{error}</p>}
      {loading && <p className="statistics-loading">Chargement des statistiques...</p>}

      <div className="statistics-cards">
        <article className="stat-card">
          <div className="stat-icon red"><Package size={21} /></div>
          <span>Produits</span>
          <strong>{loading ? '...' : stats.totalProducts}</strong>
          <small>Références enregistrées</small>
        </article>

        <article className="stat-card">
          <div className="stat-icon blue"><Boxes size={21} /></div>
          <span>Unités en stock</span>
          <strong>{loading ? '...' : stats.totalUnits.toLocaleString('fr-FR')}</strong>
          <small>Quantité totale disponible</small>
        </article>

        <article className="stat-card">
          <div className="stat-icon orange"><AlertTriangle size={21} /></div>
          <span>Alertes de stock</span>
          <strong>{loading ? '...' : stats.lowStock + stats.outOfStock}</strong>
          <small>{stats.lowStock} faibles · {stats.outOfStock} épuisés</small>
        </article>

        <article className="stat-card">
          <div className="stat-icon green"><CircleDollarSign size={21} /></div>
          <span>Valeur du stock</span>
          <strong className="stat-value">
            {loading ? '...' : formatPrice(stats.stockValue)}
          </strong>
          <small>Prix × quantité en stock</small>
        </article>
      </div>

      {!showCharts ? (
        <button type="button" onClick={() => setShowCharts(true)}>
          Afficher les graphiques
        </button>
      ) : (
        <Suspense fallback={<p className="statistics-loading">Chargement des graphiques...</p>}>
          <StatistiquesCharts stats={stats} />
        </Suspense>
      )}

      <section className="statistics-panel statistics-top-panel">
        <div className="statistics-panel-heading">
          <div>
            <h3>Top 5 des produits par valeur</h3>
            <p>Classement selon le prix unitaire × quantité en stock</p>
          </div>
          <TrendingUp size={20} />
        </div>

        {stats.rankedProducts.length === 0 ? (
          <div className="statistics-empty">Aucun produit à analyser.</div>
        ) : (
          <div className="top-products-list">
            {stats.rankedProducts.slice(0, 5).map((item, index) => (
              <div className="top-product-row" key={item.product.id}>
                <span className="top-product-rank">{index + 1}</span>

                <div className="top-product-main">
                  <div className="top-product-title">
                    <strong>{item.product.name}</strong>
                    <span>{item.product.category || 'Sans catégorie'}</span>
                  </div>
                  <div className="top-product-track">
                    <span
                      style={{
                        width: `${Math.max(0, (item.value / maxProductValue) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <strong className="top-product-value">
                  {formatPrice(item.value)}
                </strong>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="statistics-panel statistics-table-panel">
        <div className="statistics-panel-heading">
          <div>
            <h3>Détail du stock</h3>
            <p>{stats.totalProducts} référence(s) enregistrée(s)</p>
          </div>
          <Package size={20} />
        </div>

        {stats.rankedProducts.length === 0 ? (
          <div className="statistics-empty">Aucun produit à afficher.</div>
        ) : (
          <div className="statistics-table-wrap">
            <table className="statistics-table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Catégorie</th>
                  <th>Prix unitaire</th>
                  <th>Quantité</th>
                  <th>Valeur du stock</th>
                  <th>État</th>
                </tr>
              </thead>

              <tbody>
                {stats.rankedProducts.map(item => {
                  const product = item.product
                  const stock = Number(product.stock) || 0
                  const status = getStockStatus(stock)

                  return (
                    <tr key={product.id}>
                      <td>
                        <strong>{product.name}</strong>
                        <small>{product.description || 'Sans description'}</small>
                      </td>
                      <td>{product.category || 'Sans catégorie'}</td>
                      <td>{formatPrice(Number(product.price) || 0)}</td>
                      <td>{Math.max(0, stock).toLocaleString('fr-FR')}</td>
                      <td><strong>{formatPrice(item.value)}</strong></td>
                      <td>
                        <span className={`stock-status-badge ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}


