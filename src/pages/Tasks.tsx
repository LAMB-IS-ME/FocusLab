import { useState } from 'react'
import type { ReactNode } from 'react'
import { CalendarDays, Check, Circle, CircleDashed, GripVertical, Plus, Search } from 'lucide-react'
import { AnimatePresence, motion, useIsPresent } from 'framer-motion'
import { useApp } from '../hooks/useApp'
import type { Task, TaskStatus } from '../types'
import { dateKey, formatDate } from '../utils/date'
import { Button, EmptyState, PageHeading } from '../components/ui'
import { TaskEditor, priorityLabels, statusLabels } from '../components/TaskEditor'
import { SubjectBadge } from '../components/SubjectBadge'

export default function Tasks() {
  const { data, setData, toggleTask, toast } = useApp()
  const [editing, setEditing] = useState<Task | 'new' | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [subject, setSubject] = useState('')
  const [priority, setPriority] = useState('')
  const [dragging, setDragging] = useState('')
  const [over, setOver] = useState('')
  const tasks = data.tasks.filter(
    (t) =>
      `${t.title} ${t.description}`
        .toLocaleLowerCase('vi')
        .includes(search.toLocaleLowerCase('vi')) &&
      (!subject || t.subjectId === subject) &&
      (!priority || t.priority === priority) &&
      (filter === 'all' ||
        (filter === 'today' && t.dueDate === dateKey()) ||
        (filter === 'upcoming' && t.dueDate > dateKey() && t.status !== 'done') ||
        (filter === 'done' && t.status === 'done')),
  )
  const move = (id: string, status: TaskStatus) => {
    setData((current) => ({
      ...current,
      tasks: current.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              status,
              completedAt: status === 'done' ? (t.completedAt ?? new Date().toISOString()) : null,
            }
          : t,
      ),
    }))
    toast(`Đã chuyển sang ${statusLabels[status].toLowerCase()}`)
  }
  const addTask = (status: TaskStatus = 'todo') =>
    setEditing({
      id: crypto.randomUUID(),
      title: '',
      description: '',
      subjectId: '',
      dueDate: dateKey(),
      status,
      priority: 'medium',
      completedAt: null,
    })
  return (
    <>
      <PageHeading
        eyebrow="SẮP XẾP ĐỂ THẢNH THƠI"
        title="Công việc"
        description="Biến những dự định thành từng bước có thể thực hiện."
        action={
          <Button onClick={() => setEditing('new')}>
            <Plus size={17} />
            Thêm công việc
          </Button>
        }
      />
      <div className="task-toolbar">
        <div className="tabs" aria-label="Lọc công việc">
          {[
            ['all', 'Tất cả'],
            ['today', 'Hôm nay'],
            ['upcoming', 'Sắp tới'],
            ['done', 'Đã hoàn thành'],
          ].map(([key, label]) => (
            <button
              key={key}
              className={filter === key ? 'active' : ''}
              onClick={() => setFilter(key)}
              aria-pressed={filter === key}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="search-field">
          <Search size={17} />
          <input
            aria-label="Tìm công việc"
            placeholder="Tìm công việc…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      <div className="filter-row">
        <select
          aria-label="Lọc theo môn học"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        >
          <option value="">Tất cả môn học</option>
          {data.subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Lọc mức ưu tiên"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="">Mọi mức ưu tiên</option>
          {Object.entries(priorityLabels).map(([key, value]) => (
            <option key={key} value={key}>
              {value}
            </option>
          ))}
        </select>
        <span className="muted text-xs">{tasks.length} công việc</span>
        <span className="drag-hint">Kéo thẻ hoặc dùng ô trạng thái để di chuyển</span>
      </div>
      <div className="kanban">
        {(['todo', 'progress', 'done'] as const).map((status) => {
          const Icon = status === 'done' ? Check : status === 'progress' ? CircleDashed : Circle
          return (
            <section
              key={status}
              className={`kanban-column ${over === status ? 'drag-over' : ''}`}
              onDragOver={(e) => {
                e.preventDefault()
                setOver(status)
              }}
              onDragLeave={() => setOver('')}
              onDrop={(e) => {
                e.preventDefault()
                // Lấy ID từ thao tác kéo, không phụ thuộc nhịp cập nhật state của React.
                const taskId = e.dataTransfer.getData('text/plain')
                if (data.tasks.some((task) => task.id === taskId)) move(taskId, status)
                setDragging('')
                setOver('')
              }}
            >
              <div className={`kanban-heading ${status}`}>
                <Icon size={16} />
                <h2>{statusLabels[status]}</h2>
                <span>{tasks.filter((t) => t.status === status).length}</span>
                <button
                  aria-label={`Thêm công việc ${statusLabels[status].toLowerCase()}`}
                  onClick={() => addTask(status)}
                >
                  <Plus size={17} />
                </button>
              </div>
              <div className="kanban-cards">
                <AnimatePresence>
                  {tasks
                    .filter((t) => t.status === status)
                    .map((task) => (
                      <TaskCardShell
                        key={task.id}
                        taskId={task.id}
                        dragging={dragging === task.id}
                        onDragChange={(id) => {
                          setDragging(id)
                          if (!id) setOver('')
                        }}
                      >
                        <div className="kanban-card-top">
                          <SubjectBadge id={task.subjectId} />
                          <GripVertical size={15} className="muted" />
                        </div>
                        <button
                          className={`kanban-title ${task.status === 'done' ? 'line-through muted' : ''}`}
                          onClick={() => setEditing(task)}
                        >
                          {task.title}
                        </button>
                        {task.description && <p>{task.description}</p>}
                        <div className="kanban-meta">
                          <span className={`priority priority-${task.priority}`}>
                            {priorityLabels[task.priority]}
                          </span>
                          <span
                            className={
                              task.dueDate && task.dueDate < dateKey() && status !== 'done'
                                ? 'danger-text'
                                : ''
                            }
                          >
                            <CalendarDays size={12} />
                            {formatDate(task.dueDate, true)}
                          </span>
                        </div>
                        <div className="kanban-card-bottom">
                          <select
                            aria-label={`Trạng thái ${task.title}`}
                            value={task.status}
                            onChange={(e) => move(task.id, e.target.value as TaskStatus)}
                          >
                            {Object.entries(statusLabels).map(([key, label]) => (
                              <option key={key} value={key}>
                                {label}
                              </option>
                            ))}
                          </select>
                          <button
                            className={`task-check ${status === 'done' ? 'checked' : ''}`}
                            aria-label={`${status === 'done' ? 'Mở lại' : 'Hoàn thành'}: ${task.title}`}
                            onClick={() => toggleTask(task)}
                          >
                            {status === 'done' && <Check size={13} />}
                          </button>
                        </div>
                      </TaskCardShell>
                    ))}
                </AnimatePresence>
                {!tasks.some((t) => t.status === status) && (
                  <EmptyState
                    title="Chưa có công việc"
                    description="Một khoảng trống cho kế hoạch mới."
                  />
                )}
              </div>
              <button className="quick-add" onClick={() => addTask(status)}>
                <Plus size={15} />
                Thêm công việc
              </button>
            </section>
          )
        })}
      </div>
      {editing && (
        <TaskEditor
          task={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}

function TaskCardShell({
  taskId,
  dragging,
  onDragChange,
  children,
}: {
  taskId: string
  dragging: boolean
  onDragChange: (id: string) => void
  children: ReactNode
}) {
  const isPresent = useIsPresent()
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      inert={!isPresent}
      aria-hidden={!isPresent}
      className={`kanban-card ${dragging ? 'dragging' : ''}`}
      draggable={isPresent}
      onDragStartCapture={(event) => {
        event.dataTransfer.setData('text/plain', taskId)
        event.dataTransfer.effectAllowed = 'move'
        onDragChange(taskId)
      }}
      onDragEndCapture={() => onDragChange('')}
    >
      {children}
    </motion.article>
  )
}
