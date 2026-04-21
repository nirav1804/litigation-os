'use client'

import { useDashboard, useUpcomingHearings, useMyTasks } from '@/hooks/api.hooks'
import { useUser } from '@/stores/auth.store'
import {
  FolderOpen, CheckSquare, Calendar, Brain, TrendingUp,
  AlertCircle, Clock, ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatRelative, MATTER_STATUS_COLORS, TASK_STATUS_COLORS, PRIORITY_COLORS } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function DashboardPage() {
  const user = useUser()
  const { data: dashboard, isLoading } = useDashboard()
  const { data: hearings } = useUpcomingHearings(7)
  const { data: myTasks } = useMyTasks({ status: 'TODO' })

  const stats = dashboard?.data

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {greeting()}, {user?.firstName} 👋
          </h1>
          <p className="text-muted-foreground mt-0.5">
            Here's what's happening with your practice today.
          </p>
        </div>
        <Link
          href="/matters/new"
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition"
        >
          + New Matter
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<FolderOpen className="w-5 h-5" />}
          label="Active Matters"
          value={stats?.matterStats?.active ?? '—'}
          sub={`${stats?.matterStats?.total ?? 0} total`}
          color="blue"
          href="/matters"
        />
        <StatCard
          icon={<CheckSquare className="w-5 h-5" />}
          label="Pending Tasks"
          value={(stats?.taskStats?.todo ?? 0) + (stats?.taskStats?.inProgress ?? 0)}
          sub={`${stats?.taskStats?.overdue ?? 0} overdue`}
          color={stats?.taskStats?.overdue > 0 ? 'red' : 'green'}
          href="/tasks"
        />
        <StatCard
          icon={<Calendar className="w-5 h-5" />}
          label="Hearings This Week"
          value={stats?.hearingStats?.thisWeek ?? '—'}
          sub={`${stats?.hearingStats?.thisMonth ?? 0} this month`}
          color="purple"
          href="/hearings"
        />
        <StatCard
          icon={<Brain className="w-5 h-5" />}
          label="AI Outputs"
          value={stats?.aiUsage?.thisMonth ?? '—'}
          sub="this month"
          color="amber"
          href="/ai"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Hearings */}
        <div className="lg:col-span-1 bg-card border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Upcoming Hearings
            </h3>
            <Link href="/hearings" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {hearings?.data?.slice(0, 5).map((h: any) => (
              <Link
                key={h.id}
                href={`/matters/${h.matter.id}?tab=hearings`}
                className="block group"
              >
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-primary text-xs font-bold leading-none">
                      {new Date(h.scheduledAt).getDate()}
                    </span>
                    <span className="text-primary text-[10px]">
                      {new Date(h.scheduledAt).toLocaleString('default', { month: 'short' })}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition">
                      {h.matter.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {h.matter.caseNumber || 'No case number'}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
            {(!hearings?.data?.length) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No upcoming hearings
              </p>
            )}
          </div>
        </div>

        {/* Matter Status Chart */}
        <div className="lg:col-span-1 bg-card border rounded-xl p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Matter Status
          </h3>
          {stats?.matterStats?.byStatus?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={stats.matterStats.byStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                >
                  {stats.matterStats.byStatus.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              No data yet
            </div>
          )}
          <div className="space-y-1 mt-2">
            {stats?.matterStats?.byStatus?.map((s: any, i: number) => (
              <div key={s.status} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="capitalize text-muted-foreground">{s.status.toLowerCase()}</span>
                </div>
                <span className="font-medium">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* My Tasks */}
        <div className="lg:col-span-1 bg-card border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-primary" />
              My Tasks
            </h3>
            <Link href="/tasks" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {myTasks?.data?.slice(0, 6).map((t: any) => (
              <div key={t.id} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-accent transition">
                <div className={cn(
                  'w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0',
                  t.priority === 'URGENT' ? 'bg-red-500' :
                  t.priority === 'HIGH' ? 'bg-orange-500' :
                  t.priority === 'MEDIUM' ? 'bg-blue-500' : 'bg-slate-400'
                )} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate">{t.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.matter?.title}</p>
                </div>
                {t.dueDate && (
                  <span className={cn(
                    'text-xs flex-shrink-0',
                    new Date(t.dueDate) < new Date() ? 'text-red-500 font-medium' : 'text-muted-foreground'
                  )}>
                    {formatDate(t.dueDate)}
                  </span>
                )}
              </div>
            ))}
            {(!myTasks?.data?.length) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                All caught up! 🎉
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Matters */}
      <div className="bg-card border rounded-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-semibold">Recent Matters</h3>
          <Link href="/matters" className="text-xs text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="divide-y">
          {stats?.recentMatters?.slice(0, 5).map((m: any) => (
            <Link
              key={m.id}
              href={`/matters/${m.id}`}
              className="flex items-center gap-4 p-4 hover:bg-accent transition group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-medium text-sm group-hover:text-primary transition truncate">
                    {m.title}
                  </p>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full flex-shrink-0',
                    MATTER_STATUS_COLORS[m.status]
                  )}>
                    {m.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {m.caseNumber || 'No case number'} · {m.type}
                  {m.court && ` · ${m.court.name}`}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-muted-foreground">{formatRelative(m.updatedAt)}</p>
                <div className="flex items-center gap-3 mt-1 justify-end text-xs text-muted-foreground">
                  <span>{m._count?.documents ?? 0} docs</span>
                  <span>{m._count?.tasks ?? 0} tasks</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon, label, value, sub, color, href,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  sub: string
  color: 'blue' | 'green' | 'red' | 'purple' | 'amber'
  href: string
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  }

  return (
    <Link href={href} className="bg-card border rounded-xl p-5 hover:shadow-md transition group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className={cn('p-2 rounded-lg', colorClasses[color])}>{icon}</div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
    </Link>
  )
}
