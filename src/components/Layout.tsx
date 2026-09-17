import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  BookOpen,
  CalendarDays,
  ChevronsLeft,
  Command,
  FileText,
  LayoutDashboard,
  Leaf,
  ListTodo,
  Menu,
  Search,
  Settings,
  Timer,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useApp } from '../hooks/useApp'
import { useStats } from '../hooks/useStats'
import type { Page } from '../types'
import { IconButton, Modal, Progress } from './ui'
import { timerText, useTimerRemaining } from './FocusTimer'
import { ThemeMenu } from './ThemeMenu'

export const navItems = [
  { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'tasks', label: 'Công việc', icon: ListTodo },
  { id: 'focus', label: 'Tập trung', icon: Timer },
  { id: 'calendar', label: 'Lịch', icon: CalendarDays },
  { id: 'subjects', label: 'Môn học', icon: BookOpen },
  { id: 'notes', label: 'Ghi chú', icon: FileText },
  { id: 'settings', label: 'Cài đặt', icon: Settings },
] satisfies { id: Page; label: string; icon: typeof Timer }[]
function MiniTimer() {
  const { data, navigate } = useApp()
  const remaining = useTimerRemaining()
  return data.timer.endAt ? (
    <button className="mini-timer" onClick={() => navigate('focus')}>
      <span className="live-dot" />
      <span>{timerText(remaining)}</span>
      <span className="desktop-only">
        {data.timer.mode === 'focus' ? 'Đang tập trung' : 'Đang nghỉ'}
      </span>
    </button>
  ) : null
}
export function Layout({ children, onCommand }: { children: ReactNode; onCommand: () => void }) {
  const { data, setData, page, navigate, storageWarning } = useApp()
  const { goalPercent } = useStats()
  const [mobileMenu, setMobileMenu] = useState(false)
  const collapsed = data.settings.collapsed
  const active = navItems.find((item) => item.id === page)!
  const nav = (mobile = false) => (
    <nav aria-label={mobile ? 'Menu di động' : 'Điều hướng chính'}>
      {navItems.map((item) => (
        <button
          key={item.id}
          className={`nav-item ${page === item.id ? 'active' : ''}`}
          aria-current={page === item.id ? 'page' : undefined}
          onClick={() => {
            navigate(item.id)
            setMobileMenu(false)
          }}
          title={!mobile ? item.label : undefined}
          aria-label={item.label}
        >
          <item.icon size={19} />
          <span>{item.label}</span>
          {item.id === 'tasks' && (
            <small>{data.tasks.filter((t) => t.status !== 'done').length}</small>
          )}
          {page === item.id && <i />}
        </button>
      ))}
    </nav>
  )
  return (
    <div className={`app-shell ${collapsed ? 'is-collapsed' : ''}`}>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault()
          document.getElementById('main-content')?.focus()
        }}
      >
        Chuyển đến nội dung chính
      </a>
      <motion.aside
        className="sidebar"
        animate={{ width: collapsed ? 80 : 236 }}
        transition={{ duration: 0.22 }}
      >
        <button
          className="brand"
          onClick={() => navigate('dashboard')}
          aria-label="StudyFlow — Tổng quan"
        >
          <span className="brand-mark">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="m4 14 7-10h9l-7 10H4Zm0 5h9l7-10"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span>
            StudyFlow<span className="brand-dot">.</span>
          </span>
        </button>
        <div className="workspace-badge">
          <span className="workspace-avatar">
            <Leaf size={17} />
          </span>
          <span>
            Góc học tập<small>Không gian cá nhân</small>
          </span>
          <span className="workspace-status" />
        </div>
        <p className="nav-label">KHÔNG GIAN HỌC TẬP</p>
        {nav()}
        <div className="sidebar-bottom">
          <div className="sidebar-goal">
            <span>
              <Leaf size={15} />
              Kiên trì từng chút một
            </span>
            <p>Mỗi phiên học là một bước tiến.</p>
            <Progress value={goalPercent} />
            <small>{goalPercent}% mục tiêu tuần này</small>
          </div>
          <button className="sidebar-command" onClick={onCommand}>
            <Command size={16} />
            <span>Thao tác nhanh</span>
            <kbd>⌘ K</kbd>
          </button>
          <div className="sidebar-profile">
            <span className="profile-avatar">B</span>
            <span>
              Bạn của hôm nay
              <small>
                Sẵn sàng tiến bộ <span>✦</span>
              </small>
            </span>
            <IconButton
              label={collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
              onClick={() =>
                setData((current) => ({
                  ...current,
                  settings: { ...current.settings, collapsed: !collapsed },
                }))
              }
            >
              <ChevronsLeft size={16} className={collapsed ? 'rotate-180' : ''} />
            </IconButton>
          </div>
        </div>
      </motion.aside>
      <div className="app-body">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu-toggle icon-button"
              onClick={() => setMobileMenu(true)}
              aria-label="Mở menu"
            >
              <Menu size={22} />
            </button>
            <span className="desktop-only">Không gian cá nhân</span>
            <span className="desktop-only">/</span>
            <strong>
              <active.icon size={15} />
              {active.label}
            </strong>
          </div>
          <div className="topbar-actions">
            <MiniTimer />
            <span className="header-date">
              {new Intl.DateTimeFormat('vi-VN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              }).format(new Date())}
            </span>
            <IconButton label="Tìm kiếm và thao tác nhanh" onClick={onCommand}>
              <Search size={18} />
            </IconButton>
            <ThemeMenu />
            <span className="header-avatar" aria-label="Không gian cá nhân">
              B
            </span>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          {storageWarning && (
            <div className="storage-warning" role="alert">
              {storageWarning}
            </div>
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 7 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        <div className="bottom-nav">
          {navItems.slice(0, 4).map((item) => (
            <button
              key={item.id}
              className={page === item.id ? 'active' : ''}
              onClick={() => navigate(item.id)}
              aria-current={page === item.id ? 'page' : undefined}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
          <button
            className={['subjects', 'notes', 'settings'].includes(page) ? 'active' : ''}
            onClick={() => setMobileMenu(true)}
          >
            <Menu size={20} />
            <span>Thêm</span>
          </button>
        </div>
      </div>
      {mobileMenu && (
        <Modal title="Không gian của bạn" onClose={() => setMobileMenu(false)}>
          <div className="mobile-navigation">{nav(true)}</div>
          <ButtonLikeCommand
            onClick={() => {
              setMobileMenu(false)
              onCommand()
            }}
          />
        </Modal>
      )}
    </div>
  )
}
function ButtonLikeCommand({ onClick }: { onClick: () => void }) {
  return (
    <button className="mobile-command" onClick={onClick}>
      <Search size={18} />
      Tìm kiếm và thao tác nhanh
    </button>
  )
}
