import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  Store, Network, PackageSearch, Languages, CalendarDays,
  Download, Save, RefreshCw, CheckCircle2, CircleAlert,
  LoaderCircle, FileSpreadsheet,
} from 'lucide-react'
import './Parametres.css'

const SETTINGS_KEY = 'mediatech-settings'
const DEFAULT_API_URL = 'http://localhost:5091/api/products'

type Settings = {
  storeName: string
  email: string
  phone: string
  address: string
  apiUrl: string
  lowStockThreshold: number
  language: string
  dateFormat: string
}

type ProductRecord = Record<string, unknown>

const DEFAULT_SETTINGS: Settings = {
  storeName: 'MediaTech Store',
  email: '',
  phone: '',
  address: 'Oujda, Maroc',
  apiUrl: DEFAULT_API_URL,
  lowStockThreshold: 5,
  language: 'Français',
  dateFormat: 'DD/MM/YYYY',
}

function readSettings(): Settings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (!saved) return { ...DEFAULT_SETTINGS }

    const data = JSON.parse(saved) as Partial<Settings>
    const threshold = Number(data.lowStockThreshold)

    return {
      ...DEFAULT_SETTINGS,
      ...data,
      lowStockThreshold:
        Number.isInteger(threshold) && threshold >= 0
          ? threshold
          : 5,
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

function extractProducts(data: unknown): ProductRecord[] {
  let result: unknown = data

  if (!Array.isArray(result) && typeof result === 'object' && result !== null) {
    const wrapper = result as Record<string, unknown>
    result =
      wrapper.value ??
      wrapper.Value ??
      wrapper.products ??
      wrapper.Products ??
      wrapper.data ??
      wrapper.Data
  }

  if (!Array.isArray(result)) {
    throw new Error("L'API n'a pas renvoyé une liste de produits.")
  }

  return result.filter(
    (item): item is ProductRecord =>
      typeof item === 'object' && item !== null,
  )
}

function field(product: ProductRecord, key: string): unknown {
  const pascal = key.charAt(0).toUpperCase() + key.slice(1)
  return product[key] ?? product[pascal] ?? ''
}

function csvCell(value: unknown): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

function errorText(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Une erreur inattendue est survenue.'
}

export default function Parametres() {
  const [settings, setSettings] = useState<Settings>(readSettings)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info')
  const [testing, setTesting] = useState(false)
  const [exporting, setExporting] = useState(false)

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings(current => ({ ...current, [key]: value }))
    setMessage('')
  }

  function showMessage(
    text: string,
    type: 'success' | 'error' | 'info' = 'info',
  ) {
    setMessage(text)
    setMessageType(type)
  }

  function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!settings.storeName.trim()) {
      showMessage('Le nom du magasin est obligatoire.', 'error')
      return
    }

    if (!Number.isInteger(settings.lowStockThreshold) || settings.lowStockThreshold < 0) {
      showMessage('Le seuil doit être un entier positif ou égal à zéro.', 'error')
      return
    }

    try {
      const url = new URL(settings.apiUrl.trim())
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error("L'URL doit commencer par http:// ou https://.")
      }

      const clean: Settings = {
        ...settings,
        storeName: settings.storeName.trim(),
        email: settings.email.trim(),
        phone: settings.phone.trim(),
        address: settings.address.trim(),
        apiUrl: settings.apiUrl.trim(),
      }

      localStorage.setItem(SETTINGS_KEY, JSON.stringify(clean))
      setSettings(clean)
      showMessage('Paramètres enregistrés dans ce navigateur.', 'success')
    } catch (error) {
      showMessage(errorText(error), 'error')
    }
  }

  async function testConnection() {
    setTesting(true)
    showMessage('')

    try {
      const response = await fetch(settings.apiUrl.trim(), {
        headers: { Accept: 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}.`)
      }

      const products = extractProducts(await response.json())
      showMessage(
        `Connexion réussie : ${products.length} produit(s) reçu(s).`,
        'success',
      )
    } catch (error) {
      showMessage(
        `${errorText(error)} Vérifiez le backend et la configuration CORS.`,
        'error',
      )
    } finally {
      setTesting(false)
    }
  }

  async function exportProducts() {
    setExporting(true)
    showMessage('')

    try {
      const response = await fetch(settings.apiUrl.trim(), {
        headers: { Accept: 'application/json' },
      })

      if (!response.ok) throw new Error(`Erreur HTTP ${response.status}.`)

      const products = extractProducts(await response.json())

      if (products.length === 0) {
        showMessage('Aucun produit à exporter.', 'info')
        return
      }

      const headers = [
        'ID', 'Nom', 'Description', 'Prix (MAD)',
        'Stock', 'Catégorie', 'Date de création',
      ]

      const rows = products.map(product =>
        [
          field(product, 'id'),
          field(product, 'name'),
          field(product, 'description'),
          field(product, 'price'),
          field(product, 'stock'),
          field(product, 'category'),
          field(product, 'createdAt'),
        ].map(csvCell).join(';'),
      )

      const csv = [
        headers.map(csvCell).join(';'),
        ...rows,
      ].join('\r\n')

      const blob = new Blob(['\uFEFF', csv], {
        type: 'text/csv;charset=utf-8;',
      })

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `mediatech-produits-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)

      showMessage(`${products.length} produit(s) exporté(s) en CSV.`, 'success')
    } catch (error) {
      showMessage(`Export impossible : ${errorText(error)}`, 'error')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="settings-page">
      <section className="settings-hero">
        <div>
          <span className="settings-eyebrow">CONFIGURATION</span>
          <h1>Paramètres</h1>
          <p>Configurez les informations de votre magasin et les préférences de MediaTech.</p>
        </div>
        <div className="settings-hero-icon"><Network size={38} /></div>
      </section>

      {message && (
        <div className={`settings-notice settings-notice-${messageType}`} role="status">
          {messageType === 'success'
            ? <CheckCircle2 size={20} />
            : messageType === 'error'
              ? <CircleAlert size={20} />
              : <CircleAlert size={20} />}
          <span>{message}</span>
        </div>
      )}

      <form className="settings-form" onSubmit={saveSettings}>
        <section className="settings-card">
          <div className="settings-card-heading">
            <div className="settings-section-icon"><Store size={21} /></div>
            <div>
              <h2>Informations du magasin</h2>
              <p>Les coordonnées de votre espace commercial.</p>
            </div>
          </div>

          <div className="settings-fields-grid">
            <label className="settings-field">
              Nom du magasin
              <input value={settings.storeName} onChange={e => update('storeName', e.target.value)} maxLength={100} required />
            </label>
            <label className="settings-field">
              Adresse e-mail
              <input type="email" value={settings.email} onChange={e => update('email', e.target.value)} placeholder="contact@mediatech.ma" />
            </label>
            <label className="settings-field">
              Téléphone
              <input type="tel" value={settings.phone} onChange={e => update('phone', e.target.value)} placeholder="+212 6 XX XX XX XX" />
            </label>
            <label className="settings-field">
              Adresse du magasin
              <input value={settings.address} onChange={e => update('address', e.target.value)} placeholder="Oujda, Maroc" />
            </label>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-heading">
            <div className="settings-section-icon"><Network size={21} /></div>
            <div>
              <h2>Connexion API</h2>
              <p>Testez la connexion au backend et chargez les produits.</p>
            </div>
          </div>

          <label className="settings-field">
            URL de l'API des produits
            <input type="url" value={settings.apiUrl} onChange={e => update('apiUrl', e.target.value)} required />
          </label>

          <p className="settings-helper">
            Exemple : http://localhost:5091/api/products
          </p>

          <button type="button" className="settings-button settings-button-secondary" onClick={() => void testConnection()} disabled={testing}>
            {testing ? <LoaderCircle size={17} className="settings-spin" /> : <RefreshCw size={17} />}
            {testing ? 'Test en cours...' : 'Tester la connexion'}
          </button>

          <div className="settings-inline-info">
            <CircleAlert size={17} />
            <span>Cette URL est utilisée ici pour tester et exporter. Les autres pages utilisent encore leur configuration actuelle.</span>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-heading">
            <div className="settings-section-icon"><PackageSearch size={21} /></div>
            <div>
              <h2>Gestion du stock</h2>
              <p>Définissez le seuil à utiliser pour signaler un stock faible.</p>
            </div>
          </div>

          <div className="settings-threshold-row">
            <label className="settings-field">
              Seuil de stock faible (unités)
              <input type="number" min="0" max="100000" step="1" value={settings.lowStockThreshold} onChange={e => update('lowStockThreshold', e.target.value === '' ? 0 : Number(e.target.value))} required />
            </label>

            <div className="settings-threshold-preview">
              <PackageSearch size={22} />
              <div>
                <strong>{settings.lowStockThreshold} unité(s) ou moins</strong>
                <p>Seuil enregistré comme préférence locale.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-heading">
            <div className="settings-section-icon"><Languages size={21} /></div>
            <div>
              <h2>Préférences générales</h2>
              <p>Langue et format d'affichage des dates.</p>
            </div>
          </div>

          <div className="settings-fields-grid">
            <label className="settings-field">
              Langue préférée
              <select value={settings.language} onChange={e => update('language', e.target.value)}>
                <option value="Français">Français</option>
                <option value="العربية">العربية</option>
              </select>
            </label>

            <label className="settings-field">
              <span className="settings-label-with-icon"><CalendarDays size={15} /> Format des dates</span>
              <select value={settings.dateFormat} onChange={e => update('dateFormat', e.target.value)}>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </label>
          </div>

          <p className="settings-helper">
            La devise utilisée dans MediaTech est le MAD (dirham marocain).
            L'application de la langue à toutes les pages nécessite une intégration supplémentaire.
          </p>
        </section>

        <div className="settings-form-footer">
          <span>Les paramètres sont conservés dans ce navigateur.</span>
          <button type="submit" className="settings-button settings-button-primary">
            <Save size={18} />
            Enregistrer les paramètres
          </button>
        </div>
      </form>

      <section className="settings-card">
        <div className="settings-card-heading">
          <div className="settings-section-icon"><FileSpreadsheet size={21} /></div>
          <div>
            <h2>Exportation des données</h2>
            <p>Téléchargez le catalogue pour l'ouvrir dans Excel.</p>
          </div>
        </div>

        <div className="settings-export-row">
          <div>
            <strong>Catalogue des produits</strong>
            <p>ID, nom, description, prix, stock et catégorie.</p>
          </div>

          <button type="button" className="settings-button settings-button-secondary" onClick={() => void exportProducts()} disabled={exporting}>
            {exporting ? <LoaderCircle size={17} className="settings-spin" /> : <Download size={17} />}
            {exporting ? 'Export en cours...' : 'Exporter en CSV'}
          </button>
        </div>
      </section>

      <p className="settings-disclaimer">
        Les paramètres sont enregistrés localement dans ce navigateur.
        Ils ne sont pas encore centralisés dans MySQL ni appliqués automatiquement
        à toutes les pages.
      </p>
    </div>
  )
}