import AxeBuilder from '@axe-core/playwright'
import { expect, test, synced } from './fixtures'

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
      await synced(page)
      await expect(page.locator('.page-heading h1')).toBeVisible()
      await page.evaluate(() => document.fonts.ready)
      await expect(page.locator('main > div').last()).toHaveCSS('opacity', '1')
      await expect
        .poll(() =>
          page.evaluate(() =>
            [...document.querySelectorAll<HTMLElement>('main [style]')].every(
              (element) =>
                !element.style.opacity ||
                getComputedStyle(element).visibility === 'hidden' ||
                Number(element.style.opacity) === 1,
            ),
          ),
        )
        .toBe(true)
      for (const card of await page.locator('.stat-card').all())
        await expect(card).toHaveCSS('opacity', '1')
      await expect(page.locator('h1')).toBeVisible()
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      // Axe cần ảnh chụp sau cả animation của các trang lazy-loaded.
      await page.waitForTimeout(600)
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
      expect(results.violations, `Trang ${route}`).toEqual([])
    }
  })
}
