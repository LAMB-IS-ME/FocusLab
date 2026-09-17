export type Page = 'dashboard' | 'tasks' | 'focus' | 'calendar' | 'subjects' | 'notes' | 'settings'
export type TaskStatus = 'todo' | 'progress' | 'done'
export type Priority = 'low' | 'medium' | 'high'
export type TimerMode = 'focus' | 'short' | 'long'
export interface Task {
  id: string
  title: string
  description: string
  subjectId: string
  priority: Priority
  dueDate: string
  status: TaskStatus
  completedAt: string | null
}
export interface Subject {
  id: string
  name: string
  color: string
  icon: string
}
export interface StudyEvent {
  id: string
  title: string
  subjectId: string
  date: string
  startTime: string
  duration: number
}
export interface Note {
  id: string
  title: string
  content: string
  pinned: boolean
  updatedAt: string
}
export interface StudySession {
  id: string
  subjectId: string
  taskId: string
  duration: number
  completedAt: string
}
export interface Settings {
  theme: 'light' | 'dark' | 'system'
  focus: number
  short: number
  long: number
  weeklyGoal: number
  collapsed: boolean
}
export interface TimerState {
  mode: TimerMode
  remaining: number
  total: number
  endAt: number | null
  subjectId: string
  taskId: string
  cycle: number
  sessionId: string
}
export interface AppData {
  version: 1
  tasks: Task[]
  subjects: Subject[]
  events: StudyEvent[]
  notes: Note[]
  sessions: StudySession[]
  settings: Settings
  timer: TimerState
}
