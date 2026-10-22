import { expect, test } from '@playwright/test'

test.use({ channel: 'chrome' })

test('creates, reloads and edits offline, then syncs when the connection returns', async ({ context, page }) => {
  // Keep this regression isolated from the owner's real account and database.
  const ownerId = '11111111-1111-4111-8111-111111111111'
  const expiresAt = Math.floor(Date.now() / 1000) + 3600
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url')
  const accessToken = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: ownerId, role: 'authenticated', aud: 'authenticated', exp: expiresAt })}.test-signature`
  let cloudWrites = 0
  await context.route('https://*.supabase.co/**', async route => {
    const request = route.request()
    if (request.url().includes('/auth/v1/token')) {
      await route.fulfill({ json: {
        access_token: accessToken, refresh_token: 'offline-test-refresh-token', token_type: 'bearer', expires_in: 3600,
        user: { id: ownerId, email: 'offline@example.com', aud: 'authenticated', role: 'authenticated',
          app_metadata: {}, user_metadata: {}, identities: [], created_at: '2026-01-01T00:00:00.000Z' },
      } })
    } else {
      if (request.method() === 'POST') cloudWrites += 1
      await route.fulfill({ json: [] })
    }
  })

  await page.goto('/')
  await page.getByLabel('Correo electrónico').fill('offline@example.com')
  await page.getByLabel('Contraseña').fill('offline-test-password')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('link', { name: 'Inicio', exact: true })).toHaveAttribute('aria-current', 'page')
  await page.evaluate(async () => { await navigator.serviceWorker.ready })
  await page.reload()
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)

  await context.setOffline(true)
  await page.goto('/cotizaciones/nueva', { waitUntil: 'domcontentloaded' })
  await page.getByLabel('Nombre del cliente').fill('Cliente sin internet')
  await page.getByLabel('Teléfono').fill('8099999999')
  await page.getByLabel('Dirección', { exact: true }).fill('Dirección de prueba')
  await page.getByLabel('Descripción 1', { exact: true }).fill('Trabajo guardado sin internet')
  await page.getByLabel('Cantidad 1', { exact: true }).fill('2')
  await page.getByLabel('Precio unitario 1', { exact: true }).fill('1500')
  await page.getByRole('button', { name: 'Guardar cotización', exact: true }).click()
  await page.getByRole('link', { name: /Cliente sin internet/ }).click()
  await page.getByRole('button', { name: 'Acciones de la cotización' }).click()
  await page.getByRole('link', { name: 'Editar', exact: true }).click()
  await page.getByLabel('Observaciones', { exact: true }).fill('Cambio persistido sin conexión')
  await expect(page.getByText('Guardado', { exact: true })).toBeVisible()
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.getByLabel('Observaciones', { exact: true })).toHaveValue('Cambio persistido sin conexión')
  await expect(page.getByLabel('Teléfono')).toHaveValue('(809) 999-9999')
  expect(cloudWrites).toBe(0)

  await context.setOffline(false)
  await page.getByRole('link', { name: 'Ajustes', exact: true }).click()
  await expect(page.getByText('Sincronizado', { exact: true })).toBeVisible()
  expect(cloudWrites).toBeGreaterThan(0)
})
