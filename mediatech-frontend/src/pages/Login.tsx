import { useState, type FormEvent } from 'react'
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Monitor,
  ShieldCheck,
} from 'lucide-react'
import './Login.css'

const LOGIN_API = 'http://localhost:5091/api/Auth/login'

type LoginResponse = {
  token?: unknown
  email?: unknown
  expiresAt?: unknown
  message?: unknown
}

type LoginProps = {
  onLogin: (token: string, email: string, expiresAt: string) => void
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(LOGIN_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      })

      const payload = (await response.json().catch(() => ({}))) as LoginResponse

      if (!response.ok) {
        throw new Error(
          typeof payload.message === 'string'
            ? payload.message
            : response.status === 404
              ? 'Le service de connexion est introuvable. Vérifiez le backend.'
              : 'E-mail ou mot de passe incorrect.'
        )
      }

      if (
        typeof payload.token !== 'string' ||
        typeof payload.email !== 'string' ||
        typeof payload.expiresAt !== 'string'
      ) {
        throw new Error('La réponse du serveur est invalide.')
      }

      onLogin(payload.token, payload.email, payload.expiresAt)
    } catch (err: unknown) {
      setError(
        err instanceof TypeError
          ? 'Connexion au serveur impossible. Vérifiez que le backend fonctionne et que le port 5091 est accessible.'
          : err instanceof Error
            ? err.message
            : 'Une erreur inattendue est survenue.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-decoration login-decoration-one" />
      <div className="login-decoration login-decoration-two" />

      <main className="login-card">
        <div className="login-brand">
          <div className="login-brand-icon">
            <Monitor size={27} strokeWidth={2.3} />
          </div>
          <div>
            <strong>MediaTech</strong>
            <span>ADMINISTRATION</span>
          </div>
        </div>

        <div className="login-welcome">
          <span className="login-eyebrow">
            <ShieldCheck size={15} />
            ESPACE SÉCURISÉ
          </span>
          <h1>Bienvenue !</h1>
          <p>
            Connectez-vous pour accéder à votre espace de gestion
            et administrer votre catalogue.
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="login-email">Adresse e-mail</label>

          <div className="login-input-wrap">
            <Mail size={18} />
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="admin@mediatech.ma"
              autoComplete="username"
              maxLength={254}
              required
            />
          </div>

          <label htmlFor="login-password">Mot de passe</label>

          <div className="login-input-wrap">
            <LockKeyhole size={18} />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={event => setPassword(event.target.value)}
              placeholder="Entrez votre mot de passe"
              autoComplete="current-password"
              maxLength={128}
              required
            />
            <button
              type="button"
              className="login-toggle-password"
              onClick={() => setShowPassword(value => !value)}
              aria-label={
                showPassword
                  ? 'Masquer le mot de passe'
                  : 'Afficher le mot de passe'
              }
              title={
                showPassword
                  ? 'Masquer le mot de passe'
                  : 'Afficher le mot de passe'
              }
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <button
            className="login-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="login-security-note">
          <ShieldCheck size={17} />
          <span>Accès réservé aux administrateurs autorisés.</span>
        </div>
      </main>

      <footer className="login-footer">
        © {new Date().getFullYear()} MediaTech. Tous droits réservés.
      </footer>
    </div>
  )
}
