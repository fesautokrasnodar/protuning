import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/app/layouts/app-layout'
import { RequireAuth } from '@/app/guards/require-auth'
import { RequireRole } from '@/app/guards/require-role'
import { LoginPage } from '@/pages/login-page'
import { DashboardPage } from '@/pages/dashboard-page'
import { CalculatorPage } from '@/pages/calculator-page'
import { ProposalsPage } from '@/pages/proposals-page'
import { ProposalViewPage } from '@/pages/proposal-view-page'
import { ProposalPrintPage } from '@/pages/proposal-print-page'
import { PriceMatrixPage } from '@/pages/price-matrix-page'
import { CarsPage } from '@/pages/cars-page'
import { ServicesPage } from '@/pages/services-page'
import { SettingsPage } from '@/pages/settings-page'
import type { Role } from '@/types'

const ADMIN_ROLES: Role[] = ['admin']

/** Любой посетитель сразу попадает в калькулятор. */
function HomeRedirect() {
  return <Navigate to="/calculator" replace />
}

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <RequireAuth inverse>
              <LoginPage />
            </RequireAuth>
          }
        />
        <Route path="/print/:id" element={<ProposalPrintPage />} />
        <Route element={<AppLayout />}>
          <Route path="/calculator" element={<CalculatorPage />} />
          <Route
            path="/dashboard"
            element={
              <RequireRole roles={ADMIN_ROLES}>
                <DashboardPage />
              </RequireRole>
            }
          />
          <Route
            path="/proposals"
            element={
              <RequireRole roles={ADMIN_ROLES}>
                <ProposalsPage />
              </RequireRole>
            }
          />
          <Route
            path="/proposals/:id"
            element={
              <RequireRole roles={ADMIN_ROLES}>
                <ProposalViewPage />
              </RequireRole>
            }
          />
          <Route
            path="/proposals/:id/print"
            element={
              <RequireRole roles={ADMIN_ROLES}>
                <ProposalPrintPage />
              </RequireRole>
            }
          />
          <Route
            path="/price-matrix"
            element={
              <RequireRole roles={ADMIN_ROLES}>
                <PriceMatrixPage />
              </RequireRole>
            }
          />
          <Route
            path="/cars"
            element={
              <RequireRole roles={ADMIN_ROLES}>
                <CarsPage />
              </RequireRole>
            }
          />
          <Route
            path="/services"
            element={
              <RequireRole roles={ADMIN_ROLES}>
                <ServicesPage />
              </RequireRole>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireRole roles={ADMIN_ROLES}>
                <SettingsPage />
              </RequireRole>
            }
          />
          <Route path="*" element={<HomeRedirect />} />
        </Route>
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </HashRouter>
  )
}