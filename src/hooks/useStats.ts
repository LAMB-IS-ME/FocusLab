import { useApp } from './useApp'
import { addDays, dateKey, weekDays } from '../utils/date'

export function useStats() {
  const { data } = useApp()
  const today = dateKey()
  const todaySessions = data.sessions.filter((s) => dateKey(s.completedAt) === today)
  const days = weekDays()
  const weekKeys = days.map((d) => dateKey(d))
  const weekSessions = data.sessions.filter((s) => weekKeys.includes(dateKey(s.completedAt)))
  const weekMinutes = weekSessions.reduce((sum, s) => sum + s.duration, 0)
  const activeDays = new Set(data.sessions.map((s) => dateKey(s.completedAt)))
  let streak = 0
  let cursor = activeDays.has(today) ? new Date() : addDays(new Date(), -1)
  while (activeDays.has(dateKey(cursor))) {
    streak++
    cursor = addDays(cursor, -1)
  }
  return {
    todaySessions,
    todayMinutes: todaySessions.reduce((sum, s) => sum + s.duration, 0),
    todayDone: data.tasks.filter((t) => t.completedAt && dateKey(t.completedAt) === today).length,
    weekMinutes,
    weekSessions,
    streak,
    goalPercent: Math.min(100, Math.round((weekMinutes / (data.settings.weeklyGoal * 60)) * 100)),
    chartData: days.map((d, i) => ({
      name: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][i],
      date: dateKey(d),
      minutes: weekSessions
        .filter((s) => dateKey(s.completedAt) === dateKey(d))
        .reduce((sum, s) => sum + s.duration, 0),
    })),
  }
}
