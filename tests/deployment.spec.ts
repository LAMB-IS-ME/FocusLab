import { readFile } from 'node:fs/promises'
import { resolve, extname } from 'node:path'
import { expect, test } from '@playwright/test'

for (const base of ['studyflow', 'FocusLab']) {
  test(`tài nguyên và tải lại hoạt động tại /${base}/`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    const types: Record<string, string> = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.svg': 'image/svg+xml',
      '.woff2': 'font/woff2',
      '.woff': 'font/woff',
    }
    // Mô phỏng máy chủ tĩnh chỉ phục vụ nội dung dist dưới tên repository.
    await page.route('**/*', async (route) => {
      const pathname = new URL(route.request().url()).pathname
      if (!pathname.startsWith(`/${base}/`)) {
        errors.push(`Đường dẫn tài nguyên sai: ${pathname}`)
        await route.fulfill({ status: 404 })
        return
      }
      const relative = pathname.slice(base.length + 2) || 'index.html'
      const file = resolve('dist', relative)
      if (!file.startsWith(resolve('dist') + '/')) {
        await route.fulfill({ status: 404 })
        return
      }
      try {
        await route.fulfill({
          body: await readFile(file),
          contentType: types[extname(file)] ?? 'application/octet-stream',
        })
      } catch {
        errors.push(`Thiếu tài nguyên: ${relative}`)
        await route.fulfill({ status: 404 })
      }
    })
    await page.goto(`/${base}/#tasks`)
    await expect(page.locator('h1')).toHaveText('Công việc')
    await page.reload()
    await expect(
      page.getByRole('button', { name: 'Ôn chương 3 Toán cao cấp', exact: true }),
    ).toBeVisible()
    await page
      .getByRole('navigation', { name: 'Điều hướng chính' })
      .getByRole('button', { name: 'Ghi chú', exact: true })
      .click()
    await expect(page.locator('h1')).toHaveText('Ghi chú')
    await page.reload()
    await expect(page.getByLabel('Nội dung ghi chú')).toBeVisible()
    expect(errors).toEqual([])
  })
}
