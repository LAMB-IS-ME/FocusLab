import { useEffect, useRef, useState } from 'react'
import { Check, FileText, Pin, Plus, Search, Trash2 } from 'lucide-react'
import { useApp } from '../hooks/useApp'
import { Button, ConfirmDialog, EmptyState, IconButton, PageHeading } from '../components/ui'
import { dateKey, formatDate, uid } from '../utils/date'

export default function Notes() {
  const { data, setData, toast } = useApp()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(data.notes[0]?.id ?? null)
  const [deleting, setDeleting] = useState(false)
  const note = data.notes.find((n) => n.id === selected)
  const previousIds = useRef(new Set(data.notes.map((n) => n.id)))
  useEffect(() => {
    const created = data.notes.find((n) => !previousIds.current.has(n.id))
    if (created) {
      setSelected(created.id)
      setSearch('')
    }
    previousIds.current = new Set(data.notes.map((n) => n.id))
  }, [data.notes])
  const notes = data.notes
    .filter((n) =>
      `${n.title} ${n.content}`.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')),
    )
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt))
  const create = () => {
    const id = uid()
    setData((current) => ({
      ...current,
      notes: [
        {
          id,
          title: 'Ghi chú mới',
          content: '',
          pinned: false,
          updatedAt: new Date().toISOString(),
        },
        ...current.notes,
      ],
    }))
    setSelected(id)
    setSearch('')
    toast('Đã tạo ghi chú')
  }
  const update = (patch: { title?: string; content?: string; pinned?: boolean }) =>
    setData((current) => ({
      ...current,
      notes: current.notes.map((n) =>
        n.id === selected ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n,
      ),
    }))
  return (
    <>
      <PageHeading
        eyebrow="ĐỪNG ĐỂ Ý TƯỞNG TRÔI QUA"
        title="Ghi chú"
        description="Gom những ý tưởng, lưu những điều đáng nhớ."
        action={
          <Button onClick={create}>
            <Plus size={17} />
            Tạo ghi chú
          </Button>
        }
      />
      <div className="notes-layout">
        <aside className="panel notes-sidebar">
          <label className="search-field">
            <Search size={17} />
            <input
              aria-label="Tìm ghi chú"
              placeholder="Tìm trong ghi chú…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <p className="notes-count">{notes.length} ghi chú</p>
          <div className="note-list">
            {notes.map((n) => (
              <button
                className={`note-preview ${selected === n.id ? 'active' : ''}`}
                key={n.id}
                onClick={() => setSelected(n.id)}
              >
                <span className="note-preview-heading">
                  <FileText size={15} />
                  <strong>{n.title}</strong>
                  {n.pinned && <Pin size={13} />}
                </span>
                <p>{n.content || 'Một trang trống cho ý tưởng mới…'}</p>
                <span>{formatDate(dateKey(n.updatedAt), true)}</span>
              </button>
            ))}
            {!notes.length && (
              <EmptyState
                title={search ? 'Chưa tìm thấy ghi chú' : 'Chưa có ghi chú'}
                description={
                  search ? 'Thử một từ khóa khác nhé.' : 'Lưu lại điều bạn vừa học được.'
                }
              />
            )}
          </div>
        </aside>
        <section className="panel note-editor">
          {note ? (
            <>
              <div className="note-editor-toolbar">
                <span className="save-indicator">
                  <Check size={13} />
                  Tự động lưu
                </span>
                <span className="muted text-xs">{formatDate(dateKey(note.updatedAt), true)}</span>
                <div className="ml-auto flex">
                  <IconButton
                    label={note.pinned ? 'Bỏ ghim ghi chú' : 'Ghim ghi chú'}
                    aria-pressed={note.pinned}
                    onClick={() => update({ pinned: !note.pinned })}
                  >
                    <Pin size={17} fill={note.pinned ? 'currentColor' : 'none'} />
                  </IconButton>
                  <IconButton label="Xóa ghi chú" onClick={() => setDeleting(true)}>
                    <Trash2 size={17} />
                  </IconButton>
                </div>
              </div>
              <input
                key={`${note.id}-title`}
                className="note-title-input"
                aria-label="Tiêu đề ghi chú"
                value={note.title === 'Ghi chú mới' ? '' : note.title}
                placeholder="Ghi chú mới"
                maxLength={200}
                onChange={(e) => update({ title: e.target.value || 'Ghi chú mới' })}
                onBlur={(e) => {
                  if (!e.target.value.trim()) update({ title: 'Ghi chú mới' })
                }}
              />
              <textarea
                key={note.id}
                className="note-content-input"
                aria-label="Nội dung ghi chú"
                placeholder="Viết những điều bạn muốn ghi nhớ…"
                value={note.content}
                maxLength={100000}
                onChange={(e) => update({ content: e.target.value })}
              />
              <div className="note-editor-footer">
                <span>{note.content.trim() ? note.content.trim().split(/\s+/).length : 0} từ</span>
                <span>Không gian cho suy nghĩ của bạn</span>
              </div>
            </>
          ) : (
            <EmptyState
              title="Một ý tưởng hay bắt đầu từ đây"
              description="Chọn một ghi chú hoặc tạo trang viết mới."
              action={
                <Button variant="secondary" onClick={create}>
                  <Plus size={15} />
                  Tạo ghi chú
                </Button>
              }
            />
          )}
        </section>
      </div>
      {deleting && note && (
        <ConfirmDialog
          title="Xóa ghi chú?"
          message={`“${note.title}” sẽ bị xóa vĩnh viễn.`}
          onClose={() => setDeleting(false)}
          onConfirm={() => {
            setData((current) => ({
              ...current,
              notes: current.notes.filter((n) => n.id !== note.id),
            }))
            setSelected(data.notes.find((n) => n.id !== note.id)?.id ?? null)
            toast('Đã xóa ghi chú')
          }}
        />
      )}
    </>
  )
}
