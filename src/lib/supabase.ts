import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

function isPublicKey(value: string) {
  if (value.startsWith('sb_publishable_')) return true
  try {
    const payload = JSON.parse(atob(value.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.role === 'anon'
  } catch {
    return false
  }
}

export const configurationError =
  !url || !key
    ? 'FocusLab chưa được cấu hình kết nối. Hãy thiết lập VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY rồi build lại ứng dụng.'
    : !/^https?:\/\/[^\s/]+\/?$/.test(url) || !isPublicKey(key)
      ? 'Cấu hình Supabase chưa hợp lệ. Chỉ dùng Project URL và khóa anon hoặc publishable công khai.'
      : ''

export const supabase = configurationError
  ? null
  : createClient<Database>(url!, key!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      global: {
        fetch: (input, init) =>
          fetch(input, {
            ...init,
            signal: init?.signal
              ? AbortSignal.any([init.signal, AbortSignal.timeout(20000)])
              : AbortSignal.timeout(20000),
          }),
      },
    })

export function getSupabase() {
  if (!supabase) throw new Error(configurationError)
  return supabase
}
