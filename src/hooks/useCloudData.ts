import { useCallback, useEffect, useRef, useState } from 'react'
import type { SetStateAction } from 'react'
import { emptyData } from '../data/demo'
import { dataSchema } from '../lib/storage'
import { newTimer } from '../lib/timer'
import type { AppData } from '../types'
import type { Changes } from '../services/workspaceChanges'
import {
  diffData,
  loadWorkspace,
  mergeChanges,
  normalizeReferences,
  resetWorkspace,
  saveChanges,
} from '../services/workspace'

type SyncState = 'loading' | 'saved' | 'saving' | 'error'
const saveError =
  'Chưa lưu được lên đám mây. Hãy kiểm tra mạng rồi thử lưu lại. Thay đổi đang được giữ trong thẻ này.'

export function useCloudData(userId: string, toast: (message: string) => void) {
  const [data, renderData] = useState(emptyData)
  const current = useRef(data)
  const baseline = useRef(data)
  const ready = useRef(false)
  const mounted = useRef(false)
  const inFlight = useRef<Promise<boolean> | null>(null)
  const attempted = useRef<{ target: AppData; changes: Changes } | null>(null)
  const resetting = useRef(false)
  const scheduled = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [status, setStatus] = useState<SyncState>('loading')
  const [error, setError] = useState('')
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [refreshAttempt, setRefreshAttempt] = useState(0)
  const draftKey = `focuslab:draft:${userId}`
  const timerKey = `focuslab:timer:${userId}`
  const dirty = useCallback(
    () => Object.keys(diffData(baseline.current, current.current)).length > 0,
    [],
  )

  const cache = useCallback(() => {
    try {
      // Chỉ bản nháp chưa gửi và đồng hồ của thẻ này; dữ liệu chính luôn đọc từ cloud.
      sessionStorage.setItem(timerKey, JSON.stringify(current.current.timer))
      if (dirty() || attempted.current)
        sessionStorage.setItem(
          draftKey,
          JSON.stringify({
            before: baseline.current,
            after: current.current,
            attempted: attempted.current?.target,
          }),
        )
      else sessionStorage.removeItem(draftKey)
    } catch {
      setError('Trình duyệt chặn lưu bản nháp. Hãy giữ trang mở đến khi đồng bộ xong.')
    }
  }, [dirty, draftKey, timerKey])

  const flush = useCallback(async (): Promise<boolean> => {
    clearTimeout(scheduled.current)
    if (inFlight.current) return inFlight.current
    if (!ready.current || resetting.current) return false
    const run = async () => {
      while (mounted.current && (dirty() || attempted.current)) {
        // Retry đúng payload cũ nếu server đã commit nhưng phản hồi bị mất.
        const { target, changes } = attempted.current ?? {
          target: current.current,
          changes: diffData(baseline.current, current.current),
        }
        attempted.current = { target, changes }
        cache()
        setStatus('saving')
        try {
          const remote = await saveChanges(userId, changes)
          if (!mounted.current) return false
          const edits = diffData(target, current.current)
          baseline.current = remote
          current.current = normalizeReferences({
            ...mergeChanges(remote, edits),
            timer: current.current.timer,
          })
          attempted.current = null
          renderData(current.current)
          cache()
        } catch {
          if (mounted.current) {
            setStatus('error')
            setError(saveError)
            toast(saveError)
          }
          return false
        }
      }
      if (mounted.current) {
        setStatus('saved')
        setError('')
      }
      return true
    }
    inFlight.current = run()
    try {
      return await inFlight.current
    } finally {
      inFlight.current = null
    }
  }, [cache, dirty, toast, userId])

  const setData = useCallback(
    (update: SetStateAction<AppData>) => {
      if (!ready.current || resetting.current) return
      const next = typeof update === 'function' ? update(current.current) : update
      if (next === current.current) return
      current.current = normalizeReferences(next)
      renderData(current.current)
      cache()
      if (dirty() || attempted.current) {
        setStatus('saving')
        clearTimeout(scheduled.current)
        scheduled.current = setTimeout(() => {
          void flush()
        }, 350)
      }
    },
    [cache, dirty, flush],
  )

  useEffect(() => {
    mounted.current = true
    let active = true
    ready.current = false
    setStatus('loading')
    setError('')
    void loadWorkspace()
      .then((remote) => {
        if (!active) return
        baseline.current = remote
        let next = remote
        let warning = ''
        try {
          const draft = sessionStorage.getItem(draftKey)
          if (draft) {
            const parsed = JSON.parse(draft)
            const before = dataSchema.parse(parsed.before)
            const after = dataSchema.parse(parsed.after)
            const attempt = parsed.attempted ? dataSchema.parse(parsed.attempted) : after
            next = mergeChanges(
              mergeChanges(remote, diffData(before, attempt)),
              diffData(attempt, after),
            )
          }
          const timer = sessionStorage.getItem(timerKey)
          next.timer = timer
            ? dataSchema.shape.timer.parse(JSON.parse(timer))
            : newTimer(next, 'focus')
        } catch {
          warning =
            'Bản nháp trong thẻ này không đọc được. Dữ liệu trên đám mây vẫn được giữ nguyên.'
        }
        current.current = normalizeReferences(next)
        renderData(current.current)
        ready.current = true
        setStatus(dirty() ? 'saving' : 'saved')
        setError(warning)
        if (dirty() || attempted.current) void flush()
      })
      .catch(() => {
        if (active) {
          setStatus('error')
          setError('Không tải được dữ liệu. Hãy kiểm tra mạng hoặc cấu hình database rồi thử lại.')
        }
      })
    return () => {
      active = false
      mounted.current = false
      clearTimeout(scheduled.current)
    }
  }, [userId, loadAttempt, dirty, draftKey, timerKey, flush])

  useEffect(() => {
    let active = true
    let refreshing = false
    const refresh = async () => {
      if (
        !ready.current ||
        inFlight.current ||
        attempted.current ||
        dirty() ||
        resetting.current ||
        refreshing ||
        document.hidden
      )
        return
      const start = current.current
      refreshing = true
      try {
        const remote = await loadWorkspace()
        // Không đè lên thay đổi được nhập trong lúc đang tải.
        if (active && start === current.current && !inFlight.current && !resetting.current) {
          baseline.current = remote
          current.current = normalizeReferences({ ...remote, timer: current.current.timer })
          renderData(current.current)
          setError('')
          setStatus('saved')
        }
      } catch {
        if (active)
          setError('Chưa lấy được thay đổi mới nhất. Kiểm tra kết nối hoặc tải lại dữ liệu.')
      } finally {
        refreshing = false
      }
    }
    const online = () => {
      if (dirty() || attempted.current) void flush()
      else void refresh()
    }
    const offline = () =>
      setError('Bạn đang ngoại tuyến. Thay đổi chưa đồng bộ sẽ được giữ trong thẻ này.')
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (dirty() || inFlight.current || attempted.current) {
        event.preventDefault()
        event.returnValue = ''
      }
    }
    const interval = setInterval(() => {
      void refresh()
    }, 30000)
    if (refreshAttempt > 0) void refresh()
    window.addEventListener('focus', refresh)
    window.addEventListener('online', online)
    window.addEventListener('offline', offline)
    window.addEventListener('beforeunload', beforeUnload)
    return () => {
      active = false
      clearInterval(interval)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('online', online)
      window.removeEventListener('offline', offline)
      window.removeEventListener('beforeunload', beforeUnload)
    }
  }, [dirty, flush, refreshAttempt])

  const reset = async () => {
    if (!(await flush())) return false
    resetting.current = true
    setStatus('saving')
    try {
      await resetWorkspace(userId)
      const next = emptyData()
      baseline.current = next
      current.current = next
      renderData(next)
      cache()
      setError('')
      setStatus('saved')
      toast('Đã xóa dữ liệu của tài khoản này')
      return true
    } catch {
      setStatus('error')
      setError('Chưa xóa được dữ liệu. Hãy kiểm tra mạng rồi thử lại.')
      toast('Chưa xóa được dữ liệu')
      return false
    } finally {
      resetting.current = false
    }
  }

  return {
    data,
    setData,
    status,
    error,
    loaded: ready.current,
    flush,
    reset,
    retry: () => {
      if (!ready.current) setLoadAttempt((value) => value + 1)
      else if (dirty() || attempted.current) void flush()
      else setRefreshAttempt((value) => value + 1)
    },
  }
}
