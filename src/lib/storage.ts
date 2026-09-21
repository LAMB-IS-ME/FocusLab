import { z } from 'zod'
import type { AppData } from '../types'
import { emptyData } from '../data/demo'

// Giữ chính xác khóa phiên bản cũ để người dùng nhập dữ liệu, không ghi dữ liệu mới vào đây.
export const STORAGE_KEY = 'studyflow:data:v1'
const id = z.string().max(200)
const title = z.string().min(1).max(200)
const date = z
  .string()
  .refine(
    (v) =>
      /^\d{4}-\d{2}-\d{2}$/.test(v) &&
      !Number.isNaN(Date.parse(v + 'T12:00:00')) &&
      new Date(v + 'T12:00:00').getDate() === Number(v.slice(-2)),
  )
const timestamp = z.string().refine((v) => !Number.isNaN(Date.parse(v)))
export const dataSchema = z.object({
  version: z.literal(1),
  tasks: z.array(
    z.object({
      id,
      title,
      description: z.string().max(10000),
      subjectId: id,
      priority: z.enum(['low', 'medium', 'high']),
      dueDate: z.union([date, z.literal('')]),
      status: z.enum(['todo', 'progress', 'done']),
      completedAt: timestamp.nullable(),
    }),
  ),
  subjects: z.array(
    z.object({
      id,
      name: title,
      color: z.string().regex(/^#[a-fA-F0-9]{6}$/),
      icon: z.enum(['math', 'brain', 'code', 'network', 'language', 'book']),
    }),
  ),
  events: z.array(
    z.object({
      id,
      title,
      subjectId: id,
      date,
      startTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$|^$/),
      duration: z.number().int().min(0).max(1440),
    }),
  ),
  notes: z.array(
    z.object({
      id,
      title,
      content: z.string().max(100000),
      pinned: z.boolean(),
      updatedAt: timestamp,
    }),
  ),
  sessions: z.array(
    z.object({
      id,
      subjectId: id,
      taskId: id,
      duration: z.number().positive().max(180),
      completedAt: timestamp,
    }),
  ),
  settings: z.object({
    theme: z.enum(['light', 'dark', 'system']),
    focus: z.number().int().min(1).max(180),
    short: z.number().int().min(1).max(60),
    long: z.number().int().min(1).max(120),
    weeklyGoal: z.number().min(1).max(168),
    collapsed: z.boolean(),
  }),
  timer: z.object({
    mode: z.enum(['focus', 'short', 'long']),
    remaining: z.number().min(0).max(10800),
    total: z.number().positive().max(10800),
    endAt: z.number().positive().nullable(),
    subjectId: id,
    taskId: id,
    cycle: z.number().int().min(0),
    sessionId: id,
  }),
})

export const taskSchema = dataSchema.shape.tasks.element
export const eventSchema = dataSchema.shape.events.element

export function loadData(storage: Storage = window.localStorage): {
  data: AppData
  warning: string
} {
  let raw: string | null = null
  try {
    raw = storage.getItem(STORAGE_KEY)
    if (raw === null)
      return { data: emptyData(), warning: 'Không tìm thấy dữ liệu cũ trong trình duyệt này.' }
    return { data: dataSchema.parse(JSON.parse(raw)), warning: '' }
  } catch {
    if (raw !== null) {
      // Giữ bản gốc để người dùng có thể khôi phục khi dữ liệu bị hỏng.
      try {
        storage.setItem(`${STORAGE_KEY}:recovery:${Date.now()}`, raw)
      } catch {
        /* Bộ nhớ có thể đầy hoặc bị trình duyệt chặn. */
      }
    }
    return {
      data: emptyData(),
      warning:
        raw === null
          ? 'Trình duyệt đang chặn đọc dữ liệu cũ.'
          : 'Dữ liệu cũ không đọc được. Bản gốc vẫn được giữ nguyên; hãy chọn tệp sao lưu khác.',
    }
  }
}
