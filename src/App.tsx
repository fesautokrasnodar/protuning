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
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route
            path="/calculator"
            element={
              <RequireRole roles={['admin', 'manager']}>
                <CalculatorPage />
              </RequireRole>
            }
          />
          <Route path="/proposals" element={<ProposalsPage />} />
          <Route path="/proposals/:id" element={<ProposalViewPage />} />
          <Route path="/proposals/:id/print" element={<ProposalPrintPage />} />
          <Route
            path="/price-matrix"
            element={
              <RequireRole roles={['admin']}>
                <PriceMatrixPage />
              </RequireRole>
            }
          />
          <Route
            path="/cars"
            element={
              <RequireRole roles={['admin']}>
                <CarsPage />
              </RequireRole>
            }
          />
          <Route
            path="/services"
            element={
              <RequireRole roles={['admin']}>
                <ServicesPage />
              </RequireRole>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireRole roles={['admin']}>
                <SettingsPage />
              </RequireRole>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </HashRouter>
  )
}