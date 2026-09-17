import type { CSSProperties } from 'react'
import { BookOpen, Brain, Code2, Languages, Network, Sigma } from 'lucide-react'
import { useApp } from '../hooks/useApp'

export const subjectIcons = {
  math: Sigma,
  brain: Brain,
  code: Code2,
  network: Network,
  language: Languages,
  book: BookOpen,
}
export function SubjectIcon({ icon, size = 20 }: { icon: string; size?: number }) {
  const Icon = subjectIcons[icon as keyof typeof subjectIcons] ?? BookOpen
  return <Icon size={size} />
}
export function SubjectBadge({ id }: { id: string }) {
  const { data } = useApp()
  const subject = data.subjects.find((s) => s.id === id)
  return (
    <span className="subject-badge" style={{ '--subject-color': subject?.color } as CSSProperties}>
      <span style={{ background: subject?.color ?? 'var(--muted)' }} />
      {subject?.name ?? 'Chưa phân môn'}
    </span>
  )
}
