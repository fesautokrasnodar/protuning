import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/index.css'
import { Providers } from '@/app/providers'
import { App } from '@/App'

const root = document.getElementById('root') ?? document.body

createRoot(root).render(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>,
)