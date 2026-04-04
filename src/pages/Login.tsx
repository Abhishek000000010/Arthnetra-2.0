import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { Eye } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { GoogleAuthButton } from '../components/GoogleAuthButton'

export function Login() {
  const { user, isConfigured, loginWithPassword } = useAuth()
  const location = useLocation()
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const redirectTo = (location.state as { from?: string } | null)?.from || '/dashboard'
  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    const result = await loginWithPassword(email, password)
    setSubmitting(false)
    if (result.error) setError(result.error)
  }

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center px-6 py-16">
      <section className="w-full max-w-md bg-surface-container-low border border-white/5 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
            <Eye size={22} />
          </div>
          <div>
            <p className="text-xs font-label uppercase tracking-[0.2em] opacity-50">ArthaNetra Auth</p>
            <h1 className="text-2xl font-headline font-black text-on-surface">Login</h1>
          </div>
        </div>

        {!isConfigured ? (
          <div className="mb-5 rounded-2xl border border-error/20 bg-error/10 p-4 text-sm text-error">
            Google OAuth is not configured yet. Add `VITE_GOOGLE_CLIENT_ID` in `.env`.
          </div>
        ) : null}

        {error ? (
          <div className="mb-5 rounded-2xl border border-error/20 bg-error/10 p-4 text-sm text-error">{error}</div>
        ) : null}

        <p className="text-sm text-on-surface-variant opacity-70 mb-6">
          Use your email and password, or continue with Google if that is easier for the demo.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-label uppercase tracking-[0.2em] text-on-surface-variant mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-surface px-4 py-3 text-on-surface outline-none focus:border-primary/50"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-label uppercase tracking-[0.2em] text-on-surface-variant mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-surface px-4 py-3 text-on-surface outline-none focus:border-primary/50"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-surface transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.24em] text-on-surface-variant/50">
          <span className="h-px flex-1 bg-white/10" />
          or
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <GoogleAuthButton onError={setError} />

        <p className="mt-4 text-xs text-on-surface-variant opacity-50 text-center">
          After sign-in, you will be redirected to <span className="text-primary">{redirectTo}</span>.
        </p>

        <p className="mt-6 text-sm text-on-surface-variant text-center">
          New user? <Link to="/signup" className="text-primary font-bold">Create an account</Link>
        </p>
      </section>
    </main>
  )
}
