import type { AppData } from '../types'

export const collections = ['subjects', 'tasks', 'notes', 'events', 'sessions'] as const
export type Collection = (typeof collections)[number]
export type Changes = {
  [K in Collection]?: { insert?: AppData[K]; upsert: AppData[K]; delete: string[] }
} & { settings?: AppData['settings'] }

export function diffData(before: AppData, after: AppData): Changes {
  const changes: Changes = {}
  for (const key of collections) {
    const previous = new Map<string, { id: string }>(before[key].map((row) => [row.id, row]))
    const ids = new Set(after[key].map((row) => row.id))
    const insert = after[key].filter((row) => !previous.has(row.id))
    const upsert = after[key].filter(
      (row) => previous.has(row.id) && JSON.stringify(previous.get(row.id)) !== JSON.stringify(row),
    )
    const deleted = before[key].filter((row) => !ids.has(row.id)).map((row) => row.id)
    if (insert.length || upsert.length || deleted.length)
      Object.assign(changes, {
        [key]: { ...(insert.length ? { insert } : {}), upsert, delete: deleted },
      })
  }
  if (JSON.stringify(before.settings) !== JSON.stringify(after.settings))
    changes.settings = after.settings
  return changes
}

export function mergeChanges(data: AppData, changes: Changes): AppData {
  const next = { ...data, settings: changes.settings ?? data.settings }
  for (const key of collections) {
    const change = changes[key]
    if (!change) continue
    const removed = new Set(change.delete)
    const existing = new Set(data[key].map((row) => row.id))
    const replacements = new Map<string, { id: string }>(change.upsert.map((row) => [row.id, row]))
    Object.assign(next, {
      [key]: [
        ...data[key]
          .filter((row) => !removed.has(row.id))
          .map((row) => replacements.get(row.id) ?? row),
        ...change.upsert.filter((row) => !existing.has(row.id) && !removed.has(row.id)),
        ...(change.insert ?? []).filter((row) => !existing.has(row.id) && !removed.has(row.id)),
      ],
    })
  }
  return normalizeReferences(next)
}

export function normalizeReferences(data: AppData): AppData {
  const subjects = new Set(data.subjects.map((s) => s.id))
  const tasks = new Set(data.tasks.map((t) => t.id))
  const subjectId = (id: string) => (subjects.has(id) ? id : '')
  return {
    ...data,
    tasks: data.tasks.map((t) => ({ ...t, subjectId: subjectId(t.subjectId) })),
    events: data.events.map((e) => ({ ...e, subjectId: subjectId(e.subjectId) })),
    sessions: data.sessions.map((s) => ({
      ...s,
      subjectId: subjectId(s.subjectId),
      taskId: tasks.has(s.taskId) ? s.taskId : '',
    })),
    timer: {
      ...data.timer,
      subjectId: subjectId(data.timer.subjectId),
      taskId: tasks.has(data.timer.taskId) ? data.timer.taskId : '',
    },
  }
}
