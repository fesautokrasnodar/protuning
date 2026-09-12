import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/app/providers/auth'
import { FullPageLoader } from '@/components/common/spinner'

export function RequireAuth({ children, inverse = false }: { children: ReactNode; inverse?: boolean }) {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullPageLoader />
  if (inverse) {
    if (session) return <Navigate to="/dashboard" replace />
    return <>{children}</>
  }
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <>{children}</>
}