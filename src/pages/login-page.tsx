import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ShieldCheck, KeyRound } from 'lucide-react'
import { useAuth } from '@/app/providers/auth'
import { Logo } from '@/components/common/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginSchema, type LoginInput } from '@/lib/validation/schemas'
import { IS_DEMO } from '@/lib/config'

const DEMO_ACCOUNTS: { label: string; email: string }[] = [
  { label: 'Администратор', email: 'admin@protuning.ru' },
  { label: 'Менеджер', email: 'manager@protuning.ru' },
  { label: 'Наблюдатель', email: 'viewer@protuning.ru' },
]
const DEMO_PASSWORD = 'demo1234'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof LoginInput, string>>>({})
  const [submitting, setSubmitting] = useState(false)

  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  async function submit(e?: FormEvent) {
    e?.preventDefault()
    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      const errors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0])
        errors[key] = issue.message
      }
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setSubmitting(true)
    try {
      const session = await login(parsed.data)
      toast.success(`Добро пожаловать, ${session.fullName}!`)
      navigate(from, { replace: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось войти')
    } finally {
      setSubmitting(false)
    }
  }

  async function demoLogin(accountEmail: string) {
    setEmail(accountEmail)
    setPassword(DEMO_PASSWORD)
    const parsed = loginSchema.safeParse({ email: accountEmail, password: DEMO_PASSWORD })
    if (!parsed.success) return
    setSubmitting(true)
    try {
      const session = await login(parsed.data)
      toast.success(`Демо-вход: ${session.fullName}`)
      navigate(from, { replace: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось войти')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-charcoal lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <div className="relative border-b-[3px] border-red bg-charcoal px-4 py-3 lg:hidden">
        <Logo className="h-9" />
      </div>

      <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rotate-12 bg-red/90" />
        <Logo className="h-12" />
        <div className="relative max-w-md">
          <div className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-red">PRO-TUNING</div>
          <h1 className="text-4xl font-black leading-tight tracking-tight text-white">
            Калькулятор стоимости тюнинга
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400">
            Автомобили, услуги и коммерческие предложения в едином рабочем пространстве.
          </p>
        </div>
        <div className="relative flex items-center gap-3 text-zinc-500">
          <ShieldCheck className="h-4 w-4 text-red" />
          <span className="text-xs">Защищённый доступ по ролям</span>
        </div>
      </div>

      <div className="flex min-h-[calc(100dvh-63px)] items-center justify-center bg-background p-6 lg:min-h-screen">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-black tracking-tight text-ink">Вход в систему</h2>
          <p className="mt-1 text-sm text-muted-foreground">Введите e-mail и пароль</p>

          <form onSubmit={(e) => void submit(e)} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.ru"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(fieldErrors.email)}
              />
              {fieldErrors.email ? <p className="text-xs font-semibold text-red">{fieldErrors.email}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(fieldErrors.password)}
              />
              {fieldErrors.password ? <p className="text-xs font-semibold text-red">{fieldErrors.password}</p> : null}
            </div>
            <Button type="submit" className="w-full" disabled={submitting} size="lg">
              <KeyRound className="h-4 w-4" />
              {submitting ? 'Входим…' : 'Войти'}
            </Button>
          </form>

          {IS_DEMO ? (
            <div className="mt-8 rounded-xl border border-line bg-soft p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-red" /> Демо-доступ (localStorage)
              </div>
              <div className="grid gap-2">
                {DEMO_ACCOUNTS.map((account) => (
                  <Button
                    key={account.email}
                    variant="outline"
                    className="justify-between"
                    disabled={submitting}
                    onClick={() => void demoLogin(account.email)}
                  >
                    <span>{account.label}</span>
                    <span className="text-xs font-normal text-muted-foreground">{account.email}</span>
                  </Button>
                ))}
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                Пароль для всех демо-аккаунтов: <code className="rounded bg-line px-1.5 py-0.5">demo1234</code>
              </p>
            </div>
          ) : null}

          <div className="mt-8 border-t border-line pt-4 text-center text-[11px] text-muted-foreground">
            PRO-TUNING · калькулятор и прайс-матрица
          </div>
        </div>
      </div>
    </div>
  )
}