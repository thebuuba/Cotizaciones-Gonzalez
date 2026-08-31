import { expect, test } from '@playwright/test'

import { signIn } from './helpers'

test('offers native PWA installation and hides the action after installation', async ({ page }) => {
  await signIn(page)
  await page.goto('/ajustes')
  await expect(page.getByText('Añadir a pantalla de inicio')).toBeVisible()
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
      prompt: () => Promise<void>
      userChoice: Promise<{ outcome: 'accepted'; platform: string }>
    }
    event.prompt = async () => undefined
    event.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' })
    window.dispatchEvent(event)
  })

  await expect(page.getByRole('button', { name: 'Instalar aplicación' })).toBeVisible()
  await page.getByRole('button', { name: 'Instalar aplicación' }).click()
  await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')))
  await expect(page.getByRole('button', { name: 'Instalar aplicación' })).toBeHidden()
})

test('shows Add to Home Screen guidance on iPhone', async ({ page }) => {
  await signIn(page)
  await page.goto('/ajustes')

  await expect(page.getByText('Compartir')).toBeVisible()
  await expect(page.getByText('Añadir a pantalla de inicio')).toBeVisible()
})
