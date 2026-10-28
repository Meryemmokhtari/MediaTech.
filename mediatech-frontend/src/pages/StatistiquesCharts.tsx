import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { BarChart3, Boxes } from 'lucide-react'

type CategoryDatum = {
  category: string
  count: number
  units: number
}

type StockDatum = {
  name: string
  value: number
}

type ChartStats = {
  categoryData: CategoryDatum[]
  stockData: StockDatum[]
  totalProducts: number
}

const STATUS_COLORS: Record<string, string> = {
  Disponible: '#16a34a',
  'Stock faible': '#f5a623',
  Épuisé: '#e53935',
}

export default function StatistiquesCharts({ stats }: { stats: ChartStats }) {
  return (
<div className="statistics-charts">
        <section className="statistics-panel">
          <div className="statistics-panel-heading">
            <div>
              <h3>Produits par catégorie</h3>
              <p>Nombre de références enregistrées</p>
            </div>
            <BarChart3 size={20} />
          </div>

          {stats.categoryData.length === 0 ? (
            <div className="statistics-empty">Aucun produit à analyser.</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={stats.categoryData}
                margin={{ top: 12, right: 10, left: -15, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eeeeee" />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" name="Produits" fill="#e53935" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>

        <section className="statistics-panel">
          <div className="statistics-panel-heading">
            <div>
              <h3>État du stock</h3>
              <p>Répartition des références par état</p>
            </div>
            <Boxes size={20} />
          </div>

          {stats.totalProducts === 0 ? (
            <div className="statistics-empty">Aucun produit à analyser.</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie
                    data={stats.stockData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {stats.stockData.map(entry => (
                      <Cell
                        key={entry.name}
                        fill={STATUS_COLORS[entry.name]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              <div className="statistics-legend">
                {stats.stockData.map(item => (
                  <div key={item.name}>
                    <span style={{ background: STATUS_COLORS[item.name] }} />
                    {item.name}
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="statistics-panel">
          <div className="statistics-panel-heading">
            <div>
              <h3>Unités par catégorie</h3>
              <p>Quantité réelle disponible dans le stock</p>
            </div>
            <Boxes size={20} />
          </div>

          {stats.categoryData.length === 0 ? (
            <div className="statistics-empty">Aucun produit à analyser.</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={stats.categoryData}
                margin={{ top: 12, right: 10, left: -15, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eeeeee" />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="units" name="Unités en stock" fill="#f5a623" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>
      </div>
  )
}
