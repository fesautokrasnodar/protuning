import '@testing-library/jest-dom/vitest'
import { beforeEach } from 'vitest'

// jsdom не имеет crypto.subtle — заменяем для mock-auth тестов
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', {
    value: { ...(globalThis.crypto ?? {}), subtle: {} },
    configurable: true,
  })
}

// localStorage glitch-free для каждого теста
beforeEach(() => {
  localStorage.clear()
})