export function dateKey(value: Date | string = new Date()) {
  const d = typeof value === 'string' ? new Date(value) : value
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export function addDays(date: Date, count: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + count)
  return d
}
export function weekDays(now = new Date()) {
  const monday = addDays(now, -((now.getDay() + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}
export function formatDate(value: string, short = false) {
  if (!value) return 'Chưa đặt hạn'
  if (value === dateKey()) return 'Hôm nay'
  if (value === dateKey(addDays(new Date(), 1))) return 'Ngày mai'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    ...(!short ? { year: 'numeric' as const } : {}),
  }).format(new Date(`${value}T12:00:00`))
}
export function formatMinutes(minutes: number) {
  const m = Math.round(minutes)
  return m >= 60 ? `${Math.floor(m / 60)} giờ${m % 60 ? ` ${m % 60} phút` : ''}` : `${m} phút`
}
export function decimal(value: number) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value)
}
export function uid() {
  return crypto.randomUUID()
}
