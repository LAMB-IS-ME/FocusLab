import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useApp } from '../hooks/useApp'
import type { StudyEvent } from '../types'
import { uid } from '../utils/date'
import { Button, ConfirmDialog, Modal } from './ui'
import { eventSchema } from '../lib/storage'

export function EventEditor({
  event,
  date,
  onClose,
}: {
  event?: StudyEvent
  date: string
  onClose: () => void
}) {
  const { data, setData, toast } = useApp()
  const [draft, setDraft] = useState<StudyEvent>(
    event ?? { id: uid(), title: '', subjectId: '', date, startTime: '', duration: 0 },
  )
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  return (
    <>
      <Modal title={event ? 'Chỉnh sửa lịch học' : 'Thêm lịch học'} onClose={onClose}>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            if (!eventSchema.safeParse({ ...draft, title: draft.title.trim() }).success) {
              setError('Nhập tên, ngày hợp lệ và thời lượng từ 0 đến 1.440 phút.')
              return
            }
            setData((current) => ({
              ...current,
              events: event
                ? current.events.map((item) =>
                    item.id === event.id ? { ...draft, title: draft.title.trim() } : item,
                  )
                : [...current.events, { ...draft, title: draft.title.trim() }],
            }))
            toast('Đã lưu lịch học')
            onClose()
          }}
        >
          <label className="field">
            Tên sự kiện
            <input
              autoFocus
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              maxLength={200}
              placeholder="Ví dụ: Học nhóm Toán cao cấp"
            />
          </label>
          <label className="field">
            Môn học
            <select
              value={draft.subjectId}
              onChange={(e) => setDraft({ ...draft, subjectId: e.target.value })}
            >
              <option value="">Chưa phân môn</option>
              {data.subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Ngày
            <input
              type="date"
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
            />
          </label>
          <div className="form-grid">
            <label className="field">
              Giờ bắt đầu (tùy chọn)
              <input
                type="time"
                value={draft.startTime}
                onChange={(e) => setDraft({ ...draft, startTime: e.target.value })}
              />
            </label>
            <label className="field">
              Thời lượng (phút, tùy chọn)
              <input
                type="number"
                min={0}
                max={1440}
                value={draft.duration || ''}
                onChange={(e) => setDraft({ ...draft, duration: Number(e.target.value) })}
                placeholder="Ví dụ: 60"
              />
            </label>
          </div>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <div className="form-actions">
            {event && (
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
            <Button type="submit">Lưu lịch học</Button>
          </div>
        </form>
      </Modal>
      {deleting && (
        <ConfirmDialog
          title="Xóa lịch học?"
          message={`Bạn muốn xóa “${draft.title}” khỏi lịch?`}
          onClose={() => setDeleting(false)}
          onConfirm={() => {
            setData((current) => ({
              ...current,
              events: current.events.filter((item) => item.id !== draft.id),
            }))
            toast('Đã xóa lịch học')
            onClose()
          }}
        />
      )}
    </>
  )
}
