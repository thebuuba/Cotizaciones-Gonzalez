import { expect, test } from '@playwright/test'

import { E2E_OWNER_EMAIL, E2E_OWNER_PASSWORD, signIn, uniqueE2eName } from './helpers'

test('restores owner data in a fresh authenticated browser context', async ({ browser }) => {
  test.skip(!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_PUBLISHABLE_KEY || !E2E_OWNER_EMAIL || !E2E_OWNER_PASSWORD, 'Requiere proyecto y cuenta E2E de Supabase')
  const uniqueClient = uniqueE2eName('Restaurado')
  const firstContext = await browser.newContext()
  const firstPage = await firstContext.newPage()
  await firstPage.goto('/')
  await signIn(firstPage)
  await firstPage.goto('/clientes')
  await firstPage.getByRole('button', { name: 'Nuevo cliente' }).click()
  await firstPage.getByLabel('Nombre del cliente').fill(uniqueClient)
  await firstPage.getByLabel('Dirección de contacto').fill('La Romana')
  await firstPage.getByRole('button', { name: 'Guardar cliente' }).click()
  await firstPage.goto('/')
  await expect(firstPage.getByText('Sincronizado')).toBeVisible()
  await firstContext.close()

  const secondContext = await browser.newContext()
  const secondPage = await secondContext.newPage()
  await secondPage.goto('/')
  await signIn(secondPage)
  await secondPage.goto('/clientes')
  await expect(secondPage.getByText(uniqueClient)).toBeVisible()
  await secondContext.close()
})
