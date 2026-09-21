import { test, expect, synced, authKey, sessionFor } from './fixtures'

test.describe('Email và mật khẩu', () => {
  test.use({ authenticated: false })
  test('đăng ký, xác nhận mật khẩu, thông báo kiểm tra email', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Chưa có tài khoản? Đăng ký' }).click()
    await page.getByLabel('Email', { exact: true }).fill('new@example.test')
    await page.getByLabel('Mật khẩu', { exact: true }).fill('test-password')
    await page.getByLabel('Xác nhận mật khẩu').fill('different-password')
    await page.getByRole('button', { name: 'Đăng ký', exact: true }).click()
    await expect(page.getByRole('alert')).toHaveText('Mật khẩu xác nhận chưa khớp.')
    await page.getByLabel('Xác nhận mật khẩu').fill('test-password')
    await page.getByRole('button', { name: 'Đăng ký', exact: true }).click()
    await expect(page.getByRole('status')).toContainText('kiểm tra email')
  })

  test('lỗi đăng nhập, reload session, đăng xuất và đổi tài khoản không lộ dữ liệu', async ({
    page,
  }) => {
    await page.goto('/#tasks')
    await page.getByLabel('Email', { exact: true }).fill('alice@example.test')
    await page.getByLabel('Mật khẩu', { exact: true }).fill('wrong-password')
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
    await expect(page.getByRole('alert')).toHaveText('Email hoặc mật khẩu chưa đúng.')
    await page.getByLabel('Mật khẩu', { exact: true }).fill('test-password')
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
    await expect(page.locator('h1')).toHaveText('Công việc')
    await page.getByRole('button', { name: 'Thêm công việc', exact: true }).first().click()
    await page.getByLabel('Tên công việc').fill('Dữ liệu riêng của Alice')
    await page.getByRole('button', { name: 'Lưu công việc' }).click()
    await synced(page)
    await page.reload()
    await expect(
      page.getByRole('button', { name: 'Dữ liệu riêng của Alice', exact: true }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click()
    await expect(page.locator('h1')).toHaveText('Đăng nhập')
    await page.getByLabel('Email', { exact: true }).fill('bob@example.test')
    await page.getByLabel('Mật khẩu', { exact: true }).fill('test-password')
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
    await synced(page)
    await expect(page.getByText('Dữ liệu riêng của Alice')).toHaveCount(0)
  })
})

test('lỗi tải có nút thử lại, không mở workspace trống để ghi đè', async ({ page, cloud }) => {
  cloud.failRead = true
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText('Không tải được dữ liệu')
  expect(cloud.writes).toBe(0)
  cloud.failRead = false
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
  await synced(page)
})

test('ghi thất bại giữ bản nháp, retry sau reload không mất nội dung', async ({ page, cloud }) => {
  await page.goto('/#notes')
  await synced(page)
  cloud.failWrite = true
  await page.getByLabel('Nội dung ghi chú').fill('Bản nháp khi mất mạng')
  await expect(page.locator('.cloud-status')).toHaveText('Chưa đồng bộ')
  expect(cloud.writes).toBe(0)
  cloud.failWrite = false
  await page.reload()
  await synced(page)
  await expect(page.getByLabel('Nội dung ghi chú')).toHaveValue('Bản nháp khi mất mạng')
  expect(cloud.writes).toBe(1)
})

test('sửa trong lúc request đang chạy vẫn lưu nội dung mới nhất', async ({ page, cloud }) => {
  await page.goto('/#notes')
  await synced(page)
  cloud.delay = 800
  await page.getByLabel('Nội dung ghi chú').fill('Nội dung ban đầu')
  await page.waitForRequest((request) => request.url().endsWith('apply_workspace_changes'))
  await page.getByLabel('Nội dung ghi chú').fill('Nội dung cuối cùng')
  await synced(page)
  await page.reload()
  await expect(page.getByLabel('Nội dung ghi chú')).toHaveValue('Nội dung cuối cùng')
})

test('mất phản hồi sau commit: retry không bỏ mất lần sửa tiếp theo', async ({ page, cloud }) => {
  await page.goto('/#notes')
  await synced(page)
  cloud.failAfterCommit = true
  await page.getByRole('button', { name: 'Tạo ghi chú', exact: true }).first().click()
  await expect(page.locator('.cloud-status')).toHaveText('Chưa đồng bộ')
  await page.getByLabel('Nội dung ghi chú').fill('Nội dung sau lần mất phản hồi')
  await synced(page)
  await page.reload()
  await expect(page.getByLabel('Nội dung ghi chú')).toHaveValue('Nội dung sau lần mất phản hồi')
  expect([...cloud.users.values()][0].notes).toHaveLength(4)
})

test('đăng nhập từ trình duyệt khác đọc dữ liệu cloud', async ({ page, browser, cloud }) => {
  await page.goto('/#settings')
  await synced(page)
  // Ngữ cảnh khác không có dữ liệu ứng dụng hoặc bản nháp local.
  const other = await browser.newContext()
  await other.addInitScript(
    ({ key, session }) => localStorage.setItem(key, JSON.stringify(session)),
    { key: authKey, session: sessionFor() },
  )
  await other.route('https://focuslab-test.supabase.co/**', (route) =>
    route.fulfill({ json: cloud.users.values().next().value }),
  )
  const tab = await other.newPage()
  await tab.goto('http://127.0.0.1:4173/#tasks')
  await expect(
    tab.getByRole('button', { name: 'Ôn chương 3 Toán cao cấp', exact: true }),
  ).toBeVisible()
  await other.close()
})

test('nhập local cũ theo lựa chọn, không nhân đôi hay xóa bản gốc', async ({ page }) => {
  await page.goto('/#settings')
  await synced(page)
  await page.evaluate(() => {
    const legacy = {
      version: 1,
      tasks: [],
      subjects: [],
      events: [],
      sessions: [],
      notes: [
        {
          id: 'old-note',
          title: 'Ghi chú từ bản cũ',
          content: 'Cần giữ',
          pinned: false,
          updatedAt: new Date().toISOString(),
        },
      ],
      settings: {
        theme: 'system',
        focus: 25,
        short: 5,
        long: 15,
        weeklyGoal: 20,
        collapsed: false,
      },
      timer: {
        mode: 'focus',
        remaining: 1500,
        total: 1500,
        endAt: null,
        subjectId: '',
        taskId: '',
        cycle: 0,
        sessionId: 'old-timer',
      },
    }
    localStorage.setItem('studyflow:data:v1', JSON.stringify(legacy))
  })
  for (let i = 0; i < 2; i++) {
    await page.getByRole('button', { name: 'Nhập dữ liệu cũ', exact: true }).click()
    await page.getByRole('button', { name: 'Nhập dữ liệu', exact: true }).click()
    await synced(page)
  }
  expect(await page.evaluate(() => localStorage.getItem('studyflow:data:v1'))).toContain('Cần giữ')
  await page.goto('/#notes')
  await expect(page.locator('.note-preview').filter({ hasText: 'Ghi chú từ bản cũ' })).toHaveCount(
    1,
  )
})
