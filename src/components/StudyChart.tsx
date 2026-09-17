import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useReducedMotion } from 'framer-motion'
import { useStats } from '../hooks/useStats'
import { dateKey, formatMinutes } from '../utils/date'

export function StudyChart() {
  const { chartData } = useStats()
  const reduced = useReducedMotion()
  return (
    <div
      className="study-chart"
      role="img"
      aria-label={`Thời gian học tuần này: ${chartData.map((d) => `${d.name}: ${formatMinutes(d.minutes)}`).join(', ')}`}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart
          data={chartData}
          margin={{ top: 16, right: 4, left: -22, bottom: 0 }}
          barSize={30}
        >
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 5" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--muted)', fontSize: 11 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--muted)', fontSize: 10 }}
            tickFormatter={(value) => `${value}p`}
          />
          <Tooltip
            cursor={{ fill: 'var(--surface-hover)' }}
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              fontSize: 12,
              color: 'var(--text)',
            }}
            formatter={(value) => [formatMinutes(Number(value)), 'Tập trung']}
          />
          <Bar dataKey="minutes" radius={[6, 6, 3, 3]} isAnimationActive={!reduced}>
            {chartData.map((day) => (
              <Cell
                key={day.date}
                fill={day.date === dateKey() ? 'var(--accent)' : 'var(--chart-bar)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
