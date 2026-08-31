import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import { signIn, uniqueE2eName } from './helpers'

test('creates and exports the approved quotation sheet', async ({ page }) => {
  test.setTimeout(120_000)
  const clientName = uniqueE2eName('María Rodríguez')
  const outputDirectory = path.resolve('tmp/pdfs')
  await mkdir(outputDirectory, { recursive: true })
  await signIn(page)
  await page.goto('/clientes')
  await page.getByRole('button', { name: 'Nuevo cliente' }).click()
  await page.getByLabel('Nombre del cliente').fill(clientName)
  await page.getByLabel('Dirección de contacto').fill('Santo Domingo Este')
  await page.getByLabel('Nombre de ubicación 1').fill('Casa')
  await page.getByLabel('Dirección de ubicación 1').fill('Santo Domingo Este')
  await page.getByRole('button', { name: 'Guardar cliente' }).click()
  await page.getByRole('button', { name: `Cotizar en Casa para ${clientName}` }).click()

  await page.getByLabel('Descripción 1').fill('Cerámica de piso formato grande')
  await page.getByLabel('Cantidad 1').fill('10')
  await page.getByLabel('Unidad 1').fill('m²')
  await page.getByLabel('Precio unitario 1').fill('1000')
  await page.getByRole('button', { name: 'Agregar material' }).click()
  await page.getByLabel('Descripción 2').fill('Pegamento para cerámica')
  await page.getByLabel('Cantidad 2').fill('5')
  await page.getByLabel('Unidad 2').fill('funda')
  await page.getByLabel('Precio unitario 2').fill('500')
  await page.getByLabel('Mano de obra instalación').fill('8000')
  await page.getByLabel('Observaciones').fill('Confirmar color de la boquilla antes de iniciar.')
  await expect(page.getByText('Guardando…')).toBeVisible()
  await expect(page.getByText('Guardado')).toBeVisible()

  await page.goto('/cotizaciones')
  await page.getByRole('link', { name: new RegExp(`COT-\\d+.*${clientName}`) }).click()
  await expect(page.getByText('COTIZACIÓN')).toBeVisible()
  await page.locator('[data-export-page]').screenshot({ path: 'tmp/pdfs/quotation-preview.png' })

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exportar PDF' }).click()
  const download = await downloadPromise
  await download.saveAs(path.join(outputDirectory, 'cotizacion-acabados-modernos.pdf'))

  await page.getByRole('link', { name: 'Editar cotización' }).click()
  for (let index = 3; index <= 30; index += 1) {
    await page.getByRole('button', { name: 'Agregar material' }).click()
    await page.getByLabel(`Descripción ${index}`).fill(`Material adicional ${index}`)
    await page.getByLabel(`Cantidad ${index}`).fill('1')
    await page.getByLabel(`Precio unitario ${index}`).fill('100')
  }
  await expect(page.getByText('Guardando…')).toBeVisible()
  await expect(page.getByText('Guardado')).toBeVisible()
  await page.goto(page.url().replace('/editar', ''))
  await expect(page.locator('[data-export-page]')).toHaveCount(2)
  await page.locator('[data-export-page]').first().screenshot({ path: 'tmp/pdfs/multi-dom-page-1.png' })

  const multipageDownloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exportar PDF' }).click()
  const multipageDownload = await multipageDownloadPromise
  await multipageDownload.saveAs(path.join(outputDirectory, 'cotizacion-multipagina.pdf'))

  const imageDownloads: Array<{ saveAs(path: string): Promise<void> }> = []
  page.on('download', (item) => imageDownloads.push(item))
  await page.getByRole('button', { name: 'Exportar imagen' }).click()
  await expect.poll(() => imageDownloads.length).toBe(1)
  await imageDownloads[0]!.saveAs(path.join(outputDirectory, 'cotizacion-multipagina-1.png'))
})
