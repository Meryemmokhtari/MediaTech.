
import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Package,
  Search,
  Pencil,
  RefreshCw,
  XCircle,
} from 'lucide-react'
import type { Product } from './types'
import './Stock.css'

type StockProps = {
  products: Product[]
  loading: boolean
  onEdit: (product: Product) => void
  onRefresh: () => void
}

export default function Stock({
  products,
  loading,
  onEdit,
  onRefresh,
}: StockProps) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('Tous')

  const lowStock = products.filter(
    (product) => product.stock > 0 && product.stock <= 5,
  )

  const outOfStock = products.filter(
    (product) => product.stock <= 0,
  )

  const available = products.filter(
    (product) => product.stock > 5,
  )

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = [
        product.name,
        product.category,
        product.description,
      ]
        .join(' ')
        .toLowerCase()
        .includes(search.trim().toLowerCase())

      const matchesFilter =
        filter === 'Tous' ||
        (filter === 'Faible' &&
          product.stock > 0 &&
          product.stock <= 5) ||
        (filter === 'Épuisé' && product.stock <= 0) ||
        (filter === 'Disponible' && product.stock > 5)

      return matchesSearch && matchesFilter
    })
  }, [products, search, filter])

  return (
    <div className="stock-page">
      <section className="stock-page-intro">
        <div>
          <span className="stock-eyebrow">
            <Boxes size={15} /> GESTION DE L'INVENTAIRE
          </span>
          <h2>Surveillance du stock</h2>
          <p>
            Identifie rapidement les produits à réapprovisionner
            et les articles épuisés.
          </p>
        </div>

        <button
          type="button"
          className="stock-refresh-button"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          Actualiser
        </button>
      </section>

      <section className="stock-stats-grid">
        <article className="stock-stat-card">
          <span className="stock-stat-icon stock-stat-red">
            <AlertTriangle size={21} />
          </span>
          <div>
            <span>Stock faible</span>
            <strong>{lowStock.length}</strong>
            <small>Entre 1 et 5 unités</small>
          </div>
        </article>

        <article className="stock-stat-card">
          <span className="stock-stat-icon stock-stat-dark">
            <XCircle size={21} />
          </span>
          <div>
            <span>Produits épuisés</span>
            <strong>{outOfStock.length}</strong>
            <small>Aucune unité disponible</small>
          </div>
        </article>

        <article className="stock-stat-card">
          <span className="stock-stat-icon stock-stat-green">
            <CheckCircle2 size={21} />
          </span>
          <div>
            <span>Disponibles</span>
            <strong>{available.length}</strong>
            <small>Plus de 5 unités</small>
          </div>
        </article>
      </section>

      <section className="panel stock-table-panel">
        <div className="stock-table-heading">
          <div>
            <h3>État des produits</h3>
            <p>
              {filteredProducts.length} produit(s) correspondant aux filtres
            </p>
          </div>

          <div className="stock-filters">
            <label className="stock-search">
              <Search size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher un produit..."
              />
            </label>

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              aria-label="Filtrer par état du stock"
              className="stock-filter-select"
            >
              <option value="Tous">Tous les statuts</option>
              <option value="Faible">Stock faible</option>
              <option value="Épuisé">Épuisé</option>
              <option value="Disponible">Disponible</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="stock-empty">
            <RefreshCw size={24} className="spin" />
            <span>Chargement du stock...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="stock-empty">
            <Package size={30} />
            <strong>Aucun produit trouvé</strong>
            <span>Essaie de modifier les filtres de recherche.</span>
          </div>
        ) : (
          <div className="stock-table-wrap">
            <table className="stock-table">
              <thead>
                <tr>
                  <th>PRODUIT</th>
                  <th>CATÉGORIE</th>
                  <th>QUANTITÉ</th>
                  <th>ÉTAT</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const isOut = product.stock <= 0
                  const isLow = product.stock > 0 && product.stock <= 5

                  return (
                    <tr key={product.id}>
                      <td>
                        <div className="stock-product-cell">
                          <div className="stock-product-icon">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                              />
                            ) : (
                              <Package size={20} />
                            )}
                          </div>
                          <div>
                            <strong>{product.name}</strong>
                            <span>
                              Réf. MT-
                              {String(product.id).padStart(4, '0')}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="stock-category-tag">
                          {product.category || 'Autres'}
                        </span>
                      </td>

                      <td>
                        <strong
                          className={`stock-quantity ${
                            isOut
                              ? 'stock-quantity-out'
                              : isLow
                                ? 'stock-quantity-low'
                                : ''
                          }`}
                        >
                          {product.stock}
                        </strong>
                        <span className="stock-unit"> unités</span>
                      </td>

                      <td>
                        <span
                          className={`stock-status ${
                            isOut
                              ? 'stock-status-out'
                              : isLow
                                ? 'stock-status-low'
                                : 'stock-status-ok'
                          }`}
                        >
                          <span />
                          {isOut
                            ? 'Épuisé'
                            : isLow
                              ? 'Stock faible'
                              : 'Disponible'}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="stock-edit-button"
                          onClick={() => onEdit(product)}
                          title={`Modifier ${product.name}`}
                          aria-label={`Modifier ${product.name}`}
                        >
                          <Pencil size={15} />
                          Modifier
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="stock-table-footer">
          <span>
            Seuil d'alerte : <strong>5 unités ou moins</strong>
          </span>
          <span>
            <Boxes size={14} /> Données du catalogue
          </span>
        </div>
      </section>
    </div>
  )
}
