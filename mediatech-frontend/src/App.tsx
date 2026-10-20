
import { useEffect, useState } from 'react'
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

const API_URL = 'http://localhost:5091/api/products'

function App() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Toutes')

  useEffect(() => {
    fetch(API_URL)
      .then((response) => {
        if (!response.ok) throw new Error('Erreur lors du chargement')
        return response.json()
      })
      .then((data: Product[]) => setProducts(data))
      .catch(() => setError('Impossible de charger les produits. Vérifiez que l’API est démarrée.'))
      .finally(() => setLoading(false))
  }, [])

  const categories = [
    'Toutes',
    ...new Set(products.map((product) => product.category).filter(Boolean)),
  ]

  const filteredProducts = products.filter((product) => {
    const matchesSearch = `${product.name} ${product.description} ${product.category}`
      .toLowerCase()
      .includes(search.toLowerCase())

    const matchesCategory =
      category === 'Toutes' || product.category === category

    return matchesSearch && matchesCategory
  })

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      maximumFractionDigits: 2,
    }).format(price)

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#">
          Media<span>Tech</span>
        </a>
        <span className="brand-tagline">Votre technologie, notre passion.</span>
        <div className="api-status">
          <span className="status-dot" />
          Catalogue produits
        </div>
      </header>

      <main>
        <section className="hero-banner">
          <div className="hero-content">
            <span className="eyebrow">TECHNOLOGIE & INNOVATION</span>
            <h1>
              La technologie
              <br />
              <span>à portée de main.</span>
            </h1>
            <p>
              Découvrez notre sélection de produits informatiques et
              électroniques au meilleur prix.
            </p>
            <a className="hero-button" href="#catalogue">
              Découvrir les produits <span>→</span>
            </a>
          </div>
          <div className="hero-decoration" aria-hidden="true">
            <div className="decoration-circle">MT</div>
            <span className="decoration-chip">INNOVATION</span>
          </div>
        </section>

        <section className="catalogue" id="catalogue">
          <div className="section-heading">
            <div>
              <span className="eyebrow">NOTRE SÉLECTION</span>
              <h2>Nos produits</h2>
              <p>Des équipements adaptés à vos besoins.</p>
            </div>
            <div className="product-count">
              <strong>{filteredProducts.length}</strong>
              <span>produit(s)</span>
            </div>
          </div>

          <div className="filters">
            <div className="search-box">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                placeholder="Rechercher un produit..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Rechercher un produit"
              />
            </div>

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              aria-label="Filtrer par catégorie"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="feedback">Chargement des produits...</p>
          ) : error ? (
            <div className="feedback error-message">
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>
                Réessayer
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <p className="feedback">Aucun produit trouvé.</p>
          ) : (
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <article className="product-card" key={product.id}>
                  <div className="product-image">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} />
                    ) : (
                      <div className="image-placeholder">
                        <span>MT</span>
                        <small>{product.category || 'TECHNOLOGIE'}</small>
                      </div>
                    )}
                    <span className="category-badge">
                      {product.category || 'Autres'}
                    </span>
                  </div>

                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p className="product-description">
                      {product.description || 'Découvrez ce produit chez MediaTech.'}
                    </p>

                    <div className="product-bottom">
                      <strong className="product-price">
                        {formatPrice(product.price)}
                      </strong>
                      <span
                        className={`stock-badge ${
                          product.stock === 0
                            ? 'out-of-stock'
                            : product.stock <= 5
                              ? 'low-stock'
                              : ''
                        }`}
                      >
                        {product.stock === 0
                          ? 'Épuisé'
                          : product.stock <= 5
                            ? 'Stock faible'
                            : 'En stock'}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        <a className="brand footer-brand" href="#">
          Media<span>Tech</span>
        </a>
        <p>© {new Date().getFullYear()} MediaTech. Tous droits réservés.</p>
        <span>La technologie en toute confiance.</span>
      </footer>
    </div>
  )
}

export default App
