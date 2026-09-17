import { useState } from 'react'
import { Download, Laptop, Moon, ShieldCheck, Sun, Trash2 } from 'lucide-react'
import { useApp } from '../hooks/useApp'
import { Button, ConfirmDialog, PageHeading } from '../components/ui'
import type { Settings as AppSettings } from '../types'
import { dateKey } from '../utils/date'

export default function Settings() {
  const { data, setData, toast, reset } = useApp()
  const [draft, setDraft] = useState({
    focus: data.settings.focus,
    short: data.settings.short,
    long: data.settings.long,
    weeklyGoal: data.settings.weeklyGoal,
  })
  const [error, setError] = useState('')
  const [resetting, setResetting] = useState(false)
  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `studyflow-${dateKey()}.json`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    toast('Đã xuất bản sao dữ liệu')
  }
  return (
    <>
      <PageHeading
        eyebrow="KHÔNG GIAN THEO CÁCH CỦA BẠN"
        title="Cài đặt"
        description="Điều chỉnh một chút để học tập thoải mái hơn."
      />
      <div className="settings-content">
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Giao diện</h2>
              <p>Chọn không gian phù hợp với bạn.</p>
            </div>
          </div>
          <div className="theme-options">
            {(
              [
                { id: 'light', label: 'Sáng', icon: Sun },
                { id: 'dark', label: 'Tối', icon: Moon },
                { id: 'system', label: 'Theo hệ thống', icon: Laptop },
              ] as const
            ).map((theme) => (
              <button
                key={theme.id}
                aria-pressed={data.settings.theme === theme.id}
                className={`theme-option ${data.settings.theme === theme.id ? 'selected' : ''}`}
                onClick={() => {
                  setData((current) => ({
                    ...current,
                    settings: { ...current.settings, theme: theme.id as AppSettings['theme'] },
                  }))
                  toast(`Đã chọn giao diện ${theme.label.toLowerCase()}`)
                }}
              >
                <span className={`theme-preview ${theme.id}`}>
                  <span />
                  <span>
                    <i />
                    <i />
                    <i />
                  </span>
                </span>
                <span>
                  <theme.icon size={16} />
                  {theme.label}
                  <i className="radio-dot" />
                </span>
              </button>
            ))}
          </div>
        </section>
        <form
          className="panel"
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            if (
              !Number.isInteger(draft.focus) ||
              draft.focus < 1 ||
              draft.focus > 180 ||
              !Number.isInteger(draft.short) ||
              draft.short < 1 ||
              draft.short > 60 ||
              !Number.isInteger(draft.long) ||
              draft.long < 1 ||
              draft.long > 120 ||
              draft.weeklyGoal < 1 ||
              draft.weeklyGoal > 168 ||
              !Number.isFinite(draft.weeklyGoal)
            ) {
              setError(
                'Thời gian phải là số phút nguyên: tập trung 1–180, nghỉ ngắn 1–60, nghỉ dài 1–120. Mục tiêu tuần từ 1–168 giờ.',
              )
              return
            }
            setData((current) => ({
              ...current,
              settings: { ...current.settings, ...draft },
              timer:
                current.timer.endAt || current.timer.remaining < current.timer.total
                  ? current.timer
                  : {
                      ...current.timer,
                      total: draft[current.timer.mode] * 60,
                      remaining: draft[current.timer.mode] * 60,
                    },
            }))
            setError('')
            toast('Đã lưu thời gian và mục tiêu')
          }}
        >
          <div className="section-heading">
            <div>
              <h2>Nhịp tập trung</h2>
              <p>Thiết lập mới áp dụng từ phiên tiếp theo nếu bạn đang học.</p>
            </div>
          </div>
          <div className="settings-fields">
            {(
              [
                { key: 'focus', label: 'Tập trung', max: 180 },
                { key: 'short', label: 'Nghỉ ngắn', max: 60 },
                { key: 'long', label: 'Nghỉ dài', max: 120 },
              ] as const
            ).map((field) => (
              <label className="field" key={field.key}>
                {field.label}
                <div className="unit-input">
                  <input
                    type="number"
                    min={1}
                    max={field.max}
                    value={draft[field.key] || ''}
                    onChange={(e) => setDraft({ ...draft, [field.key]: Number(e.target.value) })}
                  />
                  <span>phút</span>
                </div>
              </label>
            ))}
          </div>
          <div className="settings-goal">
            <div>
              <h3>Mục tiêu học tập tuần</h3>
              <p className="muted text-sm">Một mục tiêu vừa sức giúp bạn giữ nhịp lâu dài.</p>
            </div>
            <label className="unit-input">
              <input
                aria-label="Mục tiêu học tập tuần"
                type="number"
                min={1}
                max={168}
                step={0.5}
                value={draft.weeklyGoal || ''}
                onChange={(e) => setDraft({ ...draft, weeklyGoal: Number(e.target.value) })}
              />
              <span>giờ</span>
            </label>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="form-actions">
            <Button type="submit">Lưu thay đổi</Button>
          </div>
        </form>
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Dữ liệu của bạn</h2>
              <p>Bạn luôn là người kiểm soát không gian học tập của mình.</p>
            </div>
            <ShieldCheck size={22} className="accent-text" />
          </div>
          <div className="data-notice">
            <ShieldCheck size={20} />
            <p>
              Dữ liệu được lưu trong trình duyệt trên thiết bị này. Không cần tài khoản, không gửi
              lên máy chủ. Hãy xuất bản sao trước khi xóa dữ liệu trình duyệt.
            </p>
          </div>
          <div className="settings-data-row">
            <div>
              <h3>Xuất bản sao dữ liệu</h3>
              <p>Lưu toàn bộ dữ liệu dưới dạng tệp JSON.</p>
            </div>
            <Button variant="secondary" onClick={exportData}>
              <Download size={16} />
              Xuất dữ liệu
            </Button>
          </div>
          <div className="settings-data-row">
            <div>
              <h3 className="danger-text">Đặt lại ứng dụng</h3>
              <p>Xóa dữ liệu hiện tại và bắt đầu với không gian trống.</p>
            </div>
            <Button variant="danger" onClick={() => setResetting(true)}>
              <Trash2 size={16} />
              Xóa toàn bộ dữ liệu
            </Button>
          </div>
        </section>
        <p className="page-footer">
          StudyFlow · Phiên bản 1.0 · Được tạo cho những ngày học tập tốt hơn
        </p>
      </div>
      {resetting && (
        <ConfirmDialog
          title="Bắt đầu lại từ đầu?"
          message="Toàn bộ công việc, môn học, lịch học, ghi chú, lịch sử tập trung và cài đặt sẽ bị xóa. Thao tác này không thể hoàn tác. Hãy xuất dữ liệu nếu bạn muốn giữ bản sao."
          label="Xóa toàn bộ dữ liệu"
          onClose={() => setResetting(false)}
          onConfirm={() => {
            reset()
            setDraft({ focus: 25, short: 5, long: 15, weeklyGoal: 20 })
          }}
        />
      )}
    </>
  )
}
