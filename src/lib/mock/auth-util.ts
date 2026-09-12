export const PASSWORD_SALT = 'protuning-demo'

/**
 * SHA-256(пароль + salt). Значение для «demo1234» вычислено заранее,
 * чтобы сидирование оставалось синхронным.
 */
export const DEMO_PASSWORD_HASH =
  'e35f17a1cb765fe448fe06fdd722a9fd0412136609ac1538cb61ae9988840bbb'

export interface DemoUser {
  id: string
  email: string
  fullName: string
  role: 'admin' | 'manager'
  passwordHash: string
}

/** SHA-256 (WebCrypto, async) для проверки пароля demo-пользователя. */
export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(`${password}:${PASSWORD_SALT}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}