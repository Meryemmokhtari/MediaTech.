import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Boxes, Package, Search, Tags, TrendingUp } from 'lucide-react'
import type { Product } from './types'
import './Categories.css'

const API_URL = 'http://localhost:5091/api/products'

export default function Categories() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(API_URL)
      .then(response => {
        if (!response.ok) throw new Error()
        return response.json()
      })
      .then((data: Product[]) => setProducts(data))
      .catch(() => setError('Impossible de charger les catégories. Vérifiez le backend.'))
      .finally(() => setLoading(false))
  }, [])

  const categories = useMemo(() => {
    const grouped = new Map<string, { count: number; units: number; value: number; lowStock: number }>()

    products.forEach(product => {
      const name = product.category?.trim() || 'Autres'
      const item = grouped.get(name) ?? { count: 0, units: 0, value: 0, lowStock: 0 }
      item.count += 1
      item.units += Math.max(0, Number(product.stock) || 0)
      item.value += Math.max(0, Number(product.price) || 0) * Math.max(0, Number(product.stock) || 0)
      if (Number(product.stock) <= 5) item.lowStock += 1
      grouped.set(name, item)
    })

    return Array.from(grouped, ([name, data]) => ({ name, ...data }))
      .filter(item => item.name.toLowerCase().includes(search.trim().toLowerCase()))
      .sort((a, b) => b.count - a.count)
  }, [products, search])

  const totalUnits = products.reduce((sum, product) => sum + (Number(product.stock) || 0), 0)
  const formatPrice = (price: number) => `${price.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} DH`

  return (
    <div className="categories-page">
      <section className="categories-intro">
        <div>
          <span className="categories-eyebrow"><Tags size={15} /> ORGANISATION DU CATALOGUE</span>
          <h2>Gestion des catégories</h2>
          <p>Consultez les catégories et les produits associés à chacune.</p>
        </div>
        <div className="categories-total-icon"><Tags size={27} /></div>
      </section>

      {error && <p className="categories-error">{error}</p>}

      <section className="categories-stats">
        <article className="category-stat-card">
          <span className="category-stat-icon red"><Tags size={20} /></span>
          <div><span>Catégories</span><strong>{loading ? '...' : new Set(products.map(p => p.category?.trim() || 'Autres')).size}</strong></div>
        </article>
        <article className="category-stat-card">
          <span className="category-stat-icon dark"><Package size={20} /></span>
          <div><span>Produits classés</span><strong>{loading ? '...' : products.length}</strong></div>
        </article>
        <article className="category-stat-card">
          <span className="category-stat-icon orange"><Boxes size={20} /></span>
          <div><span>Unités en stock</span><strong>{loading ? '...' : totalUnits.toLocaleString('fr-FR')}</strong></div>
        </article>
      </section>

      <section className="panel categories-list-panel">
        <div className="categories-list-heading">
          <div><h3>Catalogue par catégorie</h3><p>{categories.length} catégorie(s) affichée(s)</p></div>
          <label className="categories-search">
            <Search size={17} />
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Rechercher une catégorie..." />
          </label>
        </div>

        {loading ? <div className="categories-empty">Chargement des catégories...</div> :
          categories.length === 0 ? (
            <div className="categories-empty">
              <Tags size={30} />
              <strong>{products.length === 0 ? 'Aucune catégorie disponible' : 'Aucun résultat'}</strong>
              <p>{products.length === 0 ? 'Ajoutez des produits pour organiser votre catalogue.' : 'Essayez un autre nom de catégorie.'}</p>
            </div>
          ) : (
            <div className="categories-grid">
              {categories.map((item, index) => (
                <article className="category-card" key={item.name}>
                  <div className="category-card-top">
                    <div className={`category-card-icon color-${index % 4}`}><Tags size={22} /></div>
                    <span className="category-product-count">{item.count} produit(s)</span>
                  </div>
                  <h4>{item.name}</h4>
                  <div className="category-card-metrics">
                    <div><span>Stock disponible</span><strong>{item.units} unités</strong></div>
                    <div><span>Valeur du stock</span><strong>{formatPrice(item.value)}</strong></div>
                  </div>
                  <div className="category-card-footer">
                    <span className={item.lowStock > 0 ? 'category-stock-warning' : 'category-stock-ok'}>
                      <TrendingUp size={14} />
                      {item.lowStock > 0 ? `${item.lowStock} produit(s) à surveiller` : 'Stock en bon état'}
                    </span>
                    <span title="Catégorie consultée"><ArrowRight size={17} /></span>
                  </div>
                </article>
              ))}
            </div>
          )}
      </section>
    </div>
  )
}
