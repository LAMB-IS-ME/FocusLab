import type { AppData } from '../types'
import { collections, normalizeReferences } from './workspace'

// Mã định danh ổn định giúp nhập lại không nhân đôi và không đè hàng đã có.
export function importData(
  current: AppData,
  source: AppData,
  settings = false,
  prefix = '',
): AppData {
  const id = (value: string) => (value ? prefix + value : '')
  const valid = normalizeReferences(source)
  const incoming = {
    subjects: valid.subjects.map((s) => ({ ...s, id: id(s.id) })),
    tasks: valid.tasks.map((t) => ({ ...t, id: id(t.id), subjectId: id(t.subjectId) })),
    notes: valid.notes.map((n) => ({ ...n, id: id(n.id) })),
    events: valid.events.map((e) => ({ ...e, id: id(e.id), subjectId: id(e.subjectId) })),
    sessions: valid.sessions.map((s) => ({
      ...s,
      id: id(s.id),
      subjectId: id(s.subjectId),
      taskId: id(s.taskId),
    })),
  }
  const next = { ...current, settings: settings ? { ...source.settings } : current.settings }
  for (const key of collections) {
    const existing = new Set(current[key].map((row) => row.id))
    Object.assign(next, {
      [key]: [...current[key], ...incoming[key].filter((row) => !existing.has(row.id))],
    })
  }
  return next
}
