import type { AppData, Settings } from '../types'
import { addDays, dateKey, uid } from '../utils/date'

export const defaultSettings: Settings = {
  theme: 'system',
  focus: 25,
  short: 5,
  long: 15,
  weeklyGoal: 20,
  collapsed: false,
}
export function emptyData(settings = defaultSettings): AppData {
  return {
    version: 1,
    tasks: [],
    subjects: [],
    events: [],
    notes: [],
    sessions: [],
    settings: { ...settings },
    timer: {
      mode: 'focus',
      remaining: settings.focus * 60,
      total: settings.focus * 60,
      endAt: null,
      subjectId: '',
      taskId: '',
      cycle: 0,
      sessionId: uid(),
    },
  }
}
export function createDemoData(now = new Date()): AppData {
  const data = emptyData()
  const date = (offset: number) => dateKey(addDays(now, offset))
  data.subjects = [
    { id: 'math', name: 'Toán cao cấp', color: '#c88c42', icon: 'math' },
    { id: 'ai', name: 'Trí tuệ nhân tạo', color: '#8871bd', icon: 'brain' },
    { id: 'code', name: 'Cấu trúc dữ liệu và giải thuật', color: '#5582bc', icon: 'code' },
    { id: 'network', name: 'Mạng máy tính', color: '#c77367', icon: 'network' },
    { id: 'english', name: 'Tiếng Anh', color: '#4e9987', icon: 'language' },
  ]
  data.tasks = [
    {
      id: 't1',
      title: 'Hoàn thành bài tập cấu trúc dữ liệu',
      description: 'Cài đặt cây nhị phân tìm kiếm và phân tích độ phức tạp.',
      subjectId: 'code',
      priority: 'high',
      dueDate: date(0),
      status: 'progress',
      completedAt: null,
    },
    {
      id: 't2',
      title: 'Ôn chương 3 Toán cao cấp',
      description: 'Ôn tập tích phân và làm các bài tập cuối chương.',
      subjectId: 'math',
      priority: 'medium',
      dueDate: date(0),
      status: 'todo',
      completedAt: null,
    },
    {
      id: 't3',
      title: 'Luyện TOEIC Reading',
      description: 'Hoàn thành một đề Part 7 và ghi lại từ mới.',
      subjectId: 'english',
      priority: 'low',
      dueDate: date(0),
      status: 'done',
      completedAt: now.toISOString(),
    },
    {
      id: 't4',
      title: 'Đọc tài liệu Transformer',
      description: 'Tóm tắt cơ chế attention bằng ngôn ngữ của mình.',
      subjectId: 'ai',
      priority: 'high',
      dueDate: date(1),
      status: 'todo',
      completedAt: null,
    },
    {
      id: 't5',
      title: 'Chuẩn bị bài lab Mạng máy tính',
      description: 'Đọc hướng dẫn cấu hình mạng và chuẩn bị mô hình.',
      subjectId: 'network',
      priority: 'medium',
      dueDate: date(2),
      status: 'todo',
      completedAt: null,
    },
    {
      id: 't6',
      title: 'Tổng hợp công thức đạo hàm',
      description: '',
      subjectId: 'math',
      priority: 'low',
      dueDate: date(-1),
      status: 'done',
      completedAt: addDays(now, -1).toISOString(),
    },
  ]
  data.events = [
    {
      id: 'e1',
      title: 'Học nhóm: Cấu trúc dữ liệu',
      subjectId: 'code',
      date: date(0),
      startTime: '19:00',
      duration: 90,
    },
    {
      id: 'e2',
      title: 'Ôn tập Trí tuệ nhân tạo',
      subjectId: 'ai',
      date: date(1),
      startTime: '09:00',
      duration: 60,
    },
    {
      id: 'e3',
      title: 'Thực hành Mạng máy tính',
      subjectId: 'network',
      date: date(2),
      startTime: '14:00',
      duration: 120,
    },
  ]
  data.notes = [
    {
      id: 'n1',
      title: 'Một chút tiến bộ mỗi ngày 🌱',
      content:
        'Không cần làm mọi thứ trong một ngày. Chỉ cần tốt hơn hôm qua một chút.\n\nMục tiêu tuần này:\n• Hiểu rõ cây nhị phân tìm kiếm\n• Dành 25 phút mỗi ngày cho tiếng Anh\n• Giữ thời gian nghỉ giữa các phiên học',
      pinned: true,
      updatedAt: now.toISOString(),
    },
    {
      id: 'n2',
      title: 'Ghi chú về thuật toán',
      content:
        'Tìm kiếm nhị phân\n\nĐiều kiện: mảng đã sắp xếp.\nĐộ phức tạp: O(log n).\n\nLuôn kiểm tra trường hợp mảng rỗng và mảng chỉ có một phần tử.',
      pinned: false,
      updatedAt: now.toISOString(),
    },
    {
      id: 'n3',
      title: 'Ý tưởng cho bài tập lớn',
      content:
        'Xây dựng công cụ gợi ý tài liệu học tập.\n\nBắt đầu từ một bộ dữ liệu nhỏ, tập trung vào trải nghiệm tìm kiếm và chất lượng kết quả.',
      pinned: false,
      updatedAt: addDays(now, -1).toISOString(),
    },
  ]
  for (let day = -6; day <= 0; day++) {
    const count = day === 0 ? 3 : [4, 6, 3, 5, 7, 4][day + 6]
    for (let i = 0; i < count; i++) {
      const end = addDays(now, day)
      if (day < 0) end.setHours(9 + i, 25, 0, 0)
      else end.setTime(now.getTime() - (count - i) * 30 * 60000)
      data.sessions.push({
        id: `demo-${day}-${i}`,
        subjectId: data.subjects[(i - day) % 5].id,
        taskId: '',
        duration: 25,
        completedAt: end.toISOString(),
      })
    }
  }
  return data
}
