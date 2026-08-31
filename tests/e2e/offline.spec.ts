import { expect, test } from '@playwright/test'

import { signIn, uniqueE2eName } from './helpers'

test('reloads and edits a saved quotation without internet', async ({ context, page }) => {
  const clientName = uniqueE2eName('Cliente Sin Internet')
  await signIn(page)
  await page.goto('/clientes')
  await page.getByRole('button', { name: 'Nuevo cliente' }).click()
  await page.getByLabel('Nombre del cliente').fill(clientName)
  await page.getByLabel('Dirección de contacto').fill('Santiago')
  await page.getByRole('button', { name: 'Guardar cliente' }).click()
  await page.getByRole('button', { name: `Cotizar para ${clientName}` }).click()
  await page.getByLabel('Descripción 1').fill('Porcelanato')
  await page.getByLabel('Cantidad 1').fill('4')
  await page.getByLabel('Precio unitario 1').fill('250')
  await expect(page.getByText('Guardando…')).toBeVisible()
  await expect(page.getByText('Guardado')).toBeVisible()

  await page.goto('/cotizaciones')
  await page.evaluate(async () => { await navigator.serviceWorker.ready })
  await page.reload()
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)
  const quotationLink = page.getByRole('link', { name: new RegExp(`COT-\\d+.*${clientName}`) })
  await expect(quotationLink).toBeVisible()

  await context.setOffline(true)
  await page.goto('/cotizaciones', { waitUntil: 'domcontentloaded' })
  await quotationLink.click()
  await page.getByRole('link', { name: 'Editar cotización' }).click()
  await page.getByLabel('Observaciones').fill('Cambio guardado sin conexión')
  await expect(page.getByText('Guardando…')).toBeVisible()
  await expect(page.getByText('Guardado')).toBeVisible()
  await page.goto(page.url(), { waitUntil: 'domcontentloaded' })
  await expect(page.getByLabel('Observaciones')).toHaveValue('Cambio guardado sin conexión')

  await context.setOffline(false)
  await page.reload()
  await expect(page.getByLabel('Observaciones')).toHaveValue('Cambio guardado sin conexión')
})
