import { Component, lazy, Suspense, useEffect, useState } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { AnimatePresence, MotionConfig } from 'framer-motion'
import { AppProvider, useApp } from './hooks/useApp'
import { Layout } from './components/Layout'
import { Toasts } from './components/ui'
import { CommandPalette } from './components/CommandPalette'
import { TaskEditor } from './components/TaskEditor'
import Dashboard from './pages/Dashboard'
import Auth from './pages/Auth'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { configurationError } from './lib/supabase'

const Tasks = lazy(() => import('./pages/Tasks'))
const Focus = lazy(() => import('./pages/Focus'))
const Calendar = lazy(() => import('./pages/Calendar'))
const Subjects = lazy(() => import('./pages/Subjects'))
const Notes = lazy(() => import('./pages/Notes'))
const Settings = lazy(() => import('./pages/Settings'))
const pages = {
  dashboard: Dashboard,
  tasks: Tasks,
  focus: Focus,
  calendar: Calendar,
  subjects: Subjects,
  notes: Notes,
  settings: Settings,
}
function Workspace() {
  const { page } = useApp()
  const [commandOpen, setCommandOpen] = useState(false)
  const [newTask, setNewTask] = useState(false)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandOpen((value) => !value)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
  const Page = pages[page]
  return (
    <>
      <Layout onCommand={() => setCommandOpen(true)}>
        <Suspense
          fallback={
            <div className="page-skeleton" role="status" aria-label="Đang tải nội dung">
              <div />
              <div />
              <div />
            </div>
          }
        >
          <Page />
        </Suspense>
      </Layout>
      <Toasts />
      <AnimatePresence>
        {commandOpen && (
          <CommandPalette
            key="command"
            onClose={() => setCommandOpen(false)}
            onNewTask={() => setNewTask(true)}
          />
        )}
        {newTask && <TaskEditor key="new-task" onClose={() => setNewTask(false)} />}
      </AnimatePresence>
    </>
  )
}
class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(_error: Error, _info: ErrorInfo) {
    /* Dữ liệu đã lưu được giữ nguyên khi giao diện gặp lỗi. */
  }
  render() {
    return this.state.failed ? (
      <div className="fatal-error">
        <h1>Không gian học tập chưa tải được</h1>
        <p>Hãy tải lại trang. Dữ liệu đã lưu của bạn vẫn được giữ nguyên.</p>
        <button className="button primary" onClick={() => location.reload()}>
          Tải lại trang
        </button>
      </div>
    ) : (
      this.props.children
    )
  }
}
function AuthenticatedApp() {
  const { session, loading, error } = useAuth()
  if (configurationError)
    return (
      <main className="auth-screen">
        <section className="panel auth-card">
          <h1>FocusLab</h1>
          <p role="alert">{configurationError}</p>
        </section>
      </main>
    )
  if (loading)
    return (
      <main className="auth-screen">
        <p role="status">Đang khôi phục phiên đăng nhập…</p>
      </main>
    )
  if (!session) return <Auth initialError={error} />
  return (
    <AppProvider key={session.user.id}>
      <Workspace />
    </AppProvider>
  )
}
export default function App() {
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          <AuthenticatedApp />
        </AuthProvider>
      </MotionConfig>
    </ErrorBoundary>
  )
}
