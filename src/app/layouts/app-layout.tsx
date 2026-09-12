import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Calculator,
  Car,
  FileText,
  Home,
  Settings,
  UserRound,
  ListChecks,
  LogOut,
  LogIn,
  LayoutGrid,
  Menu,
  X,
} from 'lucide-react'
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
  { to: '/dashboard', label: 'Дашборд', icon: Home, roles: ['admin'] },
  { to: '/calculator', label: 'Калькулятор', icon: Calculator, roles: ['admin'] },
  { to: '/proposals', label: 'Коммерческие предложения', icon: FileText, roles: ['admin'] },
  { to: '/price-matrix', label: 'Прайс-матрица', icon: LayoutGrid, roles: ['admin'] },
  { to: '/cars', label: 'Автомобили', icon: Car, roles: ['admin'] },
  { to: '/services', label: 'Услуги', icon: ListChecks, roles: ['admin'] },
  { to: '/settings', label: 'Настройки', icon: Settings, roles: ['admin'] },
]

function roleLabel(): string {
  return 'Администратор'
}

export function AppLayout() {
  const { session, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  // Админ видит полную навигацию; гость («Пользователь») — только калькулятор через логотип.
  const isAdmin = session?.role === 'admin'
  const visibleNav = isAdmin ? NAV : []

  function onLogout() {
    setMenuOpen(false)
    void logout().then(() => navigate('/login'))
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="print-hide sticky top-0 z-40 border-b-[3px] border-red bg-charcoal shadow-[0_6px_18px_rgba(0,0,0,0.12)]">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <NavLink to="/calculator" className="flex shrink-0 items-center gap-3" onClick={() => setMenuOpen(false)}>
            <Logo className="h-9" />
          </NavLink>
          {visibleNav.length > 0 ? (
            <nav className="hidden items-center gap-1 overflow-x-auto md:flex">
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
          ) : null}
          <div className="ml-auto flex items-center gap-3">
            {session ? (
              <>
                {IS_DEMO ? (
                  <Badge variant="warning" className="hidden sm:inline-flex">
                    DEMO-режим
                  </Badge>
                ) : null}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm font-bold text-zinc-100 transition-colors hover:bg-zinc-800">
                      <UserRound className="h-4 w-4 shrink-0 text-red" />
                      <span className="hidden max-w-40 truncate sm:inline">{session.email}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      {session.fullName}
                      <div className="mt-0.5">
                        <Badge variant="outline">{roleLabel()}</Badge>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onLogout}>
                      <LogOut className="h-4 w-4" /> Выйти
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
                  aria-expanded={menuOpen}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 transition-colors hover:bg-zinc-800 md:hidden"
                >
                  {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm font-bold text-zinc-100 transition-colors hover:bg-zinc-800"
              >
                <LogIn className="h-4 w-4 shrink-0 text-red" />
                <span className="sm:hidden">Вход</span>
                <span className="hidden sm:inline">Войти</span>
              </Link>
            )}
          </div>
        </div>

        {menuOpen && session ? (
          <nav className="border-t border-zinc-800 bg-charcoal px-4 py-3 md:hidden">
            <div className="flex flex-col gap-1">
              {visibleNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[15px] font-bold text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white',
                      isActive && 'bg-red text-white hover:bg-red hover:text-white',
                    )
                  }
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              ))}
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[15px] font-bold text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white"
              >
                <LogOut className="h-5 w-5" /> Выйти
              </button>
            </div>
          </nav>
        ) : null}
      </header>
      <main className={cn('mx-auto max-w-[1440px] px-4 py-6', 'md:px-6')}>
        <Outlet />
      </main>
    </div>
  )
}