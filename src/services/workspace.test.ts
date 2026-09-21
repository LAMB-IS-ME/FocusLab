import { describe, expect, it } from 'vitest'
import { createDemoData, emptyData } from '../data/demo'
import { diffData, mergeChanges, normalizeReferences } from './workspace'
import { importData } from './importData'

describe('Thay đổi cloud và nhập bản sao', () => {
  it('thay đổi đồng hồ không ghi database; ghi chú chỉ gửi hàng vừa sửa', () => {
    const before = createDemoData()
    const after = structuredClone(before)
    after.timer.endAt = Date.now()
    expect(diffData(before, after)).toEqual({})
    after.notes[0].content = 'Đã sửa'
    expect(diffData(before, after)).toEqual({ notes: { upsert: [after.notes[0]], delete: [] } })
  })
  it('nhập lại không nhân đôi hay đè dữ liệu hiện có', () => {
    const source = createDemoData()
    const first = importData(emptyData(), source)
    first.tasks[0].title = 'Nội dung trên cloud'
    const second = importData(first, source)
    expect(second.tasks).toHaveLength(source.tasks.length)
    expect(second.tasks[0].title).toBe('Nội dung trên cloud')
    expect(second.tasks[0].subjectId).toBe('code')
    expect(second.timer.endAt).toBeNull()
  })
  it('bản nháp khôi phục không xóa hàng mới được thêm trên thiết bị khác', () => {
    const before = createDemoData()
    const after = structuredClone(before)
    after.notes[0].content = 'Bản nháp'
    const remote = structuredClone(before)
    remote.notes.push({ ...remote.notes[0], id: 'new-on-other-device' })
    const result = mergeChanges(remote, diffData(before, after))
    expect(result.notes).toHaveLength(remote.notes.length)
    expect(result.notes.find((n) => n.id === after.notes[0].id)?.content).toBe('Bản nháp')
  })
  it('bỏ liên kết đã xóa trước khi lưu phiên tập trung', () => {
    const data = createDemoData()
    data.subjects = []
    data.tasks = []
    const result = normalizeReferences(data)
    expect(result.sessions.every((s) => s.subjectId === '' && s.taskId === '')).toBe(true)
  })
})
