
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Search,
  BookOpen,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Mail,
  CircleHelp,
  Send,
  CheckCircle2,
  X,
  RefreshCw,
} from 'lucide-react'
import './CentreAide.css'

const PRODUCTS_API_URL = 'http://localhost:5091/api/products'

type Product = {
  id: number
  name: string
  description: string
  price: number
  stock: number
  category: string
}

type FAQ = {
  category: string
  question: string
  answer: string
}

const faqs: FAQ[] = [
  {
    category: 'Produits',
    question: 'Comment ajouter un nouveau produit ?',
    answer:
      'Ouvrez la page Produits, cliquez sur Ajouter un produit, remplissez les informations demandées puis enregistrez.',
  },
  {
    category: 'Produits',
    question: 'Comment modifier ou supprimer un produit ?',
    answer:
      'Dans la liste des produits, utilisez les actions Modifier ou Supprimer associées au produit concerné.',
  },
  {
    category: 'Stock',
    question: 'Comment identifier les produits en rupture de stock ?',
    answer:
      'Consultez la page Stock pour identifier les produits épuisés et ceux dont la quantité est faible.',
  },
  {
    category: 'Statistiques',
    question: 'Comment consulter les statistiques du magasin ?',
    answer:
      'Ouvrez Statistiques pour consulter les indicateurs du stock, sa valeur estimée et la répartition des produits par catégorie.',
  },
  {
    category: 'Paramètres',
    question: 'Comment modifier les paramètres ?',
    answer:
      'Accédez à Paramètres, modifiez les champs souhaités puis enregistrez les modifications.',
  },
  {
    category: 'Général',
    question: 'Les données sont-elles enregistrées automatiquement ?',
    answer:
      "Les produits sont gérés par l'API du projet. La disponibilité et l'enregistrement des données dépendent du fonctionnement du backend et de la base de données.",
  },
]

const topics = [
  {
    name: 'Gestion des produits',
    description: 'Ajouter, modifier et consulter les produits.',
    icon: Package,
    category: 'Produits',
  },
  {
    name: 'Stock et inventaire',
    description: 'Comprendre les niveaux et les alertes de stock.',
    icon: ShoppingCart,
    category: 'Stock',
  },
  {
    name: 'Statistiques',
    description: 'Consulter les indicateurs et les graphiques.',
    icon: BarChart3,
    category: 'Statistiques',
  },
  {
    name: 'Configuration',
    description: 'Configurer les préférences de votre espace.',
    icon: Settings,
    category: 'Paramètres',
  },
]

const subjects = [
  'Question générale',
  'Gestion des produits',
  'Problème de stock',
  'Statistiques',
  'Paramètres',
  'Problème technique',
]

function formatMAD(value: number): string {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    maximumFractionDigits: 2,
  }).format(value)
}

function normalizeProducts(data: unknown): Product[] {
  let items: unknown[]

  if (Array.isArray(data)) {
    items = data
  } else if (
    typeof data === 'object' &&
    data !== null &&
    'value' in data &&
    Array.isArray((data as { value?: unknown }).value)
  ) {
    items = (data as { value: unknown[] }).value
  } else {
    throw new Error("L'API n'a pas renvoyé une liste de produits valide.")
  }

  return items.map((item: unknown, index: number) => {
    if (typeof item !== 'object' || item === null) {
      throw new Error(`Le produit numéro ${index + 1} est invalide.`)
    }

    const record = item as Record<string, unknown>
    const price = Number(record.price)
    const stock = Number(record.stock)

    if (
      typeof record.name !== 'string' ||
      record.name.trim() === '' ||
      record.price == null ||
      !Number.isFinite(price) ||
      record.stock == null ||
      !Number.isFinite(stock)
    ) {
      throw new Error(
        "Le format d'un produit est invalide. Vérifiez les champs name, price et stock de l'API.",
      )
    }

    return {
      id: Number.isFinite(Number(record.id))
        ? Number(record.id)
        : index + 1,
      name: record.name,
      description:
        typeof record.description === 'string'
          ? record.description
          : '',
      price,
      stock,
      category:
        typeof record.category === 'string' &&
        record.category.trim() !== ''
          ? record.category.trim()
          : 'Sans catégorie',
    }
  })
}

export default function CentreAide() {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<number | null>(0)

  const [products, setProducts] = useState<Product[]>([])
  const [apiLoading, setApiLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [reloadProducts, setReloadProducts] = useState(0)

  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('Question générale')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function loadProducts() {
      setApiLoading(true)
      setApiError('')

      try {
        const response = await fetch(PRODUCTS_API_URL, {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(
            `Erreur API ${response.status} : ${response.statusText || 'requête impossible'}`,
          )
        }

        const data: unknown = await response.json()
        const normalizedProducts = normalizeProducts(data)

        setProducts(normalizedProducts)
      } catch (error: unknown) {
        if (controller.signal.aborted) return

        console.error('Erreur de chargement des produits :', error)

        setApiError(
          error instanceof Error
            ? error.message
            : "Impossible de charger les données de l'API.",
        )
      } finally {
        if (!controller.signal.aborted) {
          setApiLoading(false)
        }
      }
    }

    void loadProducts()

    return () => controller.abort()
  }, [reloadProducts])

  const filteredFaqs = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('fr')

    if (!query) return faqs

    return faqs.filter((item) =>
      `${item.question} ${item.answer} ${item.category}`
        .toLocaleLowerCase('fr')
        .includes(query),
    )
  }, [search])

  const totalProducts = products.length

  const totalStock = products.reduce(
    (total, product) => total + Math.max(0, product.stock),
    0,
  )

  const productsToWatch = products.filter(
    (product) => product.stock <= 5,
  ).length

  const inventoryValue = products.reduce(
    (total, product) =>
      total + product.price * Math.max(0, product.stock),
    0,
  )

  const totalCategories = new Set(
    products.map((product) => product.category),
  ).size

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(false)

    const supportMessage = [
      "Demande d'aide MediaTech",
      `Sujet : ${subject}`,
      `E-mail du demandeur : ${email}`,
      '',
      message,
    ].join('\n')

    const mailto = `mailto:?subject=${encodeURIComponent(
      `MediaTech - ${subject}`,
    )}&body=${encodeURIComponent(supportMessage)}`

    window.location.href = mailto
    setSubmitted(true)
  }

  return (
    <div className="help-page">
      {/* HERO */}
      <section className="help-hero">
        <div className="help-hero-content">
          <span className="help-eyebrow">
            CENTRE D'ASSISTANCE
          </span>

          <h2>Comment pouvons-nous vous aider ?</h2>

          <p>
            Retrouvez des réponses à vos questions et apprenez
            à utiliser MediaTech plus facilement.
          </p>

          <div className="help-search">
            <Search size={20} aria-hidden="true" />

            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setExpanded(null)
              }}
              placeholder="Rechercher une question, un sujet..."
              aria-label="Rechercher dans les questions fréquentes"
            />

            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setExpanded(null)
                }}
                aria-label="Effacer la recherche"
                title="Effacer la recherche"
              >
                <X size={17} />
              </button>
            )}
          </div>
        </div>

        <div className="help-hero-icon">
          <CircleHelp size={82} strokeWidth={1.3} />
        </div>
      </section>

      {/* DONNÉES RÉELLES DE L'API */}
      <section className="help-live-section">
        <div className="help-section-heading">
          <div>
            <h3>État de votre inventaire</h3>
            <p>
              Indicateurs calculés à partir des produits renvoyés par votre API.
            </p>
          </div>

          <button
            type="button"
            className="help-refresh-button"
            onClick={() =>
              setReloadProducts((value) => value + 1)
            }
            disabled={apiLoading}
          >
            <RefreshCw
              size={15}
              className={apiLoading ? 'help-spin' : ''}
            />
            {apiLoading ? 'Chargement...' : 'Actualiser'}
          </button>
        </div>

        {apiLoading && (
          <div className="help-api-status" role="status">
            Chargement des données depuis le serveur...
          </div>
        )}

        {apiError && (
          <div className="help-api-error" role="alert">
            <strong>Connexion à l'API impossible</strong>
            <p>{apiError}</p>
            <p>
              Vérifiez que le backend fonctionne sur le port 5091
              et que CORS autorise l'adresse de votre frontend.
            </p>

            <button
              type="button"
              onClick={() =>
                setReloadProducts((value) => value + 1)
              }
              disabled={apiLoading}
            >
              Réessayer
            </button>
          </div>
        )}

        {!apiLoading && !apiError && (
          <>
            <div className="help-live-grid">
              <article className="help-live-card">
                <span className="help-live-icon">
                  <Package size={21} />
                </span>
                <p>Produits enregistrés</p>
                <strong>{totalProducts}</strong>
              </article>

              <article className="help-live-card">
                <span className="help-live-icon">
                  <ShoppingCart size={21} />
                </span>
                <p>Unités en stock</p>
                <strong>{totalStock}</strong>
              </article>

              <article className="help-live-card">
                <span className="help-live-icon">
                  <CircleHelp size={21} />
                </span>
                <p>Produits à surveiller</p>
                <strong>{productsToWatch}</strong>
                <small>Stock inférieur ou égal à 5</small>
              </article>

              <article className="help-live-card">
                <span className="help-live-icon">
                  <BarChart3 size={21} />
                </span>
                <p>Valeur estimée du stock</p>
                <strong className="help-live-value">
                  {formatMAD(inventoryValue)}
                </strong>
                <small>{totalCategories} catégories</small>
              </article>
            </div>

            <p className="help-api-updated">
              <CheckCircle2 size={15} />
              Données reçues avec succès depuis l'API.
            </p>
          </>
        )}
      </section>

      {/* RUBRIQUES */}
      <section className="help-topics">
        <div className="help-section-heading">
          <div>
            <h3>Explorer les rubriques</h3>
            <p>
              Choisissez un sujet pour découvrir les conseils disponibles.
            </p>
          </div>
        </div>

        <div className="help-topic-grid">
          {topics.map((topic) => {
            const Icon = topic.icon

            return (
              <button
                type="button"
                className="help-topic-card"
                key={topic.name}
                onClick={() => {
                  setSearch(topic.category)
                  setExpanded(null)
                }}
              >
                <span className="help-topic-icon">
                  <Icon size={22} />
                </span>

                <strong>{topic.name}</strong>

                <span>{topic.description}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* QUESTIONS FRÉQUENTES */}
      <section className="help-faq-section">
        <div className="help-section-heading">
          <div>
            <h3>Questions fréquentes</h3>
            <p>Les réponses aux questions les plus courantes.</p>
          </div>

          <BookOpen size={22} />
        </div>

        <div className="help-faq-list">
          {filteredFaqs.length === 0 ? (
            <div className="help-no-results">
              Aucune question ne correspond à votre recherche.
              Essayez un autre mot-clé.
            </div>
          ) : (
            filteredFaqs.map((item) => {
              const originalIndex = faqs.indexOf(item)
              const isOpen = expanded === originalIndex

              return (
                <article
                  className="help-faq-item"
                  key={item.question}
                >
                  <button
                    type="button"
                    className="help-faq-question"
                    onClick={() =>
                      setExpanded(isOpen ? null : originalIndex)
                    }
                    aria-expanded={isOpen}
                  >
                    <span>{item.question}</span>

                    {isOpen ? (
                      <ChevronUp size={19} />
                    ) : (
                      <ChevronDown size={19} />
                    )}
                  </button>

                  {isOpen && (
                    <div className="help-faq-answer">
                      <span>{item.category}</span>
                      <p>{item.answer}</p>
                    </div>
                  )}
                </article>
              )
            })
          )}
        </div>
      </section>

      {/* CONTACT */}
      <section className="help-contact">
        <div className="help-contact-intro">
          <div className="help-contact-icon">
            <MessageCircle size={25} />
          </div>

          <h3>Vous n'avez pas trouvé de réponse ?</h3>

          <p>
            Décrivez votre problème pour préparer un message
            destiné à l'assistance.
          </p>

          <div className="help-contact-note">
            <Mail size={16} />
            <span>
              Le message sera préparé dans votre application de
              messagerie. Vous devrez vérifier le destinataire et
              confirmer l'envoi.
            </span>
          </div>
        </div>

        <form
          className="help-contact-form"
          onSubmit={handleSubmit}
        >
          <label>
            Sujet

            <select
              value={subject}
              onChange={(event) => {
                setSubject(event.target.value)
                setSubmitted(false)
              }}
            >
              {subjects.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            Votre adresse e-mail

            <input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setSubmitted(false)
              }}
              placeholder="vous@exemple.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Description du problème

            <textarea
              value={message}
              onChange={(event) => {
                setMessage(event.target.value)
                setSubmitted(false)
              }}
              placeholder="Expliquez-nous ce dont vous avez besoin..."
              rows={4}
              required
            />
          </label>

          <button type="submit" className="help-send-button">
            <Send size={17} />
            Préparer le message
          </button>

          {submitted && (
            <p className="help-submit-note" role="status">
              <CheckCircle2 size={17} />
              <span>
                Vérifiez si votre application de messagerie s'est
                ouverte. Le destinataire doit être renseigné avant
                l'envoi.
              </span>
            </p>
          )}
        </form>
      </section>
    </div>
  )
}

