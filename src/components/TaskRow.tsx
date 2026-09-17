import { Check, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Task } from '../types'
import { useApp } from '../hooks/useApp'
import { SubjectBadge } from './SubjectBadge'
import { priorityLabels } from './TaskEditor'

export function TaskRow({ task, onEdit }: { task: Task; onEdit: () => void }) {
  const { toggleTask } = useApp()
  return (
    <motion.div layout className={`task-row ${task.status === 'done' ? 'completed' : ''}`}>
      <button
        className={`task-check ${task.status === 'done' ? 'checked' : ''}`}
        aria-label={`${task.status === 'done' ? 'Mở lại' : 'Hoàn thành'}: ${task.title}`}
        onClick={() => toggleTask(task)}
      >
        {task.status === 'done' && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
            <Check size={14} />
          </motion.span>
        )}
      </button>
      <button className="task-row-main" onClick={onEdit}>
        <span className="task-title">{task.title}</span>
        <SubjectBadge id={task.subjectId} />
      </button>
      <span className={`priority priority-${task.priority}`}>{priorityLabels[task.priority]}</span>
      <button className="row-arrow" aria-label={`Sửa ${task.title}`} onClick={onEdit}>
        <ChevronRight size={17} />
      </button>
    </motion.div>
  )
}
