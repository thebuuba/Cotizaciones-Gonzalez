import { expect, test } from '@playwright/test'

test('uses the approved gold action with accessible black text', async ({ page }) => {
  await page.goto('/')

  const primaryAction = page.getByRole('button', { name: 'Entrar' })
  await expect(primaryAction).toBeVisible()

  const colors = await primaryAction.evaluate((element) => {
    const style = getComputedStyle(element)
    return { backgroundImage: style.backgroundImage, color: style.color }
  })

  expect(colors.backgroundImage).toContain('rgb(252, 163, 17)')
  expect(colors.color).toBe('rgb(0, 0, 0)')
})

test('keeps the top app background free of a gold gradient', async ({ page }) => {
  await page.goto('/')

  const backgroundImage = await page.locator('body').evaluate((element) => getComputedStyle(element).backgroundImage)

  expect(backgroundImage).not.toContain('252, 163, 17')
})
