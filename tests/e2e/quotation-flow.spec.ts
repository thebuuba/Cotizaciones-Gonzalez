import { expect, test } from '@playwright/test'

import { signIn, uniqueE2eName } from './helpers'

test('creates three materials, calculates the sheet, reopens it and exports one image', async ({ page }) => {
  const clientName = uniqueE2eName('Cliente Flujo Completo')
  await signIn(page)
  await page.goto('/clientes')
  await page.getByRole('button', { name: 'Nuevo cliente' }).click()
  await page.getByLabel('Nombre del cliente').fill(clientName)
  await page.getByLabel('Dirección de contacto').fill('Santo Domingo')
  await page.getByRole('button', { name: 'Guardar cliente' }).click()
  await page.getByRole('button', { name: `Cotizar para ${clientName}` }).click()

  await page.getByLabel('Descripción 1').fill('Cerámica')
  await page.getByLabel('Cantidad 1').fill('2')
  await page.getByLabel('Precio unitario 1').fill('100')
  await page.getByRole('button', { name: 'Agregar material' }).click()
  await page.getByLabel('Descripción 2').fill('Pegamento')
  await page.getByLabel('Cantidad 2').fill('3')
  await page.getByLabel('Precio unitario 2').fill('50')
  await page.getByRole('button', { name: 'Agregar material' }).click()
  await page.getByLabel('Descripción 3').fill('Boquilla')
  await page.getByLabel('Cantidad 3').fill('1.5')
  await page.getByLabel('Precio unitario 3').fill('100')
  await page.getByLabel('Mano de obra instalación').fill('500')

  await expect(page.getByTestId('material-total-0')).toHaveText('RD$ 200.00')
  await expect(page.getByTestId('material-total-1')).toHaveText('RD$ 150.00')
  await expect(page.getByTestId('material-total-2')).toHaveText('RD$ 150.00')
  await expect(page.getByTestId('general-total')).toHaveText('RD$ 1,000.00')
  await expect(page.getByText('Guardando…')).toBeVisible()
  await expect(page.getByText('Guardado')).toBeVisible()

  await page.goto('/cotizaciones')
  await page.getByRole('link', { name: new RegExp(`COT-\\d+.*${clientName}`) }).click()
  await expect(page.getByText('TOTAL GENERAL')).toBeVisible()
  await expect(page.getByText('RD$ 1,000.00').first()).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exportar imagen' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^COT-\d+-Cliente-Flujo-Completo-[a-f0-9]+\.png$/)
})
