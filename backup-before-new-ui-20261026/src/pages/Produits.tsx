
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Package, Plus, Search, Pencil, Trash2, X, RefreshCw } from 'lucide-react'
import './Produits.css'
import type { Product } from './types'

const API_URL = 'http://localhost:5091/api/products'


const initialForm = {
  name: '',
  description: '',
  price: 0,
  stock: 0,
  category: 'Ordinateurs',
}

export default function Produits() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)

  async function loadProducts() {
    setLoading(true)
    try {
      const response = await fetch(API_URL)
      if (!response.ok) throw new Error('Erreur de chargement')
      setProducts(await response.json())
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

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim()
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    )
  }, [products, search])

  function addProduct() {
    setEditing(null)
    setForm({ ...initialForm })
    setShowForm(true)
  }

  function editProduct(product: Product) {
    setEditing(product)
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      category: product.category || 'Ordinateurs',
    })
    setShowForm(true)
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const response = await fetch(
        editing ? `${API_URL}/${editing.id}` : API_URL,
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            price: Number(form.price),
            stock: Number(form.stock),
          }),
        }
      )

      if (!response.ok) throw new Error('Échec de l’enregistrement.')

      setShowForm(false)
      await loadProducts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setSaving(false)
    }
  }

  async function removeProduct(product: Product) {
    if (!window.confirm(`Supprimer le produit "${product.name}" ?`)) return

    try {
      const response = await fetch(`${API_URL}/${product.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error()
      await loadProducts()
    } catch {
      setError('Impossible de supprimer ce produit.')
    }
  }

  const stockTotal = products.reduce((sum, p) => sum + p.stock, 0)
  const stockValue = products.reduce((sum, p) => sum + p.price * p.stock, 0)

  return (
    <main className="products-page">
      <header className="products-header">
        <div>
          <span className="products-eyebrow">INVENTAIRE</span>
          <h1>Produits</h1>
          <p>Gérez les produits de votre boutique MediaTech.</p>
        </div>

        <button className="product-primary-btn" onClick={addProduct}>
          <Plus size={18} /> Ajouter un produit
        </button>
      </header>

      {error && (
        <div className="products-error">
          <span>{error}</span>
          <button onClick={() => setError('')} aria-label="Fermer">
            <X size={17} />
          </button>
        </div>
      )}

      <section className="products-stats">
        <article className="product-stat-card">
          <Package size={25} />
          <div>
            <p>Total des produits</p>
            <h2>{products.length}</h2>
          </div>
        </article>

        <article className="product-stat-card">
          <Package size={25} />
          <div>
            <p>Unités en stock</p>
            <h2>{stockTotal}</h2>
          </div>
        </article>

        <article className="product-stat-card">
          <Package size={25} />
          <div>
            <p>Valeur du stock</p>
            <h2>{stockValue.toLocaleString('fr-FR')} MAD</h2>
          </div>
        </article>
      </section>

      <section className="products-panel">
        <div className="products-toolbar">
          <div>
            <h2>Liste des produits</h2>
            <p>{filteredProducts.length} produit(s)</p>
          </div>

          <div className="products-search">
            <Search size={18} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un produit..."
            />
          </div>

          <button
            className="product-refresh-btn"
            onClick={() => void loadProducts()}
            title="Actualiser"
          >
            <RefreshCw size={17} />
          </button>
        </div>

        {loading ? (
          <p className="products-empty">Chargement...</p>
        ) : filteredProducts.length === 0 ? (
          <div className="products-empty">
            <Package size={35} />
            <h3>Aucun produit trouvé</h3>
            <p>Ajoutez un produit ou changez votre recherche.</p>
          </div>
        ) : (
          <div className="products-table-wrap">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Catégorie</th>
                  <th>Prix</th>
                  <th>Stock</th>
                  <th>Valeur du stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => (
                  <tr key={product.id}>
                    <td>
                      <div className="product-name-cell">
                        <span className="product-avatar">
                          <Package size={20} />
                        </span>
                        <div>
                          <strong>{product.name}</strong>
                          <small>{product.description || 'Sans description'}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="product-category">
                        {product.category || 'Non classé'}
                      </span>
                    </td>
                    <td>{product.price.toLocaleString('fr-FR')} MAD</td>
                    <td>
                      <span className={
                        product.stock === 0 ? 'stock-badge stock-out'
                          : product.stock <= 5 ? 'stock-badge stock-low'
                            : 'stock-badge stock-ok'
                      }>
                        {product.stock === 0 ? 'Épuisé' : product.stock}
                      </span>
                    </td>
                    <td>
                      {(product.price * product.stock).toLocaleString('fr-FR')} MAD
                    </td>
                    <td>
                      <div className="product-actions">
                        <button onClick={() => editProduct(product)} title="Modifier">
                          <Pencil size={17} />
                        </button>
                        <button
                          className="product-delete-btn"
                          onClick={() => void removeProduct(product)}
                          title="Supprimer"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showForm && (
        <div className="product-modal-overlay">
          <section className="product-modal">
            <header className="product-modal-header">
              <div>
                <h2>{editing ? 'Modifier le produit' : 'Ajouter un produit'}</h2>
                <p>Remplissez les informations ci-dessous.</p>
              </div>
              <button onClick={() => setShowForm(false)} aria-label="Fermer">
                <X size={20} />
              </button>
            </header>

            <form onSubmit={submitForm}>
              <label>
                Nom du produit *
                <input
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex. Laptop HP"
                />
              </label>

              <label>
                Description
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Description du produit"
                />
              </label>

              <div className="product-form-row">
                <label>
                  Prix (MAD) *
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: Number(e.target.value) })}
                  />
                </label>

                <label>
                  Stock *
                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={e => setForm({ ...form, stock: Number(e.target.value) })}
                  />
                </label>
              </div>

              <label>
                Catégorie *
                <input
                  required
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  placeholder="Ex. Ordinateurs"
                />
              </label>

              <footer className="product-modal-footer">
                <button
                  type="button"
                  className="product-cancel-btn"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                >
                  Annuler
                </button>
                <button className="product-primary-btn" type="submit" disabled={saving}>
                  {saving ? 'Enregistrement...' : editing ? 'Enregistrer' : 'Ajouter'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}
