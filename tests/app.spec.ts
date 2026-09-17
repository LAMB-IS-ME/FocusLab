import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function go(page: Page, route: string) {
  await page.goto(`/#${route}`)
  await expect(page.locator('h1')).toBeVisible()
}
async function stored(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('studyflow:data:v1')!))
}

test('công việc: tạo, sửa, lọc, hoàn thành, lưu và xóa', async ({ page }) => {
  await go(page, 'tasks')
  await page.getByRole('button', { name: 'Thêm công việc', exact: true }).first().click()
  await page.getByLabel('Tên công việc').fill('Bài tập kiểm thử')
  await page
    .getByRole('dialog')
    .getByRole('combobox', { name: 'Môn học', exact: true })
    .selectOption('math')
  await page.getByRole('button', { name: 'Lưu công việc' }).click()
  await page.getByRole('button', { name: 'Bài tập kiểm thử', exact: true }).click()
  await page.getByLabel('Tên công việc').fill('Bài tập đã chỉnh sửa')
  await page
    .getByRole('dialog')
    .getByRole('combobox', { name: 'Mức ưu tiên', exact: true })
    .selectOption('high')
  await page.getByRole('button', { name: 'Lưu công việc' }).click()
  await page.getByLabel('Trạng thái Bài tập đã chỉnh sửa').selectOption('progress')
  await page.getByRole('button', { name: 'Hoàn thành: Bài tập đã chỉnh sửa', exact: true }).click()
  await page.reload()
  await page.getByRole('button', { name: 'Đã hoàn thành', exact: true }).click()
  await page.getByLabel('Tìm công việc').fill('Bài tập đã chỉnh sửa')
  await expect(
    page.getByRole('button', { name: 'Bài tập đã chỉnh sửa', exact: true }),
  ).toBeVisible()
  const task = (await stored(page)).tasks.find(
    (t: { title: string }) => t.title === 'Bài tập đã chỉnh sửa',
  )
  expect(task.status).toBe('done')
  expect(task.priority).toBe('high')
  expect(task.subjectId).toBe('math')
  await page.getByRole('button', { name: 'Bài tập đã chỉnh sửa', exact: true }).click()
  await page.getByRole('button', { name: 'Xóa', exact: true }).click()
  await page
    .getByRole('dialog', { name: 'Xóa công việc?' })
    .getByRole('button', { name: 'Xóa', exact: true })
    .click()
  await expect(page.getByRole('button', { name: 'Bài tập đã chỉnh sửa', exact: true })).toHaveCount(
    0,
  )
})

test('lịch và môn học: tạo, sửa, xem chi tiết, xóa vẫn giữ công việc', async ({ page }) => {
  await go(page, 'subjects')
  await page.getByRole('button', { name: 'Thêm môn học', exact: true }).click()
  await page.getByLabel('Tên môn học').fill('Vật lý kiểm thử')
  await page.getByRole('button', { name: 'Lưu môn học' }).click()
  await page.reload()
  await page.getByRole('button', { name: 'Sửa Vật lý kiểm thử' }).click()
  await page.getByLabel('Tên môn học').fill('Vật lý đại cương')
  await page.getByRole('button', { name: 'Lưu môn học' }).click()
  await page.getByRole('button', { name: 'Vật lý đại cương', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Vật lý đại cương' })).toBeVisible()
  await page.keyboard.press('Escape')
  await go(page, 'calendar')
  await page.getByRole('button', { name: 'Thêm lịch học', exact: true }).first().click()
  await page.getByLabel('Tên sự kiện').fill('Học nhóm kiểm thử')
  await page.getByLabel('Giờ bắt đầu').fill('18:30')
  await page.getByLabel('Thời lượng').fill('45')
  await page.getByRole('button', { name: 'Lưu lịch học' }).click()
  await page.reload()
  await page.locator('.day-event').filter({ hasText: 'Học nhóm kiểm thử' }).click()
  await page.getByLabel('Tên sự kiện').fill('Học nhóm đã sửa')
  await page.getByRole('button', { name: 'Lưu lịch học' }).click()
  await page.getByRole('button', { name: 'Tháng sau' }).click()
  await page.getByRole('button', { name: 'Hôm nay', exact: true }).click()
  await expect(page.locator('.day-event').filter({ hasText: 'Học nhóm đã sửa' })).toBeVisible()
  await page.locator('.day-event').filter({ hasText: 'Học nhóm đã sửa' }).click()
  await page.getByRole('button', { name: 'Xóa', exact: true }).click()
  await page
    .getByRole('dialog', { name: 'Xóa lịch học?' })
    .getByRole('button', { name: 'Xóa', exact: true })
    .click()
  await go(page, 'subjects')
  const originalCount = (await stored(page)).tasks.length
  await page.getByRole('button', { name: 'Xóa Toán cao cấp', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Xóa', exact: true }).click()
  const data = await stored(page)
  expect(data.tasks).toHaveLength(originalCount)
  expect(data.tasks.some((t: { subjectId: string }) => t.subjectId === 'math')).toBe(false)
})

test('ghi chú tự lưu, ghim, tìm và xóa; command palette dùng bàn phím', async ({ page }) => {
  await go(page, 'dashboard')
  await page.keyboard.press('Control+k')
  await page.getByRole('combobox', { name: 'Tìm thao tác' }).fill('Tạo Ghi chú')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByLabel('Tiêu đề ghi chú').fill('Ghi chú kiểm thử')
  await page.getByLabel('Nội dung ghi chú').fill('Nội dung được lưu sau khi tải lại.')
  await page.getByRole('button', { name: 'Ghim ghi chú', exact: true }).click()
  await page.reload()
  await expect(page.getByLabel('Nội dung ghi chú')).toHaveValue(
    'Nội dung được lưu sau khi tải lại.',
  )
  await page.getByLabel('Tìm ghi chú').fill('kiểm thử')
  await expect(page.locator('.note-preview')).toHaveCount(1)
  await page.getByRole('button', { name: 'Xóa ghi chú', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Xóa', exact: true }).click()
  await page.keyboard.press('Control+k')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(page.locator('h1')).toHaveText('Công việc')
  await page.keyboard.press('Control+k')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('Pomodoro chạy qua điều hướng, tải lại, tạm dừng và lưu đúng một phiên', async ({ page }) => {
  await page.clock.install()
  await go(page, 'settings')
  await page.getByRole('spinbutton', { name: 'Tập trung phút', exact: true }).fill('1')
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await go(page, 'focus')
  await page.getByRole('combobox', { name: 'Bạn đang học môn gì?' }).selectOption('math')
  await page.getByRole('combobox', { name: 'Công việc trong phiên này' }).selectOption('t2')
  const initialSessions = (await stored(page)).sessions.length
  await page.getByRole('button', { name: 'Bắt đầu', exact: true }).click()
  await page.clock.fastForward(10000)
  await page.getByRole('button', { name: 'Tạm dừng', exact: true }).click()
  const paused = (await stored(page)).timer.remaining
  await page.clock.fastForward(10000)
  expect((await stored(page)).timer.remaining).toBe(paused)
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page
    .getByRole('navigation', { name: 'Điều hướng chính' })
    .getByRole('button', { name: 'Tổng quan' })
    .click()
  await page.clock.fastForward(20000)
  await page.reload()
  await page.clock.fastForward(40000)
  await expect.poll(async () => (await stored(page)).sessions.length).toBe(initialSessions + 1)
  await page.reload()
  expect((await stored(page)).sessions.length).toBe(initialSessions + 1)
  expect((await stored(page)).timer.mode).toBe('short')
  const session = (await stored(page)).sessions.at(-1)
  expect(session.subjectId).toBe('math')
  expect(session.taskId).toBe('t2')
})

test('theme, xác nhận reset và dữ liệu hỏng', async ({ page }) => {
  await go(page, 'settings')
  await page.getByRole('button', { name: 'Tối', exact: true }).click()
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.getByRole('button', { name: 'Xóa toàn bộ dữ liệu', exact: true }).click()
  await page.getByRole('button', { name: 'Hủy', exact: true }).click()
  expect((await stored(page)).tasks.length).toBeGreaterThan(0)
  await page.getByRole('button', { name: 'Xóa toàn bộ dữ liệu', exact: true }).click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Xóa toàn bộ dữ liệu', exact: true })
    .click()
  await page.reload()
  expect((await stored(page)).tasks).toHaveLength(0)
  expect((await stored(page)).notes).toHaveLength(0)
  await page.evaluate(() => localStorage.setItem('studyflow:data:v1', '{bad'))
  await page.reload()
  await expect(page.getByRole('alert')).toContainText('Dữ liệu cũ không đọc được')
  await expect(page.locator('h1')).toHaveText('Cài đặt')
})

test('mọi trang ở desktop và mobile không tràn hoặc lỗi console', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 })
    for (const route of [
      'dashboard',
      'tasks',
      'focus',
      'calendar',
      'subjects',
      'notes',
      'settings',
    ]) {
      await go(page, route)
      await page.waitForTimeout(250)
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        `${route} ở ${width}px`,
      ).toBe(true)
    }
  }
  expect(errors).toEqual([])
})

test('kéo thả Kanban và thêm công việc trực tiếp vào cột', async ({ page }) => {
  await go(page, 'tasks')
  const source = page.locator('.kanban-card').filter({ hasText: 'Ôn chương 3 Toán cao cấp' })
  await source.dragTo(page.locator('.kanban-column').nth(2))
  await expect
    .poll(
      async () =>
        (await stored(page)).tasks.find((task: { id: string }) => task.id === 't2').status,
    )
    .toBe('done')
  await page.getByRole('button', { name: 'Thêm công việc đang thực hiện', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveAccessibleName('Thêm công việc')
  await page.getByLabel('Tên công việc').fill('Việc mới trong cột')
  await page.getByRole('button', { name: 'Lưu công việc' }).click()
  await expect(
    page
      .locator('.kanban-column')
      .nth(1)
      .getByRole('button', { name: 'Việc mới trong cột', exact: true }),
  ).toBeVisible()
})

test('điều hướng mobile, hộp thoại, theme hệ thống và bàn phím', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await go(page, 'dashboard')
  await page.locator('.bottom-nav').getByRole('button', { name: 'Thêm', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Ghi chú', exact: true }).click()
  await expect(page.locator('h1')).toHaveText('Ghi chú')
  await page.locator('.bottom-nav').getByRole('button', { name: 'Công việc', exact: true }).click()
  await page.getByRole('button', { name: 'Thêm công việc', exact: true }).first().click()
  await expect(page.getByLabel('Tên công việc')).toBeFocused()
  await page.getByRole('button', { name: 'Lưu công việc' }).click()
  await expect(page.getByRole('alert')).toContainText('Hãy nhập tên')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Chọn giao diện' }).click()
  await expect(page.getByRole('menuitemradio', { name: 'Theo hệ thống' })).toBeFocused()
  await page.keyboard.press('Home')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.getByRole('button', { name: 'Chọn giao diện' }).click()
  await page.getByRole('menuitemradio', { name: 'Theo hệ thống' }).click()
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.emulateMedia({ colorScheme: 'dark' })
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.keyboard.press('Meta+k')
  await expect(page.getByRole('combobox', { name: 'Tìm thao tác' })).toBeFocused()
  await page.keyboard.press('Escape')
})

test('ghi chú tạo từ command palette khi trang ghi chú đang mở', async ({ page }) => {
  await go(page, 'notes')
  await page.keyboard.press('Control+k')
  await page.getByRole('combobox', { name: 'Tìm thao tác' }).fill('Tạo Ghi chú')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByLabel('Nội dung ghi chú')).toHaveValue('')
  await page.getByLabel('Nội dung ghi chú').fill('Một ghi chú mới')
  await page.reload()
  await expect(page.getByLabel('Nội dung ghi chú')).toHaveValue('Một ghi chú mới')
})

test('đồng bộ thay đổi giữa hai thẻ và lưu trạng thái thu gọn', async ({ page, context }) => {
  await go(page, 'tasks')
  const other = await context.newPage()
  await go(other, 'tasks')
  await page.getByRole('button', { name: 'Hoàn thành: Ôn chương 3 Toán cao cấp' }).click()
  await expect(
    other.getByRole('button', { name: 'Mở lại: Ôn chương 3 Toán cao cấp' }),
  ).toBeVisible()
  await other.getByRole('button', { name: 'Mở lại: Ôn chương 3 Toán cao cấp' }).click()
  await expect(
    page.getByRole('button', { name: 'Hoàn thành: Ôn chương 3 Toán cao cấp' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Thu gọn thanh bên' }).click()
  await page.reload()
  await expect(page.locator('.app-shell')).toHaveClass(/is-collapsed/)
})
