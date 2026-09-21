import { useState } from 'react'
import { Leaf } from 'lucide-react'
import { Button } from '../components/ui'
import { authError, signIn, signUp } from '../services/auth'

export default function Auth({ initialError = '' }: { initialError?: string }) {
  const [register, setRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(initialError)
  const [message, setMessage] = useState('')
  return (
    <main className="auth-screen">
      <section className="panel auth-card">
        <p className="auth-brand">
          <Leaf size={28} /> FocusLab<span className="brand-dot">.</span>
        </p>
        <h1>{register ? 'Đăng ký' : 'Đăng nhập'}</h1>
        <p className="muted">Không gian học tập của bạn, trên mọi thiết bị.</p>
        <form
          onSubmit={async (event) => {
            event.preventDefault()
            if (busy) return
            setError('')
            setMessage('')
            if (register && password !== confirmation) {
              setError('Mật khẩu xác nhận chưa khớp.')
              return
            }
            setBusy(true)
            try {
              if (register) {
                const session = await signUp(email.trim(), password)
                if (!session) {
                  setMessage('Hãy kiểm tra email để xác nhận tài khoản, sau đó đăng nhập.')
                  setPassword('')
                  setConfirmation('')
                }
              } else await signIn(email.trim(), password)
            } catch (failure) {
              setError(authError(failure))
            } finally {
              setBusy(false)
            }
          }}
        >
          <label className="field">
            Email
            <input
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="field">
            Mật khẩu
            <input
              type="password"
              autoComplete={register ? 'new-password' : 'current-password'}
              required
              minLength={register ? 8 : undefined}
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {register && (
            <>
              <p className="muted text-sm">Dùng ít nhất 8 ký tự.</p>
              <label className="field">
                Xác nhận mật khẩu
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                />
              </label>
            </>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {message && <p role="status">{message}</p>}
          <Button type="submit" disabled={busy}>
            {busy ? 'Đang xử lý…' : register ? 'Đăng ký' : 'Đăng nhập'}
          </Button>
        </form>
        <Button
          variant="ghost"
          disabled={busy}
          onClick={() => {
            setRegister(!register)
            setError('')
            setMessage('')
            setPassword('')
            setConfirmation('')
          }}
        >
          {register ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}
        </Button>
      </section>
    </main>
  )
}
