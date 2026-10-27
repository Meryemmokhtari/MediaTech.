import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  BadgePercent,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Package,
  Plus,
  Tag,
  Trash2,
  RefreshCw,
} from 'lucide-react'
import './Promotions.css'

const API_URL = 'http://localhost:5091/api/products'
const STORAGE_KEY = 'mediatech-promotions'

type Product = {
  id: number
  name: string
  price: number
  stock: number
  category: string
}

type Promotion = {
  id: string
  title: string
  productId: number
  productName: string
  originalPrice: number
  discount: number
  startDate: string
  endDate: string
}

type Status = 'Active' | 'Programmée' | 'Expirée'
type Filter = 'Toutes' | Status

function todayLocal(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatMAD(value: number): string {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    maximumFractionDigits: 2,
  }).format(value)
}

function getStatus(promotion: Promotion): Status {
  const today = todayLocal()

  if (promotion.endDate < today) return 'Expirée'
  if (promotion.startDate > today) return 'Programmée'
  return 'Active'
}

function readSavedPromotions(): Promotion[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return []

    const parsed: unknown = JSON.parse(saved)
    if (!Array.isArray(parsed)) return []

    return parsed.filter((item): item is Promotion => {
      return (
        item !== null &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        typeof item.productName === 'string' &&
        Number.isFinite(item.originalPrice) &&
        Number.isFinite(item.discount) &&
        typeof item.startDate === 'string' &&
        typeof item.endDate === 'string'
      )
    })
  } catch {
    return []
  }
}

function normalizeProducts(data: unknown): Product[] {
  if (!Array.isArray(data)) {
    throw new Error("L'API n'a pas renvoyé une liste de produits.")
  }

  return data.map((item: unknown, index: number) => {
    if (typeof item !== 'object' || item === null) {
      throw new Error(`Produit invalide à la position ${index + 1}.`)
    }

    const record = item as Record<string, unknown>
    const id = Number(record.id ?? record.Id)
    const name = record.name ?? record.Name
    const price = Number(record.price ?? record.Price)
    const stock = Number(record.stock ?? record.Stock)

    if (
      !Number.isFinite(id) ||
      typeof name !== 'string' ||
      !Number.isFinite(price) ||
      !Number.isFinite(stock)
    ) {
      throw new Error(
        'Un produit doit contenir id, name, price et stock.',
      )
    }

    const rawCategory = record.category ?? record.Category

    return {
      id,
      name,
      price,
      stock,
      category:
        typeof rawCategory === 'string' && rawCategory.trim()
          ? rawCategory.trim()
          : 'Sans catégorie',
    }
  })
}

export default function Promotions() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const [promotions, setPromotions] =
    useState<Promotion[]>(readSavedPromotions)
  const [filter, setFilter] = useState<Filter>('Toutes')

  const [title, setTitle] = useState('')
  const [productId, setProductId] = useState('')
  const [discount, setDiscount] = useState('10')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(promotions))
    } catch (error) {
      console.error('Impossible de sauvegarder les promotions.', error)
    }
  }, [promotions])

  useEffect(() => {
    const controller = new AbortController()

    async function loadProducts() {
      setLoading(true)
      setApiError('')

      try {
        const response = await fetch(API_URL, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        })

        if (!response.ok) {
          throw new Error(`Erreur API : ${response.status}`)
        }

        const data: unknown = await response.json()
        const result = normalizeProducts(data)

        setProducts(result)
        setProductId((current) =>
          result.some((product) => String(product.id) === current)
            ? current
            : String(result[0]?.id ?? ''),
        )
      } catch (error) {
        if (controller.signal.aborted) return

        setApiError(
          error instanceof Error
            ? error.message
            : "Impossible de charger les produits depuis l'API.",
        )
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void loadProducts()
    return () => controller.abort()
  }, [reloadKey])

  const selectedProduct = products.find(
    (product) => String(product.id) === productId,
  )

  const discountValue = Number(discount)
  const discountIsValid =
    Number.isFinite(discountValue) &&
    discountValue >= 1 &&
    discountValue <= 99

  const salePrice =
    selectedProduct && discountIsValid
      ? selectedProduct.price * (1 - discountValue / 100)
      : null

  const filteredPromotions = useMemo(
    () =>
      promotions.filter(
        (promotion) =>
          filter === 'Toutes' || getStatus(promotion) === filter,
      ),
    [promotions, filter],
  )

  const activeCount = promotions.filter(
    (promotion) => getStatus(promotion) === 'Active',
  ).length

  const scheduledCount = promotions.filter(
    (promotion) => getStatus(promotion) === 'Programmée',
  ).length

  function createPromotion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')

    if (!selectedProduct) {
      setFormError('Sélectionnez un produit disponible.')
      return
    }

    if (!discountIsValid) {
      setFormError('La réduction doit être comprise entre 1 % et 99 %.')
      return
    }

    if (
      !startDate ||
      !endDate ||
      endDate < startDate
    ) {
      setFormError(
        'La date de fin doit être égale ou postérieure à la date de début.',
      )
      return
    }

    const promotion: Promotion = {
      id: crypto.randomUUID(),
      title: title.trim() || `Promotion ${selectedProduct.name}`,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      originalPrice: selectedProduct.price,
      discount: discountValue,
      startDate,
      endDate,
    }

    setPromotions((current) => [promotion, ...current])
    setTitle('')
    setDiscount('10')
    setStartDate('')
    setEndDate('')
  }

  function deletePromotion(id: string) {
    setPromotions((current) =>
      current.filter((promotion) => promotion.id !== id),
    )
  }

  return (
    <div className="promotions-page">
      <section className="promotions-hero">
        <div>
          <span className="promotions-eyebrow">
            GESTION COMMERCIALE
          </span>
          <h2>Promotions</h2>
          <p>
            Gérez les réductions de vos produits et préparez vos offres
            commerciales.
          </p>
        </div>

        <div className="promotions-hero-icon">
          <BadgePercent size={58} strokeWidth={1.5} />
        </div>
      </section>

      <section className="promotions-stats">
        <article className="promotion-stat-card">
          <span className="promotion-stat-icon">
            <Tag size={21} />
          </span>
          <span className="promotion-stat-label">
            Total des promotions
          </span>
          <strong>{promotions.length}</strong>
        </article>

        <article className="promotion-stat-card">
          <span className="promotion-stat-icon">
            <CheckCircle2 size={21} />
          </span>
          <span className="promotion-stat-label">
            Promotions actives
          </span>
          <strong>{activeCount}</strong>
        </article>

        <article className="promotion-stat-card">
          <span className="promotion-stat-icon">
            <CalendarDays size={21} />
          </span>
          <span className="promotion-stat-label">
            Promotions programmées
          </span>
          <strong>{scheduledCount}</strong>
        </article>
      </section>

      <section className="promotion-panel">
        <div className="promotion-panel-heading">
          <div className="promotion-heading-icon">
            <Plus size={20} />
          </div>
          <div>
            <h3>Créer une promotion</h3>
            <p>
              Choisissez un produit et définissez sa réduction.
            </p>
          </div>
        </div>

        {loading && (
          <p className="promotion-info" role="status">
            Chargement des produits depuis le serveur...
          </p>
        )}

        {apiError && (
          <div className="promotion-error" role="alert">
            <CircleAlert size={19} />
            <div>
              <strong>Chargement des produits impossible</strong>
              <p>{apiError}</p>
              <button
                type="button"
                onClick={() => setReloadKey((value) => value + 1)}
                disabled={loading}
              >
                <RefreshCw size={15} />
                Réessayer
              </button>
            </div>
          </div>
        )}

        {!loading && !apiError && products.length === 0 && (
          <p className="promotion-info">
            Aucun produit disponible dans l'API.
          </p>
        )}

        {!loading && !apiError && products.length > 0 && (
          <form className="promotion-form" onSubmit={createPromotion}>
            <label>
              Nom de la promotion
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ex. Soldes d'automne"
                maxLength={100}
              />
            </label>

            <label>
              Produit
              <select
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
                required
              >
                {products.map((product) => (
                  <option key={product.id} value={String(product.id)}>
                    {product.name} — {formatMAD(product.price)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Réduction (%)
              <input
                type="number"
                min="1"
                max="99"
                step="1"
                value={discount}
                onChange={(event) => setDiscount(event.target.value)}
                required
              />
            </label>

            <div className="promotion-price-preview">
              <span>Prix initial</span>
              <strong>
                {selectedProduct ? formatMAD(selectedProduct.price) : '—'}
              </strong>

              <span>Réduction</span>
              <strong>
                {discountIsValid ? `${discountValue} %` : '—'}
              </strong>

              <span>Prix après réduction</span>
              <strong className="promotion-discounted-price">
                {salePrice !== null ? formatMAD(salePrice) : '—'}
              </strong>
            </div>

            <div className="promotion-date-grid">
              <label>
                Date de début
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  required
                />
              </label>

              <label>
                Date de fin
                <input
                  type="date"
                  min={startDate || undefined}
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  required
                />
              </label>
            </div>

            {formError && (
              <p className="promotion-form-error" role="alert">
                {formError}
              </p>
            )}

            <button type="submit" className="promotion-submit-button">
              <Plus size={18} />
              Créer la promotion
            </button>
          </form>
        )}
      </section>

      <section className="promotion-panel">
        <div className="promotion-list-heading">
          <div>
            <h3>Liste des promotions</h3>
            <p>
              Les promotions de cette liste sont enregistrées dans ce navigateur.
            </p>
          </div>

          <select
            className="promotion-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value as Filter)}
            aria-label="Filtrer les promotions"
          >
            <option value="Toutes">Toutes</option>
            <option value="Active">Actives</option>
            <option value="Programmée">Programmées</option>
            <option value="Expirée">Expirées</option>
          </select>
        </div>

        {filteredPromotions.length === 0 ? (
          <div className="promotion-empty">
            <div className="promotion-empty-icon">
              <Package size={30} />
            </div>
            <strong>Aucune promotion à afficher</strong>
            <p>
              Créez une promotion pour la retrouver dans cette liste.
            </p>
          </div>
        ) : (
          <div className="promotion-list">
            {filteredPromotions.map((promotion) => {
              const status = getStatus(promotion)
              const newPrice =
                promotion.originalPrice * (1 - promotion.discount / 100)

              const statusClass =
                status === 'Active'
                  ? 'active'
                  : status === 'Programmée'
                    ? 'scheduled'
                    : 'expired'

              return (
                <article className="promotion-item" key={promotion.id}>
                  <div className="promotion-item-icon">
                    <BadgePercent size={23} />
                  </div>

                  <div className="promotion-item-main">
                    <h4>{promotion.title}</h4>
                    <p>{promotion.productName}</p>
                    <div className="promotion-item-dates">
                      <CalendarDays size={14} />
                      {promotion.startDate} – {promotion.endDate}
                    </div>
                  </div>

                  <div className="promotion-item-price">
                    <strong>-{promotion.discount}%</strong>
                    <span className="promotion-old-price">
                      {formatMAD(promotion.originalPrice)}
                    </span>
                    <span>{formatMAD(newPrice)}</span>
                  </div>

                  <span className={`promotion-status promotion-status-${statusClass}`}>
                    {status}
                  </span>

                  <button
                    type="button"
                    className="promotion-delete-button"
                    onClick={() => deletePromotion(promotion.id)}
                    aria-label={`Supprimer ${promotion.title}`}
                    title="Supprimer la promotion"
                  >
                    <Trash2 size={17} />
                  </button>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <p className="promotion-disclaimer">
        Les produits proviennent de l'API. Les promotions sont conservées
        dans le stockage local du navigateur et ne sont pas encore enregistrées
        dans MySQL. Le prix original du produit reste inchangé.
      </p>
    </div>
  )
}
