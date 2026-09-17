import { Clock3, Coffee, Headphones, Timer } from 'lucide-react'
import { useApp } from '../hooks/useApp'
import { useStats } from '../hooks/useStats'
import { FocusTimer } from '../components/FocusTimer'
import { EmptyState, PageHeading, Progress } from '../components/ui'
import { SubjectBadge } from '../components/SubjectBadge'
import { dateKey, formatDate, formatMinutes } from '../utils/date'

export default function Focus() {
  const { data, setData } = useApp()
  const stats = useStats()
  const subjects = data.subjects
    .map((subject) => ({
      ...subject,
      minutes: stats.weekSessions
        .filter((s) => s.subjectId === subject.id)
        .reduce((sum, s) => sum + s.duration, 0),
    }))
    .filter((s) => s.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes)
  return (
    <>
      <PageHeading
        eyebrow="Ở ĐÂY, NGAY LÚC NÀY"
        title="Thời gian để tập trung"
        description="Đặt những xao nhãng sang một bên. Làm một việc thật trọn vẹn."
      />
      <div className="focus-layout">
        <section className="panel timer-panel">
          <div className="focus-environment">
            <Headphones size={15} />
            Không gian yên tĩnh của bạn
            <span className={data.timer.endAt ? 'live-dot' : 'tiny-dot'} />
          </div>
          <FocusTimer />
          <div className="focus-selection">
            <label className="field">
              Bạn đang học môn gì?
              <select
                disabled={data.timer.endAt !== null || data.timer.remaining < data.timer.total}
                value={data.timer.subjectId}
                onChange={(e) =>
                  setData((current) => ({
                    ...current,
                    timer: { ...current.timer, subjectId: e.target.value, taskId: '' },
                  }))
                }
              >
                <option value="">Tập trung tự do</option>
                {data.subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Công việc trong phiên này
              <select
                disabled={data.timer.endAt !== null || data.timer.remaining < data.timer.total}
                value={data.timer.taskId}
                onChange={(e) =>
                  setData((current) => ({
                    ...current,
                    timer: {
                      ...current.timer,
                      taskId: e.target.value,
                      subjectId:
                        current.tasks.find((t) => t.id === e.target.value)?.subjectId ??
                        current.timer.subjectId,
                    },
                  }))
                }
              >
                <option value="">Chưa chọn công việc</option>
                {data.tasks
                  .filter(
                    (t) =>
                      (t.status !== 'done' || t.id === data.timer.taskId) &&
                      (!data.timer.subjectId || t.subjectId === data.timer.subjectId),
                  )
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <p className="timer-tip">
            <Coffee size={14} />
            Phiên hoàn thành được lưu tự động. Bạn chủ động bắt đầu phiên tiếp theo.
          </p>
        </section>
        <div className="focus-aside">
          <section className="panel">
            <div className="section-heading">
              <h2>Hôm nay của bạn</h2>
              <Timer size={18} className="muted" />
            </div>
            <div className="focus-stat-pair">
              <div>
                <strong>{stats.todaySessions.length}</strong>
                <span>phiên hoàn thành</span>
              </div>
              <div>
                <strong>{stats.todayMinutes}</strong>
                <span>phút tập trung</span>
              </div>
            </div>
            <p className="soft-callout">
              “Sự tập trung là cách bạn biến thời gian thành điều có ý nghĩa.”
            </p>
          </section>
          <section className="panel">
            <div className="section-heading">
              <div>
                <h2>Thời gian theo môn</h2>
                <p>Phân bổ học tập trong tuần</p>
              </div>
            </div>
            {subjects.length ? (
              subjects.map((s) => (
                <div className="subject-time" key={s.id}>
                  <div>
                    <SubjectBadge id={s.id} />
                    <span>{formatMinutes(s.minutes)}</span>
                  </div>
                  <Progress
                    value={stats.weekMinutes ? (s.minutes / stats.weekMinutes) * 100 : 0}
                    color={s.color}
                  />
                </div>
              ))
            ) : (
              <EmptyState
                title="Bắt đầu phiên học đầu tiên"
                description="Thời gian theo môn sẽ xuất hiện ở đây."
              />
            )}
            {stats.weekSessions.some(
              (s) => !data.subjects.some((subject) => subject.id === s.subjectId),
            ) && (
              <p className="muted text-xs mt-4">
                Tập trung tự do:{' '}
                {formatMinutes(
                  stats.weekSessions
                    .filter((s) => !data.subjects.some((subject) => subject.id === s.subjectId))
                    .reduce((sum, s) => sum + s.duration, 0),
                )}
              </p>
            )}
          </section>
        </div>
      </div>
      <section className="panel session-panel">
        <div className="section-heading">
          <div>
            <h2>Lịch sử tập trung</h2>
            <p>Những khoảng thời gian bạn đã đầu tư cho bản thân.</p>
          </div>
          <span className="count-badge">{data.sessions.length} phiên</span>
        </div>
        {data.sessions.length ? (
          <div className="session-list">
            {[...data.sessions]
              .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
              .slice(0, 30)
              .map((session) => (
                <div className="session-row" key={session.id}>
                  <span className="session-icon">
                    <Clock3 size={17} />
                  </span>
                  <div>
                    <strong>
                      {data.tasks.find((t) => t.id === session.taskId)?.title ?? 'Phiên tập trung'}
                    </strong>
                    <SubjectBadge id={session.subjectId} />
                  </div>
                  <span className="session-date">
                    {formatDate(dateKey(session.completedAt), true)} ·{' '}
                    {new Date(session.completedAt).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="session-duration">{formatMinutes(session.duration)}</span>
                </div>
              ))}
          </div>
        ) : (
          <EmptyState
            title="Lịch sử đang chờ bạn"
            description="Hoàn thành một phiên tập trung để đánh dấu bước khởi đầu."
          />
        )}
        {data.sessions.length > 30 && (
          <p className="muted text-xs mt-4">
            Hiển thị 30 phiên gần nhất. Toàn bộ lịch sử vẫn được lưu và tính vào thống kê.
          </p>
        )}
      </section>
    </>
  )
}
