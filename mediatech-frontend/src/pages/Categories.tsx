import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Boxes,
  Package,
  Search,
  Tags,
  TrendingUp,
  X,
} from 'lucide-react'
import type { Product } from './types'
import './Categories.css'

const API_URL = 'http://localhost:5091/api/products'

export default function Categories() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(API_URL)
      .then(async response => {
        if (!response.ok) {
          throw new Error('Erreur HTTP')
        }

        const data: unknown = await response.json()

        // Accepter une liste directe ou une réponse contenant "value"
        let list: unknown[] | null = null

        if (Array.isArray(data)) {
          list = data
        } else if (
          typeof data === 'object' &&
          data !== null &&
          'value' in data &&
          Array.isArray(data.value)
        ) {
          list = data.value
        }

        if (!list) {
          throw new Error('Format des produits invalide')
        }

        setProducts(list as Product[])
        setError('')
      })
      .catch(() => {
        setError('Impossible de charger les catégories. Vérifiez le backend.')
      })
      .finally(() => setLoading(false))
  }, [])

  const categories = useMemo(() => {
    const grouped = new Map<
      string,
      { count: number; units: number; value: number; lowStock: number }
    >()

    products.forEach(product => {
      const name = product.category?.trim() || 'Autres'
      const item = grouped.get(name) ?? {
        count: 0,
        units: 0,
        value: 0,
        lowStock: 0,
      }

      const stock = Math.max(0, Number(product.stock) || 0)
      const price = Math.max(0, Number(product.price) || 0)

      item.count += 1
      item.units += stock
      item.value += price * stock

      if (stock <= 5) {
        item.lowStock += 1
      }

      grouped.set(name, item)
    })

    return Array.from(grouped, ([name, data]) => ({ name, ...data }))
      .filter(item =>
        item.name.toLowerCase().includes(search.trim().toLowerCase())
      )
      .sort((a, b) => b.count - a.count)
  }, [products, search])

  const selectedProducts = useMemo(
    () =>
      selectedCategory
        ? products.filter(
            product =>
              (product.category?.trim() || 'Autres') === selectedCategory
          )
        : [],
    [products, selectedCategory]
  )

  const totalUnits = products.reduce(
    (sum, product) => sum + Math.max(0, Number(product.stock) || 0),
    0
  )

  const categoryCount = new Set(
    products.map(product => product.category?.trim() || 'Autres')
  ).size

  const formatPrice = (price: number) =>
    `${price.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} DH`

  function toggleCategory(name: string) {
    setSelectedCategory(current => (current === name ? null : name))
  }

  return (
    <div className="categories-page">
      <section className="categories-intro">
        <div>
          <span className="categories-eyebrow">
            <Tags size={15} /> ORGANISATION DU CATALOGUE
          </span>
          <h2>Gestion des catégories</h2>
          <p>Consultez les catégories et les produits associés à chacune.</p>
        </div>
        <div className="categories-total-icon">
          <Tags size={27} />
        </div>
      </section>

      {error && <p className="categories-error">{error}</p>}

      <section className="categories-stats">
        <article className="category-stat-card">
          <span className="category-stat-icon red"><Tags size={20} /></span>
          <div>
            <span>Catégories</span>
            <strong>{loading ? '...' : categoryCount}</strong>
          </div>
        </article>

        <article className="category-stat-card">
          <span className="category-stat-icon dark"><Package size={20} /></span>
          <div>
            <span>Produits classés</span>
            <strong>{loading ? '...' : products.length}</strong>
          </div>
        </article>

        <article className="category-stat-card">
          <span className="category-stat-icon orange"><Boxes size={20} /></span>
          <div>
            <span>Unités en stock</span>
            <strong>
              {loading ? '...' : totalUnits.toLocaleString('fr-FR')}
            </strong>
          </div>
        </article>
      </section>

      <section className="panel categories-list-panel">
        <div className="categories-list-heading">
          <div>
            <h3>Catalogue par catégorie</h3>
            <p>{categories.length} catégorie(s) affichée(s)</p>
          </div>

          <label className="categories-search">
            <Search size={17} />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Rechercher une catégorie..."
            />
          </label>
        </div>

        {loading ? (
          <div className="categories-empty">Chargement des catégories...</div>
        ) : categories.length === 0 ? (
          <div className="categories-empty">
            <Tags size={30} />
            <strong>
              {products.length === 0
                ? 'Aucune catégorie disponible'
                : 'Aucun résultat'}
            </strong>
            <p>
              {products.length === 0
                ? 'Ajoutez des produits pour organiser votre catalogue.'
                : 'Essayez un autre nom de catégorie.'}
            </p>
          </div>
        ) : (
          <div className="categories-grid">
            {categories.map((item, index) => (
              <article
                className={`category-card ${
                  selectedCategory === item.name ? 'category-card-selected' : ''
                }`}
                key={item.name}
                role="button"
                tabIndex={0}
                aria-pressed={selectedCategory === item.name}
                onClick={() => toggleCategory(item.name)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    toggleCategory(item.name)
                  }
                }}
              >
                <div className="category-card-top">
                  <div className={`category-card-icon color-${index % 4}`}>
                    <Tags size={22} />
                  </div>
                  <span className="category-product-count">
                    {item.count} produit(s)
                  </span>
                </div>

                <h4>{item.name}</h4>

                <div className="category-card-metrics">
                  <div>
                    <span>Stock disponible</span>
                    <strong>{item.units.toLocaleString('fr-FR')} unités</strong>
                  </div>
                  <div>
                    <span>Valeur du stock</span>
                    <strong>{formatPrice(item.value)}</strong>
                  </div>
                </div>

                <div className="category-card-footer">
                  <span
                    className={
                      item.lowStock > 0
                        ? 'category-stock-warning'
                        : 'category-stock-ok'
                    }
                  >
                    <TrendingUp size={14} />
                    {item.lowStock > 0
                      ? `${item.lowStock} produit(s) à surveiller`
                      : 'Stock en bon état'}
                  </span>
                  <span title="Afficher les produits">
                    <ArrowRight size={17} />
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedCategory && (
        <section className="panel category-products-panel">
          <div className="category-products-heading">
            <div>
              <h3>Produits : {selectedCategory}</h3>
              <p>{selectedProducts.length} produit(s) dans cette catégorie</p>
            </div>
            <button
              type="button"
              className="category-close-button"
              onClick={() => setSelectedCategory(null)}
              aria-label="Fermer la catégorie"
            >
              <X size={18} />
              Fermer
            </button>
          </div>

          {selectedProducts.length === 0 ? (
            <div className="categories-empty">
              Aucun produit dans cette catégorie.
            </div>
          ) : (
            <div className="category-products-grid">
              {selectedProducts.map(product => (
                <article className="category-product-card" key={product.id}>
                  <div className="category-product-visual">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        loading="lazy"
                      />
                    ) : (
                      <Package size={34} />
                    )}
                  </div>

                  <div className="category-product-info">
                    <strong>{product.name}</strong>
                    <p>{product.description || 'Aucune description disponible'}</p>
                    <span className="category-product-price">
                      {formatPrice(Number(product.price) || 0)}
                    </span>
                    <span className="category-product-stock">
                      Stock : {Math.max(0, Number(product.stock) || 0)} unités
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
