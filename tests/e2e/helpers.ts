import { expect, type Page } from '@playwright/test'
import { randomUUID } from 'node:crypto'

export const E2E_OWNER_EMAIL = process.env.E2E_OWNER_EMAIL ?? 'nata@nata.com'
export const E2E_OWNER_PASSWORD = process.env.E2E_OWNER_PASSWORD ?? 'Nata121212'

export const uniqueE2eName = (base: string) => `${base} ${randomUUID().slice(0, 8)}`

export async function signIn(page: Page) {
  await page.goto('/')
  await page.getByLabel('Correo electrónico').fill(E2E_OWNER_EMAIL)
  await page.getByLabel('Contraseña').fill(E2E_OWNER_PASSWORD)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('link', { name: 'Inicio' })).toHaveAttribute('aria-current', 'page')
}
