import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type { AppData, Page, Task, TimerMode } from '../types'
import { loadData, saveData, STORAGE_KEY, dataSchema, clearRecoveryData } from '../lib/storage'
import { advanceTimer, newTimer } from '../lib/timer'
import { emptyData } from '../data/demo'
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
  reset: () => void
}
const AppContext = createContext<AppContextValue | null>(null)
const pages: Page[] = ['dashboard', 'tasks', 'focus', 'calendar', 'subjects', 'notes', 'settings']
function getPage(): Page {
  const hash = location.hash.slice(1) as Page
  return pages.includes(hash) ? hash : 'dashboard'
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(() => {
    try {
      return loadData()
    } catch {
      return {
        data: emptyData(),
        warning: 'Trình duyệt đang chặn lưu trữ. Dữ liệu chỉ được giữ trong lần mở này.',
      }
    }
  })
  const [data, setData] = useState(initial.data)
  const incomingData = useRef<AppData | null>(null)
  const [storageWarning, setStorageWarning] = useState(initial.warning)
  const [page, setPage] = useState<Page>(getPage)
  const [toasts, setToasts] = useState<Toast[]>([])
  const toast = useCallback(
    (text: string) => setToasts((current) => [...current.slice(-3), { id: uid(), text }]),
    [],
  )
  const dismissToast = useCallback(
    (id: string) => setToasts((current) => current.filter((t) => t.id !== id)),
    [],
  )
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
    // Không ghi ngược dữ liệu vừa nhận, tránh hai thẻ trình duyệt phát lặp sự kiện.
    if (incomingData.current === data) {
      incomingData.current = null
      return
    }
    if (!saveData(data))
      setStorageWarning(
        'Không thể lưu dữ liệu. Bộ nhớ có thể đã đầy hoặc bị chặn; hãy xuất bản sao trong Cài đặt.',
      )
  }, [data])
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return
      try {
        const parsed = dataSchema.parse(JSON.parse(event.newValue))
        incomingData.current = parsed
        setData((current) => (JSON.stringify(current) === event.newValue ? current : parsed))
      } catch {
        setStorageWarning('Dữ liệu từ thẻ khác không hợp lệ, nên chưa được khôi phục.')
      }
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
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
  }, [])
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
    toast('Đã lưu công việc')
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
  const reset = () => {
    if (clearRecoveryData()) setStorageWarning('')
    setData(emptyData())
    toast('Đã xóa dữ liệu và tạo không gian học tập trống')
  }
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
