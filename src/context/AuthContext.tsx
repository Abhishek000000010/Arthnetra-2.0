import { createContext, useContext, useEffect, useState } from 'react'
import { googleLogout } from '@react-oauth/google'

type AppUser = {
  id: string
  name: string
  email: string
  picture?: string
  provider: 'google' | 'local'
}

type AuthContextType = {
  user: AppUser | null
  loading: boolean
  isConfigured: boolean
  completeGoogleSignIn: (credential: string) => Promise<{ error: string | null }>
  loginWithPassword: (email: string, password: string) => Promise<{ error: string | null }>
  registerWithPassword: (name: string, email: string, password: string) => Promise<{ error: string | null }>
  signOutUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const STORAGE_KEY = 'arthanetra-google-user'

function decodeJwtPayload(credential: string) {
  const [, payload] = credential.split('.')
  if (!payload) throw new Error('Invalid Google credential.')
  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
  const decoded = window.atob(normalized)
  return JSON.parse(decoded)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const isConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        setUser(JSON.parse(raw) as AppUser)
      } catch {
        window.localStorage.removeItem(STORAGE_KEY)
      }
    }
    setLoading(false)
  }, [])

  const completeGoogleSignIn = async (credential: string) => {
    if (!isConfigured) {
      return { error: 'Google client ID is not configured yet.' }
    }

    try {
      const payload = decodeJwtPayload(credential)
      const nextUser: AppUser = {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
        provider: 'google',
      }

      try {
        const response = await fetch('http://127.0.0.1:8001/api/auth/google-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nextUser),
        })
        if (!response.ok) {
          const payload = await response.json().catch(() => null)
          return { error: payload?.detail || 'Google user sync failed.' }
        }
        const data = (await response.json()) as { user?: AppUser }
        const resolvedUser = data.user || nextUser
        setUser(resolvedUser)
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(resolvedUser))
      } catch {
        setUser(nextUser)
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser))
      }

      return { error: null }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Google sign-in failed.' }
    }
  }

  const loginWithPassword = async (email: string, password: string) => {
    try {
      const response = await fetch('http://127.0.0.1:8001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const payload = (await response.json().catch(() => null)) as { detail?: string; user?: AppUser } | null

      if (!response.ok || !payload?.user) {
        return { error: payload?.detail || 'Login failed.' }
      }

      setUser(payload.user)
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload.user))
      return { error: null }
    } catch {
      return { error: 'Could not reach the auth server.' }
    }
  }

  const registerWithPassword = async (name: string, email: string, password: string) => {
    try {
      const response = await fetch('http://127.0.0.1:8001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const payload = (await response.json().catch(() => null)) as { detail?: string; user?: AppUser } | null

      if (!response.ok || !payload?.user) {
        return { error: payload?.detail || 'Signup failed.' }
      }

      setUser(payload.user)
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload.user))
      return { error: null }
    } catch {
      return { error: 'Could not reach the auth server.' }
    }
  }

  const signOutUser = async () => {
    if (user?.provider === 'google') {
      googleLogout()
    }
    setUser(null)
    window.localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isConfigured,
        completeGoogleSignIn,
        loginWithPassword,
        registerWithPassword,
        signOutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
