import { test as base, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createDemoData, emptyData } from '../src/data/demo'
import { mergeChanges } from '../src/services/workspaceChanges'
import type { AppData } from '../src/types'

const alice = '00000000-0000-4000-8000-000000000001'
const bob = '00000000-0000-4000-8000-000000000002'
export const apiUrl = 'https://focuslab-test.supabase.co'
export const authKey = 'sb-focuslab-test-auth-token'
export function sessionFor(id = alice, email = 'alice@example.test') {
  const user = {
    id,
    email,
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: {},
    user_metadata: {},
    created_at: new Date().toISOString(),
  }
  const token = [
    Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
    Buffer.from(JSON.stringify({ sub: id, exp: 4102444800, role: 'authenticated' })).toString(
      'base64url',
    ),
    'test-signature',
  ].join('.')
  return {
    user,
    access_token: token,
    refresh_token: 'test-refresh',
    expires_in: 3600,
    expires_at: 4102444800,
    token_type: 'bearer',
  }
}
export type Cloud = {
  users: Map<string, AppData>
  failRead: boolean
  failWrite: boolean
  failAfterCommit: boolean
  writes: number
  delay: number
}
function snapshot(data: AppData) {
  const result = structuredClone(data)
  result.notes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  return result
}
export const test = base.extend<{ authenticated: boolean; cloud: Cloud }>({
  authenticated: [true, { option: true }],
  cloud: async ({ context, authenticated }, use) => {
    const cloud: Cloud = {
      users: new Map([
        [alice, authenticated ? createDemoData() : emptyData()],
        [bob, emptyData()],
      ]),
      failRead: false,
      failWrite: false,
      failAfterCommit: false,
      writes: 0,
      delay: 0,
    }
    await context.addInitScript(
      ({ session, authKey, authenticated }) => {
        if (authenticated && !localStorage.getItem('focuslab:test:initialized')) {
          localStorage.setItem(authKey, JSON.stringify(session))
          localStorage.setItem('focuslab:test:initialized', 'true')
        }
      },
      { session: sessionFor(), authKey, authenticated },
    )
    await context.route(`${apiUrl}/**`, async (route) => {
      const request = route.request()
      const path = new URL(request.url()).pathname
      const json = (body: unknown, status = 200) =>
        route.fulfill({
          status,
          json: body,
          headers: {
            'x-supabase-api-version': '2024-01-01',
            'access-control-expose-headers': 'x-supabase-api-version',
          },
        })
      if (path.includes('/auth/v1/')) {
        if (path.endsWith('/logout')) return route.fulfill({ status: 204 })
        if (path.endsWith('/signup')) return json({ user: sessionFor().user, session: null })
        if (path.endsWith('/token')) {
          const body = request.postDataJSON()
          if (body.password === 'wrong-password')
            return json({ code: 'invalid_credentials', message: 'Invalid login credentials' }, 400)
          return json(
            body.email === 'bob@example.test' ? sessionFor(bob, body.email) : sessionFor(),
          )
        }
        return json(sessionFor().user)
      }
      const token = request.headers().authorization?.replace('Bearer ', '')
      let userId = ''
      try {
        userId = JSON.parse(Buffer.from(token!.split('.')[1], 'base64url').toString()).sub
      } catch {
        /* Không có phiên hợp lệ. */
      }
      if (!cloud.users.has(userId)) return json({ message: 'Unauthorized' }, 401)
      if (path.endsWith('/get_workspace')) {
        if (cloud.failRead) return json({ message: 'offline' }, 503)
        return json(snapshot(cloud.users.get(userId)!))
      }
      const body = request.postDataJSON()
      if (body.expected_user_id !== userId) return json({ message: 'Forbidden' }, 403)
      if (cloud.delay) await new Promise((resolve) => setTimeout(resolve, cloud.delay))
      if (cloud.failWrite) return json({ message: 'offline' }, 503)
      if (path.endsWith('/apply_workspace_changes')) {
        cloud.writes++
        cloud.users.set(userId, mergeChanges(cloud.users.get(userId)!, body.changes))
        if (cloud.failAfterCommit) {
          cloud.failAfterCommit = false
          return route.abort('failed')
        }
        return json(snapshot(cloud.users.get(userId)!))
      }
      if (path.endsWith('/reset_workspace')) {
        cloud.users.set(userId, emptyData())
        return route.fulfill({ status: 204 })
      }
      return json({ message: 'Unknown endpoint' }, 404)
    })
    await use(cloud)
  },
  page: async ({ page, cloud }, use) => {
    void cloud
    await use(page)
  },
})

export async function synced(page: Page) {
  await expect(page.locator('.cloud-status')).toHaveText('Đã đồng bộ')
}

export async function stored(page: Page): Promise<AppData> {
  await synced(page)
  return page.evaluate(
    async ({ apiUrl, authKey }) => {
      const session = JSON.parse(localStorage.getItem(authKey)!)
      const response = await fetch(`${apiUrl}/rest/v1/rpc/get_workspace`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await response.json()
      const timer = sessionStorage.getItem(`focuslab:timer:${session.user.id}`)
      return { ...data, timer: timer ? JSON.parse(timer) : data.timer }
    },
    { apiUrl, authKey },
  )
}
export { expect }
