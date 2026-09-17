import { useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  CheckCheck,
  ChevronRight,
  Clock3,
  Flame,
  Leaf,
  Plus,
  Sparkles,
  Target,
  Timer,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useApp } from '../hooks/useApp'
import { useStats } from '../hooks/useStats'
import { dateKey, decimal, formatDate, formatMinutes, weekDays } from '../utils/date'
import { Button, EmptyState, PageHeading, Progress } from '../components/ui'
import { TaskEditor } from '../components/TaskEditor'
import { TaskRow } from '../components/TaskRow'
import { StudyChart } from '../components/StudyChart'
import { SubjectIcon } from '../components/SubjectBadge'
import type { Task } from '../types'

export default function Dashboard() {
  const { data, navigate, timerAction } = useApp()
  const stats = useStats()
  const [editing, setEditing] = useState<Task | 'new' | null>(null)
  const hour = new Date().getHours()
  const greeting =
    hour < 11
      ? 'Chào buổi sáng'
      : hour < 14
        ? 'Chào buổi trưa'
        : hour < 18
          ? 'Chào buổi chiều'
          : 'Chào buổi tối'
  const todayTasks = data.tasks.filter((t) => t.dueDate === dateKey())
  const upcoming = [
    ...data.events
      .filter((e) => e.date >= dateKey())
      .map((e) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        subtitle: e.startTime || 'Cả ngày',
        subjectId: e.subjectId,
        page: 'calendar' as const,
      })),
    ...data.tasks
      .filter((t) => t.dueDate > dateKey() && t.status !== 'done')
      .map((t) => ({
        id: t.id,
        title: t.title,
        date: t.dueDate,
        subtitle: 'Hạn công việc',
        subjectId: t.subjectId,
        page: 'tasks' as const,
      })),
  ]
    .sort((a, b) => (a.date + a.subtitle).localeCompare(b.date + b.subtitle))
    .slice(0, 3)
  const metrics = [
    {
      label: 'Công việc hoàn thành',
      value: `${stats.todayDone}`,
      unit: 'việc',
      detail: 'Từng bước nhỏ, tiến bộ lớn',
      icon: CheckCheck,
      color: 'green',
    },
    {
      label: 'Tập trung hôm nay',
      value: decimal(stats.todayMinutes / 60),
      unit: 'giờ',
      detail: `${stats.todaySessions.length} phiên học trọn vẹn`,
      icon: Clock3,
      color: 'blue',
    },
    {
      label: 'Chuỗi ngày học tập',
      value: `${stats.streak}`,
      unit: 'ngày',
      detail: 'Giữ nhịp học tập của bạn',
      icon: Flame,
      color: 'orange',
    },
    {
      label: 'Mục tiêu tuần',
      value: `${stats.goalPercent}`,
      unit: '%',
      detail: `${decimal(stats.weekMinutes / 60)} / ${data.settings.weeklyGoal} giờ học`,
      icon: Target,
      color: 'purple',
    },
  ]
  return (
    <>
      <PageHeading
        eyebrow="MỖI NGÀY MỘT CHÚT TIẾN BỘ"
        title={`${greeting} 👋`}
        description="Một không gian gọn gàng. Một tâm trí sẵn sàng."
        action={
          <Button onClick={() => setEditing('new')}>
            <Plus size={17} />
            Thêm công việc
          </Button>
        }
      />
      <section className="welcome-banner">
        <div className="welcome-copy">
          <span className="welcome-label">
            <span /> KHÔNG GIAN CỦA BẠN
          </span>
          <h2>
            Việc nhỏ hôm nay.
            <br />
            <span>Bước tiến ngày mai.</span>
          </h2>
          <p>
            Dành một khoảng lặng cho điều quan trọng.
            <br className="desktop-only" /> Hành trình học tập của bạn bắt đầu từ đây.
          </p>
          <Button
            onClick={() => {
              navigate('focus')
              if (!data.timer.endAt) timerAction('start')
            }}
          >
            Bắt đầu tập trung <ArrowUpRight size={17} />
          </Button>
        </div>
        <div className="study-art" aria-hidden="true">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-star star-one">✦</div>
          <div className="art-star star-two">✧</div>
          <div className="art-note">
            <span />
            <span />
            <span />
            <i>✓</i>
          </div>
          <div className="art-book book-back" />
          <div className="art-book book-front">
            <Leaf size={37} strokeWidth={1.2} />
            <span>
              HỌC ĐIỀU MỚI
              <br />
              MỖI NGÀY
            </span>
            <div />
          </div>
          <div className="art-chip">
            <Sparkles size={15} /> Tập trung vào chính mình
          </div>
        </div>
      </section>
      <div className="stats-grid">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            className="stat-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -3 }}
          >
            <div className="stat-top">
              <span>{metric.label}</span>
              <span className={`stat-icon ${metric.color}`}>
                <metric.icon size={18} />
              </span>
            </div>
            <div className="stat-value">
              {metric.value}
              <span>{metric.unit}</span>
            </div>
            <p>{metric.detail}</p>
          </motion.div>
        ))}
      </div>
      <div className="dashboard-grid">
        <div className="dashboard-main">
          <section className="panel">
            <div className="section-heading">
              <div>
                <h2>
                  Công việc hôm nay <span className="count-badge">{todayTasks.length}</span>
                </h2>
                <p>Từng việc một, bạn đang làm rất tốt.</p>
              </div>
              <button className="text-button" onClick={() => navigate('tasks')}>
                Xem tất cả <ArrowRight size={15} />
              </button>
            </div>
            <div className="today-tasks">
              {todayTasks.map((task) => (
                <TaskRow key={task.id} task={task} onEdit={() => setEditing(task)} />
              ))}
              {!todayTasks.length && (
                <EmptyState
                  title="Hôm nay còn nhiều khoảng trống"
                  description="Thêm một việc nhỏ để bắt đầu ngày mới."
                />
              )}
            </div>
            {todayTasks.length > 0 && todayTasks.every((t) => t.status === 'done') && (
              <div className="all-done">
                <Sparkles size={16} />
                Tuyệt vời! Bạn đã hoàn thành mọi việc hôm nay.
              </div>
            )}
            <button className="quick-add" onClick={() => setEditing('new')}>
              <Plus size={16} />
              Thêm công việc mới
            </button>
          </section>
          <section className="panel">
            <div className="section-heading">
              <div>
                <h2>Nhịp học tập</h2>
                <p>Mỗi phút tập trung đều có ý nghĩa.</p>
              </div>
              <span className="period-badge">
                {formatDate(dateKey(weekDays()[0]), true)} –{' '}
                {formatDate(dateKey(weekDays()[6]), true)}
              </span>
            </div>
            <div className="chart-summary">
              <strong>
                {decimal(stats.weekMinutes / 60)} <span>giờ</span>
              </strong>
              <span className="muted">trong tuần này</span>
              <span className="chart-legend">
                <i />
                Thời gian tập trung
              </span>
            </div>
            <StudyChart />
          </section>
        </div>
        <div className="dashboard-aside">
          <section className="panel goal-panel">
            <div className="section-heading">
              <h2>Mục tiêu tuần</h2>
              <span className="subtle-icon">
                <Target size={18} />
              </span>
            </div>
            <div className="goal-value">
              {decimal(stats.weekMinutes / 60)}
              <span> / {data.settings.weeklyGoal} giờ</span>
              <span className="goal-percent">{stats.goalPercent}%</span>
            </div>
            <Progress value={stats.goalPercent} />
            <p className="goal-caption">
              {stats.goalPercent >= 100
                ? 'Bạn đã đạt mục tiêu tuần này. Thật đáng tự hào!'
                : `Còn ${formatMinutes(Math.max(0, data.settings.weeklyGoal * 60 - stats.weekMinutes))} để chạm mục tiêu. Cố lên nhé!`}
            </p>
            <div className="week-dots">
              {stats.chartData.map((d) => (
                <div key={d.name}>
                  <span className={d.minutes > 0 ? 'active' : ''}>
                    {d.minutes > 0 ? <CheckCheck size={13} /> : <span className="tiny-dot" />}
                  </span>
                  <small>{d.name}</small>
                </div>
              ))}
            </div>
          </section>
          <section className="panel upcoming-panel">
            <div className="section-heading">
              <h2>Sắp tới</h2>
              <button
                className="text-button"
                onClick={() => navigate('calendar')}
                aria-label="Mở lịch"
              >
                <ArrowUpRight size={17} />
              </button>
            </div>
            {upcoming.length ? (
              upcoming.map((item) => {
                const subject = data.subjects.find((s) => s.id === item.subjectId)
                return (
                  <button
                    className="upcoming-item"
                    key={item.id}
                    onClick={() => navigate(item.page)}
                  >
                    <span className="event-date">
                      <small>
                        {new Date(`${item.date}T12:00:00`).toLocaleDateString('vi-VN', {
                          month: 'short',
                        })}
                      </small>
                      <strong>{Number(item.date.slice(-2))}</strong>
                    </span>
                    <span className="upcoming-copy">
                      <strong>{item.title}</strong>
                      <span>
                        <i style={{ background: subject?.color }} />
                        {formatDate(item.date, true)} · {item.subtitle}
                      </span>
                    </span>
                    <ChevronRight size={14} />
                  </button>
                )
              })
            ) : (
              <EmptyState title="Chưa có lịch sắp tới" />
            )}
          </section>
          <button className="focus-prompt" onClick={() => navigate('focus')}>
            <span className="focus-prompt-icon">
              <Timer size={23} />
            </span>
            <span>
              <strong>Một chút tập trung?</strong>
              <small>
                {data.timer.endAt
                  ? 'Phiên học của bạn đang chạy'
                  : `${data.settings.focus} phút dành riêng cho bạn`}
              </small>
            </span>
            <ArrowUpRight size={19} />
          </button>
        </div>
      </div>
      <section className="panel subject-overview">
        <div className="section-heading">
          <div>
            <h2>Môn học của bạn</h2>
            <p>Nuôi dưỡng kiến thức, từng ngày.</p>
          </div>
          <button className="text-button" onClick={() => navigate('subjects')}>
            Tất cả môn học <ArrowRight size={15} />
          </button>
        </div>
        <div className="subject-mini-grid">
          {data.subjects.slice(0, 5).map((subject) => {
            const tasks = data.tasks.filter((t) => t.subjectId === subject.id)
            return (
              <button
                className="subject-mini"
                key={subject.id}
                onClick={() => navigate('subjects')}
              >
                <span
                  className="subject-icon"
                  style={{ color: subject.color, background: `${subject.color}14` }}
                >
                  <SubjectIcon icon={subject.icon} />
                </span>
                <strong>{subject.name}</strong>
                <span>
                  {tasks.filter((t) => t.status === 'done').length}/{tasks.length} công việc hoàn
                  thành
                </span>
              </button>
            )
          })}
          {!data.subjects.length && (
            <EmptyState
              title="Thêm môn học đầu tiên của bạn"
              action={
                <Button variant="secondary" onClick={() => navigate('subjects')}>
                  Thêm môn học
                </Button>
              }
            />
          )}
        </div>
      </section>
      <p className="page-footer">
        <Leaf size={13} />
        Không cần vội. Bạn đang tiến về phía trước.
      </p>
      {editing && (
        <TaskEditor
          task={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}
