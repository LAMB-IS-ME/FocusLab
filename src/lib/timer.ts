import type { AppData, TimerMode, TimerState } from '../types'
import { uid } from '../utils/date'

export function newTimer(data: AppData, mode: TimerMode): TimerState {
  return {
    ...data.timer,
    mode,
    total: data.settings[mode] * 60,
    remaining: data.settings[mode] * 60,
    endAt: null,
    sessionId: uid(),
  }
}
export function advanceTimer(data: AppData, now: number): AppData {
  const timer = data.timer
  if (!timer.endAt || timer.endAt > now) return data
  const cycle = timer.cycle + (timer.mode === 'focus' ? 1 : 0)
  const next: TimerMode = timer.mode === 'focus' ? (cycle % 4 === 0 ? 'long' : 'short') : 'focus'
  // Chỉ ghi một phiên theo mã cố định, kể cả khi nhiều nhịp đồng hồ cùng kiểm tra.
  const sessions =
    timer.mode === 'focus' && !data.sessions.some((s) => s.id === timer.sessionId)
      ? [
          ...data.sessions,
          {
            id: timer.sessionId,
            subjectId: timer.subjectId,
            taskId: timer.taskId,
            duration: timer.total / 60,
            completedAt: new Date(timer.endAt).toISOString(),
          },
        ]
      : data.sessions
  return { ...data, sessions, timer: { ...newTimer(data, next), cycle } }
}
