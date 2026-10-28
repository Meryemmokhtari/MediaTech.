
import { useMemo, useState } from 'react'
import {
  ArrowRight,
  Boxes,
  Package,
  Search,
  Tags,
  TrendingUp,
} from 'lucide-react'
import type { Product } from './types'
import './Categories.css'

type CategoriesProps = {
  products: Product[]
  onSelectCategory: (category: string) => void
}

export default function Categories({
  products,
  onSelectCategory,
}: CategoriesProps) {
  const [search, setSearch] = useState('')

  const categories = useMemo(() => {
    const grouped = new Map<
      string,
      { count: number; units: number; value: number; lowStock: number }
    >()

    products.forEach((product) => {
      const name = product.category?.trim() || 'Autres'
      const current = grouped.get(name) ?? {
        count: 0,
        units: 0,
        value: 0,
        lowStock: 0,
      }

      current.count += 1
      current.units += Math.max(0, Number(product.stock) || 0)
      current.value +=
        Math.max(0, Number(product.price) || 0) *
        Math.max(0, Number(product.stock) || 0)

      if (product.stock <= 5) current.lowStock += 1

      grouped.set(name, current)
    })

    return Array.from(grouped, ([name, data]) => ({ name, ...data }))
      .filter((item) =>
        item.name.toLowerCase().includes(search.trim().toLowerCase()),
      )
      .sort((a, b) => b.count - a.count)
  }, [products, search])

  const totalCategories = new Set(
    products.map((product) => product.category?.trim() || 'Autres'),
  ).size

  const totalUnits = products.reduce(
    (sum, product) => sum + Math.max(0, Number(product.stock) || 0),
    0,
  )

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      maximumFractionDigits: 2,
    }).format(price)

  return (
    <div className="categories-page">
      <section className="categories-intro">
        <div>
          <span className="categories-eyebrow">
            <Tags size={15} /> ORGANISATION DU CATALOGUE
          </span>
          <h2>Gestion des catégories</h2>
          <p>
            Explore les catégories et consulte les produits
            associés à chacune.
          </p>
        </div>

        <div className="categories-total-icon">
          <Tags size={27} />
        </div>
      </section>

      <section className="categories-stats">
        <article className="category-stat-card">
          <span className="category-stat-icon red">
            <Tags size={20} />
          </span>
          <div>
            <span>Catégories</span>
            <strong>{totalCategories}</strong>
          </div>
        </article>

        <article className="category-stat-card">
          <span className="category-stat-icon dark">
            <Package size={20} />
          </span>
          <div>
            <span>Produits classés</span>
            <strong>{products.length}</strong>
          </div>
        </article>

        <article className="category-stat-card">
          <span className="category-stat-icon orange">
            <Boxes size={20} />
          </span>
          <div>
            <span>Unités en stock</span>
            <strong>{totalUnits.toLocaleString('fr-MA')}</strong>
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
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher une catégorie..."
            />
          </label>
        </div>

        {categories.length === 0 ? (
          <div className="categories-empty">
            <Tags size={30} />
            <strong>
              {products.length === 0
                ? 'Aucune catégorie disponible'
                : 'Aucun résultat'}
            </strong>
            <p>
              {products.length === 0
                ? 'Ajoute des produits pour organiser ton catalogue.'
                : 'Essaie un autre nom de catégorie.'}
            </p>
          </div>
        ) : (
          <div className="categories-grid">
            {categories.map((item, index) => (
              <article className="category-card" key={item.name}>
                <div className="category-card-top">
                  <div className={`category-card-icon color-${index % 4}`}>
                    <Tags size={22} />
                  </div>

                  <span className="category-product-count">
                    {item.count} produit{item.count > 1 ? 's' : ''}
                  </span>
                </div>

                <h4>{item.name}</h4>

                <div className="category-card-metrics">
                  <div>
                    <span>Stock disponible</span>
                    <strong>{item.units} unités</strong>
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

                  <button
                    type="button"
                    onClick={() =>
                      onSelectCategory(
                        item.name === 'Autres' ? 'Toutes' : item.name,
                      )
                    }
                    title={`Consulter ${item.name}`}
                    aria-label={`Consulter les produits de ${item.name}`}
                  >
                    <ArrowRight size={17} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
