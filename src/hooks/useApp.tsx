import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type { AppData, Page, Task, TimerMode } from '../types'
import { useCloudData } from './useCloudData'
import { useAuth } from './useAuth'
import { signOut } from '../services/auth'
import { advanceTimer, newTimer } from '../lib/timer'
import { uid } from '../utils/date'

type Toast = { id: string; text: string }
interface AppContextValue {
  data: AppData
  setData: Dispatch<SetStateAction<AppData>>
  page: Page
  navigate: (page: Page) => void
  toast: (text: string) => void
  toasts: Toast[]
  dismissToast: (id: string) => void
  storageWarning: string
  saveTask: (task: Task) => void
  toggleTask: (task: Task) => void
  timerAction: (action: 'start' | 'pause' | 'reset' | 'skip') => void
  changeMode: (mode: TimerMode) => void
  reset: () => Promise<boolean>
  syncStatus: string
  retrySync: () => void
  logout: () => Promise<void>
}
const AppContext = createContext<AppContextValue | null>(null)
const pages: Page[] = ['dashboard', 'tasks', 'focus', 'calendar', 'subjects', 'notes', 'settings']
function getPage(): Page {
  const hash = location.hash.slice(1) as Page
  return pages.includes(hash) ? hash : 'dashboard'
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<Page>(getPage)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [authActionError, setAuthActionError] = useState('')
  const toast = useCallback(
    (text: string) => setToasts((current) => [...current.slice(-3), { id: uid(), text }]),
    [],
  )
  const dismissToast = useCallback(
    (id: string) => setToasts((current) => current.filter((t) => t.id !== id)),
    [],
  )
  const { session } = useAuth()
  const cloud = useCloudData(session!.user.id, toast)
  const { data, setData, reset } = cloud
  const storageWarning = cloud.error
  const logout = async () => {
    if (!(await cloud.flush())) return
    try {
      await signOut()
    } catch {
      toast('Chưa đăng xuất được. Hãy kiểm tra mạng và thử lại.')
    }
  }
  const navigate = useCallback((next: Page) => {
    location.hash = next
    setPage(next)
    window.scrollTo({ top: 0 })
  }, [])
  useEffect(() => {
    const change = () => setPage(getPage())
    window.addEventListener('hashchange', change)
    return () => window.removeEventListener('hashchange', change)
  }, [])
  useEffect(() => {
    const check = () => setData((current) => advanceTimer(current, Date.now()))
    check()
    const interval = window.setInterval(check, 500)
    document.addEventListener('visibilitychange', check)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', check)
    }
  }, [setData])
  const previousTimer = useRef(data.timer)
  useEffect(() => {
    const prev = previousTimer.current
    if (prev.endAt && prev.endAt <= Date.now() && prev.sessionId !== data.timer.sessionId)
      toast(
        prev.mode === 'focus'
          ? 'Một phiên tập trung đã hoàn thành. Bạn làm tốt lắm! Đến giờ nghỉ rồi.'
          : 'Đã hết giờ nghỉ. Sẵn sàng cho phiên học tiếp theo!',
      )
    previousTimer.current = data.timer
  }, [data.timer, toast])
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () =>
      (document.documentElement.dataset.theme =
        data.settings.theme === 'system' ? (query.matches ? 'dark' : 'light') : data.settings.theme)
    apply()
    query.addEventListener('change', apply)
    return () => query.removeEventListener('change', apply)
  }, [data.settings.theme])
  const saveTask = (task: Task) => {
    setData((current) => ({
      ...current,
      tasks: current.tasks.some((t) => t.id === task.id)
        ? current.tasks.map((t) => (t.id === task.id ? task : t))
        : [...current.tasks, task],
    }))
    toast('Đã cập nhật công việc')
  }
  const toggleTask = (task: Task) => {
    const completed = task.status !== 'done'
    setData((current) => ({
      ...current,
      tasks: current.tasks.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: completed ? 'done' : 'todo',
              completedAt: completed ? new Date().toISOString() : null,
            }
          : t,
      ),
    }))
    toast(completed ? 'Thêm một việc đã hoàn thành. Tiếp tục nhé! ✨' : 'Đã mở lại công việc')
  }
  const timerAction = (action: 'start' | 'pause' | 'reset' | 'skip') =>
    setData((current) => {
      const completed = advanceTimer(current, Date.now())
      if (completed !== current) return completed
      const timer = current.timer
      if (action === 'start' && timer.endAt) return current
      if (action === 'start')
        return { ...current, timer: { ...timer, endAt: Date.now() + timer.remaining * 1000 } }
      if (action === 'pause')
        return {
          ...current,
          timer: {
            ...timer,
            remaining: Math.max(0, Math.ceil(((timer.endAt ?? Date.now()) - Date.now()) / 1000)),
            endAt: null,
          },
        }
      const mode = action === 'skip' ? (timer.mode === 'focus' ? 'short' : 'focus') : timer.mode
      return { ...current, timer: newTimer(current, mode) }
    })
  const changeMode = (mode: TimerMode) =>
    setData((current) => ({ ...current, timer: newTimer(current, mode) }))
  if (!cloud.loaded)
    return (
      <main className="auth-screen">
        <section className="panel auth-card">
          <h1>FocusLab</h1>
          <p role={cloud.status === 'loading' ? 'status' : 'alert'}>
            {cloud.status === 'loading' ? 'Đang tải không gian học tập…' : cloud.error}
          </p>
          {authActionError && <p role="alert">{authActionError}</p>}
          {cloud.status !== 'loading' && (
            <button className="button primary" onClick={cloud.retry}>
              Thử lại
            </button>
          )}
          <button
            className="button secondary"
            onClick={() => {
              void signOut().catch(() =>
                setAuthActionError('Chưa đăng xuất được. Hãy kiểm tra mạng và thử lại.'),
              )
            }}
          >
            Đăng xuất
          </button>
        </section>
      </main>
    )
  return (
    <AppContext.Provider
      value={{
        data,
        setData,
        page,
        navigate,
        toast,
        toasts,
        dismissToast,
        storageWarning,
        saveTask,
        toggleTask,
        timerAction,
        changeMode,
        reset,
        syncStatus: cloud.status,
        retrySync: cloud.retry,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('Không tìm thấy trạng thái ứng dụng')
  return context
}
