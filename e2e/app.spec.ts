import { expect, test, type Page } from '@playwright/test'

async function loginAs(page: Page, role: 'Администратор' | 'Менеджер') {
  await page.goto('/#/login')
  await page.getByRole('heading', { name: 'Вход в систему' }).waitFor()
  await page.getByRole('button', { name: role }).click()
  await expect(page.getByRole('heading', { name: /Здравствуйте/ })).toBeVisible()
}

test('гость открывает калькулятор без входа и не видит служебные разделы', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('heading', { name: 'Стоимость тюнинга' }).waitFor()

  const nav = page.getByRole('navigation')
  await expect(nav.getByRole('link', { name: 'Калькулятор', exact: true })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'Прайс-матрица', exact: true })).toHaveCount(0)
  await expect(nav.getByRole('link', { name: 'Автомобили', exact: true })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Войти' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Сохранить КП' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Копировать КП' })).toBeVisible()

  await page.goto('/#/services')
  await page.getByRole('heading', { name: 'Вход в систему' }).waitFor()
})

test('демо-вход администратора: полный доступ', async ({ page }) => {
  await loginAs(page, 'Администратор')

  const nav = page.getByRole('navigation')
  await expect(nav.getByRole('link', { name: 'Калькулятор', exact: true })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'Прайс-матрица', exact: true })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'Автомобили', exact: true })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'Услуги', exact: true })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'Настройки', exact: true })).toBeVisible()
})

test('менеджер: автомобили и прайс доступны, услуги и настройки закрыты', async ({ page }) => {
  await loginAs(page, 'Менеджер')

  const nav = page.getByRole('navigation')
  await expect(nav.getByRole('link', { name: 'Прайс-матрица', exact: true })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'Автомобили', exact: true })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'Услуги', exact: true })).toHaveCount(0)
  await expect(nav.getByRole('link', { name: 'Настройки', exact: true })).toHaveCount(0)

  await page.getByRole('link', { name: 'Прайс-матрица', exact: true }).click()
  await page.getByRole('heading', { name: 'Прайс-матрица' }).waitFor()
  await page.goto('/#/services')
  await expect(page.getByRole('heading', { name: /Здравствуйте/ })).toBeVisible()
})