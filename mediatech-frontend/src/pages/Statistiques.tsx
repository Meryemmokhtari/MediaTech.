import { useEffect, useMemo, useState } from 'react'
import { BarChart3, Boxes, Package, AlertTriangle, CircleDollarSign } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import type { Product } from './types'
import './Statistiques.css'

const API_URL = 'http://localhost:5091/api/products'
const COLORS = ['#e53935', '#ff8a80', '#f5a623', '#64748b']

export default function Statistiques() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(API_URL)
      .then(response => {
        if (!response.ok) throw new Error()
        return response.json()
      })
      .then((data: Product[]) => setProducts(data))
      .catch(() => setError('Impossible de charger les statistiques. Vérifiez le backend.'))
      .finally(() => setLoading(false))
  }, [])

  const stats = useMemo(() => {
    const totalUnits = products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0)
    const stockValue = products.reduce((sum, p) => sum + (Number(p.price) || 0) * (Number(p.stock) || 0), 0)
    const lowStock = products.filter(p => Number(p.stock) > 0 && Number(p.stock) <= 5).length
    const outOfStock = products.filter(p => Number(p.stock) <= 0).length

    const categoryData = Object.values(products.reduce<Record<string, { category: string; count: number; units: number }>>((acc, p) => {
      const category = p.category || 'Sans catégorie'
      if (!acc[category]) acc[category] = { category, count: 0, units: 0 }
      acc[category].count += 1
      acc[category].units += Number(p.stock) || 0
      return acc
    }, {}))

    const stockData = [
      { name: 'Disponible', value: products.filter(p => Number(p.stock) > 5).length },
      { name: 'Stock faible', value: lowStock },
      { name: 'Épuisé', value: outOfStock },
    ].filter(item => item.value > 0)

    return { totalProducts: products.length, totalUnits, stockValue, lowStock, outOfStock, categoryData, stockData }
  }, [products])

  const formatPrice = (value: number) => `${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} DH`

  return (
    <div className="statistics-page">
      <div className="statistics-heading">
        <div><h2>Statistiques</h2><p>Analyse globale de vos produits et de votre stock.</p></div>
        <span className="statistics-live"><span /> Données actuelles</span>
      </div>

      {error && <p className="statistics-error">{error}</p>}
      {loading && <p>Chargement des statistiques...</p>}

      <div className="statistics-cards">
        <article className="stat-card"><div className="stat-icon red"><Package size={21} /></div><span>Produits</span><strong>{loading ? '...' : stats.totalProducts}</strong><small>Références enregistrées</small></article>
        <article className="stat-card"><div className="stat-icon blue"><Boxes size={21} /></div><span>Unités en stock</span><strong>{loading ? '...' : stats.totalUnits.toLocaleString('fr-FR')}</strong><small>Quantité totale disponible</small></article>
        <article className="stat-card"><div className="stat-icon orange"><AlertTriangle size={21} /></div><span>Alertes de stock</span><strong>{loading ? '...' : stats.lowStock + stats.outOfStock}</strong><small>{stats.lowStock} faibles · {stats.outOfStock} épuisés</small></article>
        <article className="stat-card"><div className="stat-icon green"><CircleDollarSign size={21} /></div><span>Valeur du stock</span><strong className="stat-value">{loading ? '...' : formatPrice(stats.stockValue)}</strong><small>Prix × quantité en stock</small></article>
      </div>

      <div className="statistics-charts">
        <section className="statistics-panel">
          <div className="statistics-panel-heading"><div><h3>Produits par catégorie</h3><p>Nombre de références et unités en stock</p></div><BarChart3 size={20} /></div>
          {stats.categoryData.length === 0 ? <div className="statistics-empty">Aucun produit à analyser.</div> : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.categoryData} margin={{ top: 15, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eeeeee" />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" name="Produits" fill="#e53935" radius={[5, 5, 0, 0]} />
                <Bar dataKey="units" name="Unités en stock" fill="#ffaaa5" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>

        <section className="statistics-panel">
          <div className="statistics-panel-heading"><div><h3>État du stock</h3><p>Répartition des produits</p></div><Boxes size={20} /></div>
          {stats.totalProducts === 0 ? <div className="statistics-empty">Aucun produit à analyser.</div> : (
            <>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={stats.stockData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4}>
                    {stats.stockData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="statistics-legend">
                {stats.stockData.map((item, index) => <div key={item.name}><span style={{ background: COLORS[index % COLORS.length] }} />{item.name}<strong>{item.value}</strong></div>)}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
