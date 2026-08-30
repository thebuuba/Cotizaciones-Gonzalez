import { expect, test } from '@playwright/test'

import { signIn } from './helpers'

test('keeps controls accessible and the app shell contained at narrow iPhone widths', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await signIn(page)
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/')
    await page.evaluate(() => { document.documentElement.style.fontSize = '125%' })
    const dimensions = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: window.innerWidth }))
    expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport)

    for (const link of await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link').all()) {
      const box = await link.boundingBox()
      expect(box?.height).toBeGreaterThanOrEqual(44)
    }
  }

  const navigation = page.getByRole('navigation', { name: 'Navegación principal' })
  await expect(navigation.getByRole('link')).toHaveText(['Inicio', 'Cotizaciones', 'Clientes', 'Ajustes'])
  const focusTarget = page.getByRole('link', { name: 'Nueva cotización' })
  await focusTarget.focus()
  const focused = page.locator(':focus')
  await expect(focused).toBeVisible()
  expect(await focused.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe('none')
  const duration = await page.getByRole('link', { name: 'Nueva cotización' }).evaluate((element) => getComputedStyle(element).transitionDuration)
  expect(duration).toBe('0.00001s')
})
