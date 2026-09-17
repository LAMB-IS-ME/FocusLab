import { useState } from 'react'
import type { Task } from '../types'
import { useApp } from '../hooks/useApp'
import { dateKey, uid } from '../utils/date'
import { Button, ConfirmDialog, Modal } from './ui'
import { Trash2 } from 'lucide-react'
import { taskSchema } from '../lib/storage'

export const priorityLabels = { high: 'Cao', medium: 'Vừa', low: 'Thấp' }
export const statusLabels = { todo: 'Cần làm', progress: 'Đang thực hiện', done: 'Hoàn thành' }
export function TaskEditor({
  task,
  onClose,
  subjectId = '',
  dueDate = dateKey(),
}: {
  task?: Task
  onClose: () => void
  subjectId?: string
  dueDate?: string
}) {
  const { data, setData, saveTask, toast } = useApp()
  const [draft, setDraft] = useState<Task>(
    task ?? {
      id: uid(),
      title: '',
      description: '',
      subjectId,
      priority: 'medium',
      dueDate,
      status: 'todo',
      completedAt: null,
    },
  )
  const isExisting = task && data.tasks.some((item) => item.id === task.id)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const update = <K extends keyof Task>(key: K, value: Task[K]) =>
    setDraft({ ...draft, [key]: value })
  return (
    <>
      <Modal title={isExisting ? 'Chỉnh sửa công việc' : 'Thêm công việc'} onClose={onClose}>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            if (!taskSchema.safeParse({ ...draft, title: draft.title.trim() }).success) {
              setError('Hãy nhập tên công việc và ngày đến hạn hợp lệ (nếu có).')
              return
            }
            saveTask({
              ...draft,
              title: draft.title.trim(),
              completedAt:
                draft.status === 'done' ? (draft.completedAt ?? new Date().toISOString()) : null,
            })
            onClose()
          }}
        >
          <label className="field">
            Tên công việc
            <input
              autoFocus
              value={draft.title}
              onChange={(e) => update('title', e.target.value)}
              maxLength={200}
              placeholder="Bạn muốn hoàn thành điều gì?"
              aria-invalid={!!error}
            />
          </label>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <label className="field">
            Mô tả
            <textarea
              rows={3}
              value={draft.description}
              onChange={(e) => update('description', e.target.value)}
              maxLength={10000}
              placeholder="Thêm một vài chi tiết…"
            />
          </label>
          <label className="field">
            Môn học
            <select value={draft.subjectId} onChange={(e) => update('subjectId', e.target.value)}>
              <option value="">Chưa phân môn</option>
              {data.subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <div className="form-grid">
            <label className="field">
              Mức ưu tiên
              <select
                value={draft.priority}
                onChange={(e) => update('priority', e.target.value as Task['priority'])}
              >
                {Object.entries(priorityLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Ngày đến hạn
              <input
                type="date"
                value={draft.dueDate}
                onChange={(e) => update('dueDate', e.target.value)}
              />
            </label>
          </div>
          <label className="field">
            Trạng thái
            <select
              value={draft.status}
              onChange={(e) => update('status', e.target.value as Task['status'])}
            >
              {Object.entries(statusLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <div className="form-actions">
            {isExisting && (
              <Button
                type="button"
                variant="ghost"
                className="danger-text mr-auto"
                onClick={() => setDeleting(true)}
              >
                <Trash2 size={16} />
                Xóa
              </Button>
            )}
            <Button type="button" variant="secondary" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit">Lưu công việc</Button>
          </div>
        </form>
      </Modal>
      {deleting && (
        <ConfirmDialog
          title="Xóa công việc?"
          message={`“${draft.title}” sẽ bị xóa. Bạn không thể hoàn tác thao tác này.`}
          onClose={() => setDeleting(false)}
          onConfirm={() => {
            setData((current) => ({
              ...current,
              tasks: current.tasks.filter((t) => t.id !== draft.id),
              timer:
                current.timer.taskId === draft.id
                  ? { ...current.timer, taskId: '' }
                  : current.timer,
            }))
            toast('Đã xóa công việc')
            onClose()
          }}
        />
      )}
    </>
  )
}
