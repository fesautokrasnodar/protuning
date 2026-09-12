import type { Session } from '@/types'
import { DomainError, type AuthProvider } from '@/services/module'
import { loadDb } from '@/lib/mock/db'
import { hashPassword } from '@/lib/mock/auth-util'

const AUTH_KEY = 'protuning_auth_v1'

export const mockAuthProvider: AuthProvider = {
  async getSession() {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return null
    try {
      const s = JSON.parse(raw) as Session
      if (!s.userId || !s.role) return null
      return s
    } catch {
      return null
    }
  },
  async login(input) {
    const db = loadDb()
    const email = input.email.trim().toLowerCase()
    const user = db.users.find((u) => u.email.toLowerCase() === email)
    if (!user) throw new DomainError('Неверный e-mail или пароль', 'INVALID_CREDENTIALS')
    const hash = await hashPassword(input.password)
    if (user.passwordHash !== hash) {
      throw new DomainError('Неверный e-mail или пароль', 'INVALID_CREDENTIALS')
    }
    const session: Session = {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    }
    localStorage.setItem(AUTH_KEY, JSON.stringify(session))
    return session
  },
  async logout() {
    localStorage.removeItem(AUTH_KEY)
  },
}