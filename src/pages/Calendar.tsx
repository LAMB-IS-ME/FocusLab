import { useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Plus } from 'lucide-react'
import { useApp } from '../hooks/useApp'
import { addDays, dateKey, formatDate, formatMinutes } from '../utils/date'
import { Button, EmptyState, IconButton, PageHeading } from '../components/ui'
import { EventEditor } from '../components/EventEditor'
import { TaskRow } from '../components/TaskRow'
import { TaskEditor } from '../components/TaskEditor'
import { SubjectBadge } from '../components/SubjectBadge'
import type { StudyEvent, Task } from '../types'

export default function Calendar() {
  const { data } = useApp()
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  )
  const [selected, setSelected] = useState(dateKey())
  const [editing, setEditing] = useState<StudyEvent | 'new' | null>(null)
  const [editingTask, setEditingTask] = useState<Task | 'new' | null>(null)
  const start = addDays(month, -((month.getDay() + 6) % 7))
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i))
  const tasks = data.tasks.filter((t) => t.dueDate === selected)
  const events = data.events
    .filter((e) => e.date === selected)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
  const selectDay = (date: Date) => {
    setSelected(dateKey(date))
    if (date.getMonth() !== month.getMonth() || date.getFullYear() !== month.getFullYear())
      setMonth(new Date(date.getFullYear(), date.getMonth(), 1))
  }
  return (
    <>
      <PageHeading
        eyebrow="DÀNH CHỖ CHO ĐIỀU QUAN TRỌNG"
        title="Lịch học tập"
        description="Một góc nhìn rõ ràng cho những ngày sắp tới."
        action={
          <Button onClick={() => setEditing('new')}>
            <Plus size={17} />
            Thêm lịch học
          </Button>
        }
      />
      <div className="calendar-layout">
        <section className="panel calendar-panel">
          <div className="calendar-toolbar">
            <h2>{month.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
                  setSelected(dateKey())
                }}
              >
                Hôm nay
              </Button>
              <IconButton
                label="Tháng trước"
                onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
              >
                <ChevronLeft size={18} />
              </IconButton>
              <IconButton
                label="Tháng sau"
                onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
              >
                <ChevronRight size={18} />
              </IconButton>
            </div>
          </div>
          <div className="calendar-weekdays">
            {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="calendar-grid">
            {days.map((day) => {
              const key = dateKey(day)
              const items = [
                ...data.events.filter((e) => e.date === key),
                ...data.tasks.filter((t) => t.dueDate === key),
              ]
              return (
                <button
                  key={key}
                  aria-label={`${day.toLocaleDateString('vi-VN')}, ${items.length} mục`}
                  aria-pressed={selected === key}
                  aria-current={key === dateKey() ? 'date' : undefined}
                  className={`calendar-day ${day.getMonth() !== month.getMonth() ? 'outside' : ''} ${key === dateKey() ? 'today' : ''} ${key === selected ? 'selected' : ''}`}
                  onClick={() => selectDay(day)}
                  onKeyDown={(e) => {
                    const offsets: Record<string, number> = {
                      ArrowLeft: -1,
                      ArrowRight: 1,
                      ArrowUp: -7,
                      ArrowDown: 7,
                    }
                    if (e.key in offsets) {
                      e.preventDefault()
                      const next = addDays(day, offsets[e.key])
                      selectDay(next)
                      requestAnimationFrame(() =>
                        document
                          .querySelector<HTMLButtonElement>(`[data-date="${dateKey(next)}"]`)
                          ?.focus(),
                      )
                    }
                  }}
                  data-date={key}
                >
                  <span className="day-number">{day.getDate()}</span>
                  <span className="day-events">
                    {items.slice(0, 2).map((item) => (
                      <span
                        key={item.id}
                        style={
                          {
                            '--event-color':
                              data.subjects.find((s) => s.id === item.subjectId)?.color ??
                              'var(--accent)',
                          } as React.CSSProperties
                        }
                      >
                        {item.title}
                      </span>
                    ))}
                    {items.length > 2 && <small>+{items.length - 2} mục</small>}
                  </span>
                  <span className="day-indicators">
                    {items.slice(0, 3).map((item) => (
                      <i
                        key={item.id}
                        style={{
                          background:
                            data.subjects.find((s) => s.id === item.subjectId)?.color ??
                            'var(--accent)',
                        }}
                      />
                    ))}
                  </span>
                </button>
              )
            })}
          </div>
        </section>
        <aside className="panel day-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">KẾ HOẠCH TRONG NGÀY</p>
              <h2>{formatDate(selected)}</h2>
            </div>
            <CalendarDays size={19} className="muted" />
          </div>
          <h3 className="small-heading">Lịch học · {events.length}</h3>
          {events.map((event) => (
            <button className="day-event" key={event.id} onClick={() => setEditing(event)}>
              <SubjectBadge id={event.subjectId} />
              <strong>{event.title}</strong>
              <span>
                <Clock3 size={13} />
                {event.startTime || 'Cả ngày'}
                {event.duration > 0 && ` · ${formatMinutes(event.duration)}`}
              </span>
            </button>
          ))}
          {!events.length && <p className="muted text-sm py-4">Chưa có lịch học cho ngày này.</p>}
          <button className="quick-add" onClick={() => setEditing('new')}>
            <Plus size={15} />
            Thêm lịch học
          </button>
          <h3 className="small-heading mt-7">Công việc đến hạn · {tasks.length}</h3>
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} onEdit={() => setEditingTask(task)} />
          ))}
          {!tasks.length && <EmptyState title="Không có công việc đến hạn" />}
          <button className="quick-add" onClick={() => setEditingTask('new')}>
            <Plus size={15} />
            Thêm công việc
          </button>
        </aside>
      </div>
      {editing && (
        <EventEditor
          event={editing === 'new' ? undefined : editing}
          date={selected}
          onClose={() => setEditing(null)}
        />
      )}
      {editingTask && (
        <TaskEditor
          task={editingTask === 'new' ? undefined : editingTask}
          dueDate={selected}
          onClose={() => setEditingTask(null)}
        />
      )}
    </>
  )
}
