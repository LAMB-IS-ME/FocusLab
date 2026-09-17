import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react'
import { useApp } from '../hooks/useApp'
import { Button, ConfirmDialog, IconButton } from './ui'
import type { TimerMode } from '../types'

export const modeLabels: Record<TimerMode, string> = {
  focus: 'Tập trung',
  short: 'Nghỉ ngắn',
  long: 'Nghỉ dài',
}
export function useTimerRemaining() {
  const { data } = useApp()
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(interval)
  }, [])
  return data.timer.endAt
    ? Math.max(0, Math.ceil((data.timer.endAt - now) / 1000))
    : data.timer.remaining
}
export function timerText(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}
export function FocusTimer() {
  const { data, timerAction, changeMode } = useApp()
  const remaining = useTimerRemaining()
  const { timer } = data
  const [pending, setPending] = useState<null | 'reset' | 'skip' | TimerMode>(null)
  const started = timer.endAt !== null || timer.remaining < timer.total
  const action = (next: 'reset' | 'skip' | TimerMode) => {
    if (started) setPending(next)
    else if (next === 'reset' || next === 'skip') timerAction(next)
    else changeMode(next)
  }
  return (
    <>
      <div className="timer-tabs tabs">
        {(Object.keys(modeLabels) as TimerMode[]).map((mode) => (
          <button
            key={mode}
            aria-pressed={timer.mode === mode}
            className={timer.mode === mode ? 'active' : ''}
            onClick={() => {
              if (mode !== timer.mode) action(mode)
            }}
          >
            {modeLabels[mode]}
          </button>
        ))}
      </div>
      <div className="timer-ring">
        <svg viewBox="0 0 300 300" aria-hidden="true">
          <circle className="timer-track" cx="150" cy="150" r="137" />
          <motion.circle
            className="timer-progress"
            cx="150"
            cy="150"
            r="137"
            fill="none"
            strokeDasharray={861}
            animate={{ strokeDashoffset: 861 * (1 - remaining / timer.total) }}
            transition={{ duration: 0.3 }}
          />
        </svg>
        <div className="timer-display">
          <span className="eyebrow">
            {timer.mode === 'focus' ? 'CHỈ MỘT VIỆC LÚC NÀY' : 'THẢ LỎNG MỘT CHÚT NHÉ'}
          </span>
          <span
            className="timer-number"
            role="timer"
            aria-label={`Còn ${Math.floor(remaining / 60)} phút ${remaining % 60} giây`}
          >
            {timerText(remaining)}
          </span>
          <span className="muted">
            {timer.endAt
              ? 'Bạn đang dành thời gian cho mình'
              : started
                ? 'Nghỉ một chút, rồi tiếp tục nhé'
                : 'Sẵn sàng khi bạn sẵn sàng'}
          </span>
        </div>
      </div>
      <div className="timer-controls">
        <IconButton label="Đặt lại đồng hồ" onClick={() => action('reset')}>
          <RotateCcw size={20} />
        </IconButton>
        <Button
          className="timer-start"
          onClick={() => timerAction(timer.endAt ? 'pause' : 'start')}
        >
          {timer.endAt ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
          {timer.endAt ? 'Tạm dừng' : started ? 'Tiếp tục' : 'Bắt đầu'}
        </Button>
        <IconButton label="Bỏ qua phiên" onClick={() => action('skip')}>
          <SkipForward size={20} />
        </IconButton>
      </div>
      <div className="cycle-dots" aria-label={`${timer.cycle % 4} trên 4 phiên trước lần nghỉ dài`}>
        {Array.from({ length: 4 }, (_, i) => (
          <span key={i} className={i < timer.cycle % 4 ? 'done' : ''} />
        ))}
        <small>Nghỉ dài sau mỗi 4 phiên</small>
      </div>
      {pending && (
        <ConfirmDialog
          title="Kết thúc phiên hiện tại?"
          message="Thời gian của phiên chưa hoàn thành sẽ không được ghi vào thống kê."
          label="Tiếp tục thao tác"
          onClose={() => setPending(null)}
          onConfirm={() => {
            if (pending === 'reset' || pending === 'skip') timerAction(pending)
            else changeMode(pending)
          }}
        />
      )}
    </>
  )
}
