import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@/types'
import type { LoginInput } from '@/lib/validation/schemas'
import { providers } from '@/services'

interface AuthContextValue {
  session: Session | null
  loading: boolean
  login: (input: LoginInput) => Promise<Session>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let disposed = false
    providers.auth
      .getSession()
      .then((s) => {
        if (!disposed) setSession(s)
      })
      .catch(() => {
        if (!disposed) setSession(null)
      })
      .finally(() => {
        if (!disposed) setLoading(false)
      })
    return () => {
      disposed = true
    }
  }, [])

  const login = useCallback(async (input: LoginInput) => {
    const s = await providers.auth.login(input)
    setSession(s)
    return s
  }, [])

  const logout = useCallback(async () => {
    await providers.auth.logout()
    setSession(null)
  }, [])

  const value = useMemo(() => ({ session, loading, login, logout }), [session, loading, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth должен вызываться внутри AuthProvider')
  return ctx
}