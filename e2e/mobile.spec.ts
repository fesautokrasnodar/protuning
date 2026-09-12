import { expect, test } from '@playwright/test'

test('нет горизонтального переполнения страниц на мобильном', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#/login')
  await page.getByRole('heading', { name: 'Вход в систему' }).waitFor()
  await page.getByRole('button', { name: 'Администратор' }).click()
  await page.getByRole('heading', { name: /Здравствуйте/ }).waitFor()

  const routes = ['/dashboard', '/calculator', '/proposals', '/price-matrix', '/cars', '/services', '/settings']

  for (const route of routes) {
    await page.goto(`#${route}`)
    await page.waitForTimeout(400)
    const overflow = await page.evaluate(() => {
      const d = (globalThis as any).document
      return d.documentElement.scrollWidth - d.documentElement.clientWidth
    })
    console.log(`overflow ${route}: ${overflow}`)
    expect(overflow).toBeLessThanOrEqual(1)
  }
})

test('бургер-меню на мобильных, навбар на десктопе', async ({ page }) => {
  await page.goto('/#/login')
  await page.getByRole('heading', { name: 'Вход в систему' }).waitFor()
  await page.getByRole('button', { name: 'Администратор' }).click()
  await page.getByRole('heading', { name: /Здравствуйте/ }).waitFor()

  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'Открыть меню' }).click()
  const menuLink = page.getByRole('link', { name: 'Калькулятор', exact: true })
  await expect(menuLink).toBeVisible()
  await expect(menuLink).toHaveAttribute('href', '#/calculator')
  await page.getByRole('link', { name: 'Прайс-матрица', exact: true }).click()
  await page.getByRole('heading', { name: 'Прайс-матрица' }).waitFor()
  const tableVisible = await page.evaluate(() => {
    const t = (globalThis as any).document.querySelector('table')
    return t ? t.offsetParent !== null : false
  })
  expect(tableVisible).toBe(false)

  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/#/price-matrix')
  await page.getByRole('heading', { name: 'Прайс-матрица' }).waitFor()
  await expect(page.getByRole('button', { name: 'Открыть меню' })).toHaveCount(0)
  const desktopTableVisible = await page.evaluate(() => {
    const t = (globalThis as any).document.querySelector('table')
    return t ? t.offsetParent !== null : false
  })
  expect(desktopTableVisible).toBe(true)
})