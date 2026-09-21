import { describe, expect, it } from 'vitest'
import { createDemoData, emptyData } from '../data/demo'
import { dataSchema, loadData, STORAGE_KEY } from './storage'
import { advanceTimer, newTimer } from './timer'
import { dateKey, weekDays } from '../utils/date'

function memoryStorage(value: string | null = null): Storage {
  const items = new Map<string, string>(value === null ? [] : [[STORAGE_KEY, value]])
  return {
    get length() {
      return items.size
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => {
      items.set(key, value)
    },
    removeItem: (key) => {
      items.delete(key)
    },
    key: (index) => [...items.keys()][index] ?? null,
  }
}
describe('Khôi phục dữ liệu', () => {
  it('dữ liệu mẫu hợp lệ nhưng không tự tạo khi chưa có dữ liệu', () => {
    expect(dataSchema.safeParse(createDemoData()).success).toBe(true)
    expect(loadData(memoryStorage()).data.tasks).toHaveLength(0)
    const saved = emptyData()
    expect(loadData(memoryStorage(JSON.stringify(saved))).data).toEqual(saved)
  })
  it('giữ bản sao JSON hỏng và mở không gian trống', () => {
    const storage = memoryStorage('{broken')
    const result = loadData(storage)
    expect(result.warning).not.toBe('')
    expect(result.data.tasks).toHaveLength(0)
    expect(storage.length).toBe(2)
    expect(storage.getItem(storage.key(1)!)).toBe('{broken')
  })
  it('từ chối cấu trúc sai, ngày không tồn tại và giá trị ngoài giới hạn', () => {
    const data = createDemoData()
    expect(dataSchema.safeParse({ ...data, tasks: null }).success).toBe(false)
    expect(
      dataSchema.safeParse({ ...data, settings: { ...data.settings, focus: 0 } }).success,
    ).toBe(false)
    data.tasks[0].dueDate = '2026-02-31'
    expect(dataSchema.safeParse(data).success).toBe(false)
  })
  it('xử lý trình duyệt chặn localStorage', () => {
    const storage = memoryStorage()
    storage.getItem = () => {
      throw new Error('Bị chặn')
    }
    expect(loadData(storage).warning).toContain('chặn')
  })
})
describe('Đồng hồ tập trung', () => {
  it('ghi đúng một phiên khi hết giờ kể cả khi kiểm tra nhiều lần', () => {
    const data = emptyData()
    data.timer.endAt = 100000
    expect(advanceTimer(data, 99999)).toBe(data)
    const finished = advanceTimer(data, 100000)
    expect(finished.sessions).toHaveLength(1)
    expect(finished.sessions[0].duration).toBe(25)
    expect(finished.sessions[0].completedAt).toBe(new Date(100000).toISOString())
    expect(finished.timer.mode).toBe('short')
    expect(finished.timer.endAt).toBeNull()
    expect(advanceTimer(finished, 200000).sessions).toHaveLength(1)
  })
  it('khôi phục phiên hết giờ trong lúc đóng trang, không tự tạo phiên tiếp theo', () => {
    const data = emptyData()
    data.timer.endAt = 100000
    data.timer.cycle = 3
    const finished = advanceTimer(data, 100000000)
    expect(finished.timer.mode).toBe('long')
    expect(finished.timer.remaining).toBe(900)
    expect(finished.sessions).toHaveLength(1)
  })
  it('nghỉ không tăng thời gian học; đặt lại không ghi lịch sử', () => {
    const data = emptyData()
    data.timer = { ...newTimer(data, 'short'), endAt: 100000 }
    const finished = advanceTimer(data, 100000)
    expect(finished.sessions).toHaveLength(0)
    expect(finished.timer.mode).toBe('focus')
    expect(finished.timer.cycle).toBe(0)
    expect(newTimer(data, 'focus').endAt).toBeNull()
  })
})
describe('Ngày theo giờ địa phương', () => {
  it('tuần bắt đầu thứ Hai, xử lý chuyển tháng và năm', () => {
    const week = weekDays(new Date(2027, 0, 3))
    expect(dateKey(week[0])).toBe('2026-12-28')
    expect(dateKey(week[6])).toBe('2027-01-03')
  })
})
