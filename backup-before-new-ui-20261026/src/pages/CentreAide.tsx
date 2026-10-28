
import { useMemo, useState } from 'react'
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
} from 'lucide-react'
import './CentreAide.css'

const faqs = [
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
      'Consultez la page Stock. Elle permet de filtrer les produits selon leur niveau de stock et de repérer les produits épuisés.',
  },
  {
    category: 'Stock',
    question: 'Comment consulter les statistiques du magasin ?',
    answer:
      'Ouvrez Statistiques pour consulter les indicateurs de stock, la valeur estimée du stock et la répartition des produits par catégorie.',
  },
  {
    category: 'Paramètres',
    question: 'Comment modifier les paramètres ?',
    answer:
      'Accédez à Paramètres, modifiez les champs souhaités puis cliquez sur Enregistrer les modifications.',
  },
  {
    category: 'Général',
    question: 'Les données sont-elles enregistrées automatiquement ?',
    answer:
      'Les produits sont gérés par l’API du projet. Les paramètres de cette version de démonstration sont enregistrés dans le navigateur.',
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
    description: 'Comprendre les niveaux et alertes de stock.',
    icon: ShoppingCart,
    category: 'Stock',
  },
  {
    name: 'Statistiques',
    description: 'Consulter les indicateurs et graphiques.',
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

export default function CentreAide() {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<number | null>(0)
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('Question générale')
  const [submitted, setSubmitted] = useState(false)

  const filteredFaqs = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return faqs

    return faqs.filter(item =>
      `${item.question} ${item.answer} ${item.category}`
        .toLowerCase()
        .includes(query),
    )
  }, [search])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const supportMessage = [
      'Demande d’aide MediaTech',
      `Sujet : ${subject}`,
      `E-mail : ${email}`,
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
      <section className="help-hero">
        <div className="help-hero-content">
          <span className="help-eyebrow">CENTRE D’ASSISTANCE</span>
          <h2>Comment pouvons-nous vous aider ?</h2>
          <p>
            Retrouvez des réponses à vos questions et apprenez à utiliser
            MediaTech plus facilement.
          </p>

          <div className="help-search">
            <Search size={20} />
            <input
              value={search}
              onChange={e => {
                setSearch(e.target.value)
                setExpanded(null)
              }}
              placeholder="Rechercher une question, un sujet..."
              aria-label="Rechercher dans les questions fréquentes"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Effacer la recherche"
              >
                Effacer
              </button>
            )}
          </div>
        </div>

        <div className="help-hero-icon">
          <CircleHelp size={88} strokeWidth={1.2} />
        </div>
      </section>

      <section className="help-topics">
        <div className="help-section-heading">
          <div>
            <h3>Explorer les rubriques</h3>
            <p>Choisissez un sujet pour découvrir les conseils disponibles.</p>
          </div>
        </div>

        <div className="help-topic-grid">
          {topics.map(topic => {
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
            filteredFaqs.map(item => {
              const originalIndex = faqs.indexOf(item)
              const isOpen = expanded === originalIndex

              return (
                <article className="help-faq-item" key={item.question}>
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

      <section className="help-contact">
        <div className="help-contact-intro">
          <div className="help-contact-icon">
            <MessageCircle size={25} />
          </div>
          <h3>Vous n’avez pas trouvé de réponse ?</h3>
          <p>
            Décrivez votre problème pour préparer un message destiné à
            l’assistance.
          </p>
          <div className="help-contact-note">
            <Mail size={16} />
            Aucun message ne sera envoyé automatiquement sans votre action.
          </div>
        </div>

        <form className="help-contact-form" onSubmit={handleSubmit}>
          <label>
            Sujet
            <select
              value={subject}
              onChange={e => setSubject(e.target.value)}
            >
              <option>Question générale</option>
              <option>Gestion des produits</option>
              <option>Problème de stock</option>
              <option>Statistiques</option>
              <option>Paramètres</option>
              <option>Problème technique</option>
            </select>
          </label>

          <label>
            Votre adresse e-mail
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              required
            />
          </label>

          <label>
            Description du problème
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
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
            <p className="help-submit-note">
              <CheckCircle2 size={17} />
              Votre application de messagerie a été sollicitée. Vérifiez si
              elle s’est ouverte pour finaliser l’envoi.
            </p>
          )}
        </form>
      </section>
    </div>
  )
}
