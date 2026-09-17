import { useEffect, useState } from 'react'
import {
  ArrowUpRight,
  FilePlus2,
  LayoutDashboard,
  ListTodo,
  Moon,
  Play,
  Plus,
  Search,
  Sun,
} from 'lucide-react'
import { useApp } from '../hooks/useApp'
import { Modal } from './ui'
import { uid } from '../utils/date'

export function CommandPalette({
  onClose,
  onNewTask,
}: {
  onClose: () => void
  onNewTask: () => void
}) {
  const { data, setData, navigate, timerAction, toast } = useApp()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const commands = [
    {
      label: 'Đi đến Tổng quan',
      group: 'Điều hướng',
      icon: LayoutDashboard,
      run: () => navigate('dashboard'),
    },
    {
      label: 'Đi đến Công việc',
      group: 'Điều hướng',
      icon: ListTodo,
      run: () => navigate('tasks'),
    },
    {
      label: 'Bắt đầu phiên Tập trung',
      group: 'Tập trung',
      icon: Play,
      run: () => {
        navigate('focus')
        if (!data.timer.endAt) timerAction('start')
      },
    },
    { label: 'Tạo Công việc', group: 'Tạo mới', icon: Plus, run: onNewTask },
    {
      label: 'Tạo Ghi chú',
      group: 'Tạo mới',
      icon: FilePlus2,
      run: () => {
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
        navigate('notes')
        toast('Đã tạo ghi chú')
      },
    },
    {
      label: 'Đổi giao diện sáng / tối',
      group: 'Cài đặt',
      icon: data.settings.theme === 'dark' ? Sun : Moon,
      run: () =>
        setData((current) => ({
          ...current,
          settings: {
            ...current.settings,
            theme: document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark',
          },
        })),
    },
  ].filter((command) =>
    command.label
      .toLocaleLowerCase('vi')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .includes(
        query
          .toLocaleLowerCase('vi')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, ''),
      ),
  )
  useEffect(() => {
    document.getElementById(`command-${selected}`)?.scrollIntoView({ block: 'nearest' })
  }, [selected])
  return (
    <Modal title="Bạn muốn làm gì?" onClose={onClose}>
      <div className="command-search">
        <Search size={20} />
        <input
          autoFocus
          placeholder="Tìm trang hoặc thao tác…"
          aria-label="Tìm thao tác"
          role="combobox"
          aria-expanded="true"
          aria-controls="command-results"
          aria-activedescendant={commands.length ? `command-${selected}` : undefined}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setSelected(0)
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setSelected((i) => (commands.length ? (i + 1) % commands.length : 0))
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault()
              setSelected((i) =>
                commands.length ? (i - 1 + commands.length) % commands.length : 0,
              )
            }
            if (e.key === 'Enter' && commands[selected]) {
              e.preventDefault()
              onClose()
              commands[selected].run()
            }
          }}
        />
      </div>
      <div
        className="command-results"
        id="command-results"
        role="listbox"
        aria-label="Thao tác nhanh"
      >
        {commands.map((command, i) => (
          <button
            type="button"
            key={command.label}
            id={`command-${i}`}
            role="option"
            aria-selected={selected === i}
            className={selected === i ? 'selected' : ''}
            onMouseMove={() => setSelected(i)}
            onClick={() => {
              onClose()
              command.run()
            }}
          >
            <command.icon size={18} />
            <span>
              {command.label}
              <small>{command.group}</small>
            </span>
            <ArrowUpRight size={15} />
          </button>
        ))}
        {!commands.length && (
          <p className="muted py-8 text-center text-sm">
            Không tìm thấy thao tác. Thử từ khóa khác nhé.
          </p>
        )}
      </div>
      <div className="command-footer">
        <span>↑ ↓ để chọn</span>
        <span>↵ để mở</span>
        <span>Esc để đóng</span>
      </div>
    </Modal>
  )
}
