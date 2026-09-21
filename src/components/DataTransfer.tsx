import { useState } from 'react'
import type { AppData } from '../types'
import { createDemoData } from '../data/demo'
import { dataSchema, loadData } from '../lib/storage'
import { importData } from '../services/importData'
import { useApp } from '../hooks/useApp'
import { Button, Modal } from './ui'

export function DataTransfer() {
  const { setData, toast } = useApp()
  const [candidate, setCandidate] = useState<AppData | null>(null)
  const [settings, setSettings] = useState(false)
  const [error, setError] = useState('')
  const prepare = (raw: unknown) => {
    const result = dataSchema.safeParse(raw)
    if (
      !result.success ||
      result.data.subjects.some((s) => s.id.length > 190) ||
      [
        ...result.data.tasks,
        ...result.data.notes,
        ...result.data.events,
        ...result.data.sessions,
      ].some((row) => row.id.length > 190)
    ) {
      setError(
        'Tệp sao lưu không đúng cấu trúc hoặc có mã định danh quá dài. Chưa có dữ liệu nào được thay đổi.',
      )
      return
    }
    setCandidate(result.data)
    setError('')
    setSettings(false)
  }
  return (
    <>
      <div className="settings-data-row">
        <div>
          <h3>Chuyển dữ liệu cũ lên tài khoản</h3>
          <p>Bản gốc trên trình duyệt được giữ nguyên. Bạn xem lại trước khi nhập.</p>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            try {
              const legacy = loadData()
              if (legacy.warning) setError(legacy.warning)
              else prepare(legacy.data)
            } catch {
              setError('Không đọc được bộ nhớ trình duyệt. Hãy nhập tệp sao lưu JSON.')
            }
          }}
        >
          Nhập dữ liệu cũ
        </Button>
      </div>
      <div className="settings-data-row">
        <label className="field">
          Nhập bản sao JSON
          <input
            type="file"
            accept="application/json,.json"
            onChange={async (event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (!file) return
              if (file.size > 10 * 1024 * 1024) {
                setError('Chọn tệp nhỏ hơn 10 MB.')
                return
              }
              try {
                prepare(JSON.parse(await file.text()))
              } catch {
                setError('Không đọc được tệp JSON. Bản gốc vẫn được giữ nguyên.')
              }
            }}
          />
        </label>
      </div>
      <div className="settings-data-row">
        <div>
          <h3>Dữ liệu mẫu</h3>
          <p>Chỉ thêm khi bạn chọn, không ghi đè dữ liệu hiện có.</p>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            setData((current) => importData(current, createDemoData(), false, 'sample:'))
            toast('Đã thêm dữ liệu mẫu vào hàng chờ đồng bộ')
          }}
        >
          Tạo dữ liệu mẫu
        </Button>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {candidate && (
        <Modal title="Nhập dữ liệu vào tài khoản này?" onClose={() => setCandidate(null)}>
          <p>
            {candidate.tasks.length} công việc, {candidate.subjects.length} môn học,{' '}
            {candidate.notes.length} ghi chú, {candidate.events.length} lịch học và{' '}
            {candidate.sessions.length} phiên tập trung.
          </p>
          <p className="muted">
            Chỉ thêm các mục chưa nhập; giữ nguyên mục đã có. Đồng hồ đang chạy không được nhập.
          </p>
          <label className="import-settings">
            <input
              type="checkbox"
              checked={settings}
              onChange={(event) => setSettings(event.target.checked)}
            />
            Áp dụng cả giao diện, thời gian và mục tiêu từ bản sao
          </label>
          <div className="form-actions">
            <Button variant="secondary" onClick={() => setCandidate(null)}>
              Hủy
            </Button>
            <Button
              onClick={() => {
                setData((current) => importData(current, candidate, settings))
                setCandidate(null)
                toast('Đã đưa dữ liệu vào hàng chờ đồng bộ; bản gốc vẫn được giữ nguyên')
              }}
            >
              Nhập dữ liệu
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}
