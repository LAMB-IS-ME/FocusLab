import { getSupabase } from '../lib/supabase'

export function authError(error: unknown): string {
  const code = (error as { code?: string })?.code
  if (code === 'invalid_credentials') return 'Email hoặc mật khẩu chưa đúng.'
  if (code === 'email_not_confirmed') return 'Hãy xác nhận email trước khi đăng nhập.'
  if (code === 'user_already_exists') return 'Email đã được đăng ký. Hãy đăng nhập.'
  if (code === 'weak_password')
    return 'Mật khẩu chưa đủ mạnh. Hãy chọn mật khẩu dài và khó đoán hơn.'
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit')
    return 'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.'
  return 'Không thể kết nối hoặc hoàn tất yêu cầu. Hãy kiểm tra mạng và thử lại.'
}

export async function signIn(email: string, password: string) {
  const { error } = await getSupabase().auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signUp(email: string, password: string) {
  // Không đưa hash điều hướng vào URL nhận liên kết xác nhận email.
  const { data, error } = await getSupabase().auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${location.origin}${location.pathname}` },
  })
  if (error) throw error
  return data.session
}

export async function signOut() {
  const { error } = await getSupabase().auth.signOut({ scope: 'local' })
  if (error) throw error
}
