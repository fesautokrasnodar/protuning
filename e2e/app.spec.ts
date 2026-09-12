import { expect, test, type Page } from '@playwright/test'

async function loginAsAdmin(page: Page) {
  await page.goto('/#/login')
  await page.getByRole('heading', { name: 'Вход в систему' }).waitFor()
  await page.getByRole('button', { name: 'Администратор' }).click()
  await expect(page.getByRole('heading', { name: /Здравствуйте/ })).toBeVisible()
}

test('посетитель сразу попадает в калькулятор (уровень «Пользователь»)', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('heading', { name: 'Стоимость тюнинга' }).waitFor()

  await expect(page.getByRole('link', { name: 'Войти' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Сохранить КП' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Копировать КП' })).toBeVisible()
  await expect(page.getByRole('navigation')).toHaveCount(0)

  await page.goto('/#/services')
  await page.getByRole('heading', { name: 'Вход в систему' }).waitFor()
})

test('администратор: сохранение КП и полный доступ', async ({ page }) => {
  await loginAsAdmin(page)

  const nav = page.getByRole('navigation')
  await expect(nav.getByRole('link', { name: 'Калькулятор', exact: true })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'Прайс-матрица', exact: true })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'Автомобили', exact: true })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'Услуги', exact: true })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'Настройки', exact: true })).toBeVisible()

  await nav.getByRole('link', { name: 'Калькулятор', exact: true }).click()
  await page.getByRole('heading', { name: 'Стоимость тюнинга' }).waitFor()
  await expect(page.getByRole('button', { name: 'Сохранить КП' })).toBeVisible()
})