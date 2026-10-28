import { useEffect, useState } from 'react'
import {
  Package,
  Boxes,
  Tags,
  CircleDollarSign,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import type { Product } from './types'
import './Dashboard.css'

const API_URL = 'http://localhost:5091/api/products'

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadProducts() {
    setLoading(true)
    try {
      const response = await fetch(API_URL)
      if (!response.ok) throw new Error('API error')
      const data: Product[] = await response.json()
      setProducts(data)
      setError('')
    } catch {
      setError('Impossible de contacter l’API. Vérifiez que le backend fonctionne.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadProducts()
  }, [])

  const totalUnits = products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0)
  const stockValue = products.reduce(
    (sum, p) => sum + (Number(p.price) || 0) * (Number(p.stock) || 0),
    0,
  )
  const categoryCount = new Set(
    products.map(p => p.category?.trim() || 'Autres'),
  ).size
  const alerts = products.filter(p => Number(p.stock) <= 5).length

  const cards = [
    { label: 'Total des produits', value: products.length, icon: Package, color: 'red' },
    { label: 'Unités en stock', value: totalUnits, icon: Boxes, color: 'orange' },
    { label: 'Catégories', value: categoryCount, icon: Tags, color: 'blue' },
    {
      label: 'Valeur du stock',
      value: stockValue.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' DH',
      icon: CircleDollarSign,
      color: 'green',
    },
  ]

  return (
    <section className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <p className="dashboard-eyebrow">ESPACE DE GESTION</p>
          <h1>Dashboard</h1>
          <p className="dashboard-subtitle">Vue d’ensemble de votre magasin MediaTech.</p>
        </div>
        <button className="dashboard-refresh" onClick={() => void loadProducts()} disabled={loading}>
          <RefreshCw size={17} className={loading ? 'dashboard-spinning' : ''} />
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

      <div className="dashboard-lower-grid">
        <section className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h2>Produits récemment affichés</h2>
              <p>Les produits enregistrés dans votre catalogue.</p>
            </div>
            <Package size={21} />
          </div>

          {loading ? (
            <p className="dashboard-empty">Chargement des produits...</p>
          ) : products.length === 0 ? (
            <p className="dashboard-empty">Aucun produit enregistré pour le moment.</p>
          ) : (
            <div className="dashboard-product-list">
              {products.slice(0, 5).map(product => (
                <div className="dashboard-product-row" key={product.id}>
                  <div className="dashboard-product-symbol"><Package size={19} /></div>
                  <div className="dashboard-product-name">
                    <strong>{product.name}</strong>
                    <span>{product.category || 'Autres'}</span>
                  </div>
                  <div className="dashboard-product-price">
                    <strong>{Number(product.price).toLocaleString('fr-FR')} DH</strong>
                    <span>{product.stock} en stock</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-panel dashboard-alert-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h2>Alertes de stock</h2>
              <p>Produits avec 5 unités ou moins.</p>
            </div>
            <AlertTriangle size={22} />
          </div>
          <div className="dashboard-alert-number">{loading ? '...' : alerts}</div>
          <p className="dashboard-alert-caption">
            {alerts === 1 ? 'produit nécessite' : 'produits nécessitent'} une vérification.
          </p>
          {products.filter(p => Number(p.stock) <= 5).slice(0, 4).map(product => (
            <div className="dashboard-alert-row" key={product.id}>
              <span>{product.name}</span>
              <strong>{product.stock} unité(s)</strong>
            </div>
          ))}
          {!loading && alerts === 0 && (
            <div className="dashboard-no-alert">Tout est en ordre : aucun stock faible.</div>
          )}
        </section>
      </div>
    </section>
  )
}
