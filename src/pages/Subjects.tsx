import { useState } from 'react'
import { ArrowUpRight, Clock3, Pencil, Plus, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useApp } from '../hooks/useApp'
import type { Subject } from '../types'
import { dateKey, formatDate, formatMinutes, uid } from '../utils/date'
import {
  Button,
  ConfirmDialog,
  EmptyState,
  IconButton,
  Modal,
  PageHeading,
  Progress,
} from '../components/ui'
import { SubjectIcon, subjectIcons } from '../components/SubjectBadge'
import { TaskRow } from '../components/TaskRow'
import { TaskEditor } from '../components/TaskEditor'
import type { Task } from '../types'

const colors = [
  '#c88c42',
  '#8871bd',
  '#5582bc',
  '#c77367',
  '#4e9987',
  '#cc6695',
  '#7c8e52',
  '#718096',
]
const iconLabels = {
  math: 'Toán học',
  brain: 'Trí tuệ',
  code: 'Lập trình',
  network: 'Kết nối',
  language: 'Ngôn ngữ',
  book: 'Sách',
}
function SubjectEditor({ subject, onClose }: { subject?: Subject; onClose: () => void }) {
  const { setData, toast } = useApp()
  const [draft, setDraft] = useState(
    subject ?? { id: uid(), name: '', color: colors[0], icon: 'book' },
  )
  const [error, setError] = useState('')
  return (
    <Modal title={subject ? 'Chỉnh sửa môn học' : 'Thêm môn học'} onClose={onClose}>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          if (!draft.name.trim()) {
            setError('Hãy nhập tên môn học.')
            return
          }
          setData((current) => ({
            ...current,
            subjects: subject
              ? current.subjects.map((s) =>
                  s.id === subject.id ? { ...draft, name: draft.name.trim() } : s,
                )
              : [...current.subjects, { ...draft, name: draft.name.trim() }],
          }))
          toast('Đã cập nhật môn học')
          onClose()
        }}
      >
        <label className="field">
          Tên môn học
          <input
            autoFocus
            placeholder="Ví dụ: Toán cao cấp"
            maxLength={200}
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <fieldset className="field">
          <legend>Màu đại diện</legend>
          <div className="color-options">
            {colors.map((color, i) => (
              <button
                key={color}
                type="button"
                aria-label={`Màu ${['vàng đất', 'tím', 'xanh dương', 'san hô', 'xanh ngọc', 'hồng', 'ô liu', 'xám'][i]}`}
                aria-pressed={draft.color === color}
                className={draft.color === color ? 'selected' : ''}
                style={{ background: color }}
                onClick={() => setDraft({ ...draft, color })}
              />
            ))}
          </div>
        </fieldset>
        <fieldset className="field">
          <legend>Biểu tượng</legend>
          <div className="icon-options">
            {Object.keys(subjectIcons).map((icon) => (
              <button
                key={icon}
                type="button"
                aria-label={iconLabels[icon as keyof typeof iconLabels]}
                aria-pressed={draft.icon === icon}
                className={draft.icon === icon ? 'selected' : ''}
                onClick={() => setDraft({ ...draft, icon })}
              >
                <SubjectIcon icon={icon} />
              </button>
            ))}
          </div>
        </fieldset>
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit">Lưu môn học</Button>
        </div>
      </form>
    </Modal>
  )
}
export default function Subjects() {
  const { data, setData, toast } = useApp()
  const [editing, setEditing] = useState<Subject | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Subject | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const subject = data.subjects.find((s) => s.id === selected)
  const tasks = data.tasks.filter((t) => t.subjectId === selected)
  const sessions = data.sessions.filter((s) => s.subjectId === selected)
  return (
    <>
      <PageHeading
        eyebrow="KIẾN THỨC LỚN LÊN TỪNG NGÀY"
        title="Môn học"
        description="Mỗi môn học là một hành trình đáng khám phá."
        action={
          <Button onClick={() => setEditing('new')}>
            <Plus size={17} />
            Thêm môn học
          </Button>
        }
      />
      <div className="subjects-grid">
        {data.subjects.map((subject) => {
          const tasks = data.tasks.filter((t) => t.subjectId === subject.id)
          const done = tasks.filter((t) => t.status === 'done').length
          const minutes = data.sessions
            .filter((s) => s.subjectId === subject.id)
            .reduce((sum, s) => sum + s.duration, 0)
          return (
            <motion.article key={subject.id} className="panel subject-card" whileHover={{ y: -4 }}>
              <div className="flex items-start justify-between">
                <span
                  className="subject-icon large"
                  style={{ color: subject.color, background: `${subject.color}15` }}
                >
                  <SubjectIcon icon={subject.icon} size={25} />
                </span>
                <div className="flex">
                  <IconButton label={`Sửa ${subject.name}`} onClick={() => setEditing(subject)}>
                    <Pencil size={16} />
                  </IconButton>
                  <IconButton label={`Xóa ${subject.name}`} onClick={() => setDeleting(subject)}>
                    <Trash2 size={16} />
                  </IconButton>
                </div>
              </div>
              <button className="subject-card-title" onClick={() => setSelected(subject.id)}>
                <h2>{subject.name}</h2>
                <ArrowUpRight size={18} />
              </button>
              <p className="subject-card-time">
                <Clock3 size={15} />
                {formatMinutes(minutes)} đã tập trung
              </p>
              <div className="flex justify-between text-xs muted mt-6 mb-3">
                <span>
                  {done}/{tasks.length} công việc hoàn thành
                </span>
                <strong>{tasks.length ? Math.round((done / tasks.length) * 100) : 0}%</strong>
              </div>
              <Progress
                value={tasks.length ? (done / tasks.length) * 100 : 0}
                color={subject.color}
              />
              <button className="text-button mt-5" onClick={() => setSelected(subject.id)}>
                Xem hành trình học tập <ArrowUpRight size={14} />
              </button>
            </motion.article>
          )
        })}
        <button className="add-subject" onClick={() => setEditing('new')}>
          <span>
            <Plus size={25} />
          </span>
          <strong>Khám phá điều mới</strong>
          <p>Thêm một môn học vào hành trình</p>
        </button>
      </div>
      {editing && (
        <SubjectEditor
          subject={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Xóa môn học?"
          message={`“${deleting.name}” sẽ bị xóa. Công việc, lịch học và lịch sử tập trung được giữ lại trong nhóm chưa phân môn.`}
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            setData((current) => ({
              ...current,
              subjects: current.subjects.filter((s) => s.id !== deleting.id),
              tasks: current.tasks.map((t) =>
                t.subjectId === deleting.id ? { ...t, subjectId: '' } : t,
              ),
              events: current.events.map((e) =>
                e.subjectId === deleting.id ? { ...e, subjectId: '' } : e,
              ),
              sessions: current.sessions.map((s) =>
                s.subjectId === deleting.id ? { ...s, subjectId: '' } : s,
              ),
              timer:
                current.timer.subjectId === deleting.id
                  ? { ...current.timer, subjectId: '' }
                  : current.timer,
            }))
            toast('Đã xóa môn học và giữ lại lịch sử')
            if (selected === deleting.id) setSelected(null)
          }}
        />
      )}
      {subject && (
        <Modal title={subject.name} onClose={() => setSelected(null)} wide>
          <div className="subject-detail-stats">
            <div>
              <strong>{formatMinutes(sessions.reduce((sum, s) => sum + s.duration, 0))}</strong>
              <span>Tổng thời gian học</span>
            </div>
            <div>
              <strong>
                {tasks.filter((t) => t.status === 'done').length}/{tasks.length}
              </strong>
              <span>Công việc hoàn thành</span>
            </div>
            <div>
              <strong>{sessions.length}</strong>
              <span>Phiên tập trung</span>
            </div>
          </div>
          <h3 className="small-heading">Công việc gần đây</h3>
          {tasks.length ? (
            tasks.map((t) => <TaskRow key={t.id} task={t} onEdit={() => setEditingTask(t)} />)
          ) : (
            <EmptyState title="Chưa có công việc cho môn này" />
          )}
          <h3 className="small-heading mt-6">Phiên học gần đây</h3>
          {sessions.length ? (
            [...sessions]
              .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
              .slice(0, 5)
              .map((s) => (
                <div className="simple-row" key={s.id}>
                  <span>{formatDate(dateKey(s.completedAt))}</span>
                  <strong>{formatMinutes(s.duration)}</strong>
                </div>
              ))
          ) : (
            <p className="muted py-4 text-sm">Chưa có phiên tập trung nào.</p>
          )}
        </Modal>
      )}
      {editingTask && <TaskEditor task={editingTask} onClose={() => setEditingTask(null)} />}
    </>
  )
}
