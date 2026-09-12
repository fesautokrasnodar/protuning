import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Calculator, Car, FileText, Home, Settings, UserRound, ListChecks, LogOut, LayoutGrid } from 'lucide-react'
import { useAuth } from '@/app/providers/auth'
import { Logo } from '@/components/common/logo'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { IS_DEMO } from '@/lib/config'
import type { Role } from '@/types'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: typeof Home
  roles: Role[]
}

const NAV: NavItem[] = [
  { to: '/dashboard', label: 'Дашборд', icon: Home, roles: ['admin', 'manager', 'viewer'] },
  { to: '/calculator', label: 'Калькулятор', icon: Calculator, roles: ['admin', 'manager'] },
  { to: '/proposals', label: 'Коммерческие предложения', icon: FileText, roles: ['admin', 'manager', 'viewer'] },
  { to: '/price-matrix', label: 'Прайс-матрица', icon: LayoutGrid, roles: ['admin'] },
  { to: '/cars', label: 'Автомобили', icon: Car, roles: ['admin'] },
  { to: '/services', label: 'Услуги', icon: ListChecks, roles: ['admin'] },
  { to: '/settings', label: 'Настройки', icon: Settings, roles: ['admin'] },
]

function roleLabel(role: Role): string {
  switch (role) {
    case 'admin':
      return 'Администратор'
    case 'manager':
      return 'Менеджер'
    case 'viewer':
      return 'Наблюдатель'
  }
}

export function AppLayout() {
  const { session, logout } = useAuth()
  const navigate = useNavigate()

  if (!session) return null

  const visibleNav = NAV.filter((item) => item.roles.includes(session.role))

  return (
    <div className="min-h-screen bg-background">
      <header className="print-hide sticky top-0 z-40 border-b-[3px] border-red bg-charcoal shadow-[0_6px_18px_rgba(0,0,0,0.12)]">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <NavLink to="/dashboard" className="flex shrink-0 items-center gap-3">
            <Logo className="h-9" />
          </NavLink>
          <nav className="flex items-center gap-1 overflow-x-auto print-hide">
            {visibleNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex shrink-0 items-center gap-1.5 rounded-lg border border-transparent px-3 py-2 text-[13px] font-bold text-zinc-300 transition-colors hover:text-white',
                    isActive && 'border-red bg-red text-white hover:text-white',
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {IS_DEMO ? (
              <Badge variant="warning" className="hidden sm:inline-flex">
                DEMO-режим
              </Badge>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm font-bold text-zinc-100 transition-colors hover:bg-zinc-800">
                  <UserRound className="h-4 w-4 text-red" />
                  <span className="max-w-40 truncate">{session.email}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {session.fullName}
                  <div className="mt-0.5">
                    <Badge variant="outline">{roleLabel(session.role)}</Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    void logout().then(() => navigate('/login'))
                  }}
                >
                  <LogOut className="h-4 w-4" /> Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className={cn('mx-auto max-w-[1440px] px-4 py-6', 'md:px-6')}>
        <Outlet />
      </main>
    </div>
  )
}