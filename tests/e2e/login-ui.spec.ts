import { expect, test } from '@playwright/test'

test('keeps the login simple and touch friendly on iPhone', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Bienvenido' })).toBeVisible()
  await expect(page.getByText('Accede a tus cotizaciones y respaldos.')).toBeVisible()

  const email = page.getByLabel('Correo electrónico')
  const password = page.getByLabel('Contraseña')
  const card = page.locator('.auth-card')

  expect((await email.boundingBox())?.width).toBeGreaterThan(300)
  expect((await password.boundingBox())?.width).toBeGreaterThan(300)
  expect((await email.boundingBox())?.height).toBeGreaterThanOrEqual(44)
  expect((await page.getByRole('button', { name: 'Entrar' }).boundingBox())?.height).toBeGreaterThanOrEqual(44)
  expect((await card.boundingBox())?.width).toBeLessThanOrEqual(420)
})
