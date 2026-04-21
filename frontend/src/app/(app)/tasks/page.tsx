'use client'
// Tasks page
import { useState } from 'react'
import { useMyTasks, useUpcomingTasks } from '@/hooks/api.hooks'
import { CheckSquare, Clock, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { cn, formatDate, isOverdue, TASK_STATUS_COLORS, PRIORITY_COLORS } from '@/lib/utils'

export default function TasksPage() {
  const [filter, setFilter] = useState<'all' | 'overdue' | 'today'>('all')
  const { data, isLoading } = useMyTasks(
    filter === 'overdue' ? { overdue: true } : undefined
  )
  const tasks = (data as any)?.data ?? []

  const today = new Date().toDateString()
  const displayed = filter === 'today'
    ? tasks.filter((t: any) => t.dueDate && new Date(t.dueDate).toDateString() === today)
    : tasks

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Tasks</h1>
        <div className="flex gap-2">
          {(['all', 'today', 'overdue'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('px-4 py-2 rounded-lg text-sm font-medium capitalize transition',
                filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent')}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-foreground">No tasks {filter !== 'all' ? `for "${filter}"` : ''}</p>
          <p className="text-sm mt-1">Go to a matter to create tasks</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map((task: any) => (
            <Link key={task.id} href={`/matters/${task.matter?.id}?tab=tasks`}
              className="flex items-center gap-4 bg-card border rounded-xl p-4 hover:shadow-sm hover:border-primary/30 transition group">
              <div className={cn('w-1 h-10 rounded-full flex-shrink-0',
                task.priority === 'URGENT' ? 'bg-red-500' :
                task.priority === 'HIGH' ? 'bg-orange-500' :
                task.priority === 'MEDIUM' ? 'bg-blue-500' : 'bg-slate-300')} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium group-hover:text-primary transition">{task.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{task.matter?.title}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={cn('text-xs px-2 py-0.5 rounded-full', TASK_STATUS_COLORS[task.status])}>
                  {task.status.replace('_', ' ')}
                </span>
                {task.dueDate && (
                  <span className={cn('text-xs flex items-center gap-1',
                    isOverdue(task.dueDate) && task.status !== 'DONE' ? 'text-red-500 font-medium' : 'text-muted-foreground')}>
                    {isOverdue(task.dueDate) && task.status !== 'DONE'
                      ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {formatDate(task.dueDate)}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
