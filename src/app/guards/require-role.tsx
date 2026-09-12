import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/app/providers/auth'
import type { Role } from '@/types'

interface RequireRoleProps {
  roles: Role[]
  children: ReactNode
}

export function RequireRole({ roles, children }: RequireRoleProps) {
  const { session } = useAuth()
  if (!session) return <Navigate to="/login" replace />
  if (!roles.includes(session.role)) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}