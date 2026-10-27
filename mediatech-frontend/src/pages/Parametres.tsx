import { useState } from 'react'
import { Save, Server } from 'lucide-react'
import './Parametres.css'

export default function Parametres() {
  const [apiUrl, setApiUrl] = useState('http://localhost:5091/api/products')
  const [message, setMessage] = useState('')

  function handleSave() {
    setMessage('Les paramètres sont enregistrés pour cette session.')
  }

  return (
    <section className="settings-page">
      <div className="settings-heading">
        <p className="settings-eyebrow">CONFIGURATION</p>
        <h1>Paramètres</h1>
        <p>Configurez les informations de votre espace MediaTech.</p>
      </div>

      <div className="settings-card">
        <div className="settings-card-title">
          <Server size={21} />
          <div>
            <h2>Connexion API</h2>
            <p>Adresse utilisée pour accéder aux produits.</p>
          </div>
        </div>

        <label htmlFor="settings-api-url">URL de l’API</label>
        <input
          id="settings-api-url"
          value={apiUrl}
          onChange={event => {
            setApiUrl(event.target.value)
            setMessage('')
          }}
          type="url"
        />

        <p className="settings-note">
          Cette valeur est affichée dans les paramètres. Pour le moment, elle ne modifie pas l’adresse utilisée par les pages.
        </p>

        <button type="button" onClick={handleSave}>
          <Save size={17} />
          Enregistrer
        </button>

        {message && <p className="settings-success">{message}</p>}
      </div>
    </section>
  )
}

