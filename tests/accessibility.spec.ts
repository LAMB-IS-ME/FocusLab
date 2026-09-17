import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

for (const theme of ['light', 'dark'] as const) {
  test(`nhãn và tương phản giao diện ${theme === 'light' ? 'sáng' : 'tối'}`, async ({ page }) => {
    test.setTimeout(90000)
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    for (const route of [
      'dashboard',
      'tasks',
      'focus',
      'calendar',
      'subjects',
      'notes',
      'settings',
    ]) {
      await page.goto(`/#${route}`)
      await expect(page.locator('h1')).toBeVisible()
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
      expect(results.violations, `Trang ${route}`).toEqual([])
    }
  })
}
