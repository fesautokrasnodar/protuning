import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('демо-вход администратора и открытие дашборда', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Вход в систему' })).toBeVisible()
  await page.getByRole('button', { name: 'Администратор' }).click()
  await expect(page.getByRole('heading', { name: /Здравствуйте/ })).toBeVisible()

  const nav = page.getByRole('navigation')
  await expect(nav.getByRole('link', { name: 'Калькулятор' })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'Прайс-матрица' })).toBeVisible()
})

test('наблюдатель не видит справочники и калькулятор', async ({ page }) => {
  await page.getByRole('heading', { name: 'Вход в систему' }).waitFor()
  await page.getByRole('button', { name: 'Наблюдатель' }).click()
  await expect(page.getByRole('heading', { name: /Здравствуйте/ })).toBeVisible()

  const nav = page.getByRole('navigation')
  await expect(nav.getByRole('link', { name: 'Калькулятор' })).toHaveCount(0)
  await expect(nav.getByRole('link', { name: 'Прайс-матрица' })).toHaveCount(0)
})