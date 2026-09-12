import type { ReactNode } from 'react'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/app/providers/auth'
import { QueryProvider } from '@/app/providers/query'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: { fontFamily: 'Arial, Helvetica, sans-serif' },
          }}
        />
      </AuthProvider>
    </QueryProvider>
  )
}