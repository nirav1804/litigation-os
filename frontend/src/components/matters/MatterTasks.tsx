'use client'

import { useState } from 'react'
import {
  useMatterTasks, useCreateTask, useUpdateTask, useDeleteTask, useUsers,
} from '@/hooks/api.hooks'
import {
  Plus, CheckSquare, Circle, Clock, AlertTriangle, Trash2, ChevronDown,
} from 'lucide-react'
import { cn, formatDate, isOverdue, TASK_STATUS_COLORS, PRIORITY_COLORS } from '@/lib/utils'
import { toast } from 'sonner'

const STATUSES = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'CANCELLED']
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

export function MatterTasks({ matterId }: { matterId: string }) {
  const { data, isLoading } = useMatterTasks(matterId)
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const { data: usersData } = useUsers()

  const [showForm, setShowForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
    assigneeId: '',
  })

  const tasks = data?.data ?? []
  const users = usersData?.data ?? []
  const filtered = filterStatus ? tasks.filter((t: any) => t.status === filterStatus) : tasks

  const handleCreate = async () => {
    if (!form.title.trim()) return
    await createTask.mutateAsync({ matterId, ...form })
    setForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeId: '' })
    setShowForm(false)
    toast.success('Task created')
  }

  const handleStatusChange = async (taskId: string, status: string) => {
    await updateTask.mutateAsync({ id: taskId, status })
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          {['', ...STATUSES.slice(0, 4)].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                'px-3 py-1.5 text-xs rounded-lg font-medium transition',
                filterStatus === s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent',
              )}
            >
              {s || 'All'}
              {s && ` (${tasks.filter((t: any) => t.status === s).length})`}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition"
        >
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-card border rounded-xl p-5 space-y-3">
          <h4 className="font-semibold text-sm">New Task</h4>
          <input
            autoFocus
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Task title..."
            className="w-full border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30"
          />
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Description (optional)..."
            className="w-full border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30 min-h-16 resize-none"
          />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background outline-none"
              >
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Assignee</label>
              <select
                value={form.assigneeId}
                onChange={e => setForm(f => ({ ...f, assigneeId: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background outline-none"
              >
                <option value="">Unassigned</option>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-accent transition"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={createTask.isPending || !form.title.trim()}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition"
            >
              Create Task
            </button>
          </div>
        </div>
      )}

      {/* Task list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CheckSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No tasks {filterStatus ? `with status "${filterStatus}"` : 'yet'}</p>
          <p className="text-sm mt-1">Click "New Task" to create one</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((task: any) => (
            <div
              key={task.id}
              className={cn(
                'bg-card border rounded-xl p-4 flex items-start gap-4 hover:shadow-sm transition',
                task.status === 'DONE' && 'opacity-60',
              )}
            >
              {/* Status toggle */}
              <button
                onClick={() =>
                  handleStatusChange(task.id, task.status === 'DONE' ? 'TODO' : 'DONE')
                }
                className="mt-0.5 flex-shrink-0"
                title="Toggle completion"
              >
                {task.status === 'DONE' ? (
                  <CheckSquare className="w-5 h-5 text-green-500" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition" />
                )}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={cn('text-sm font-medium', task.status === 'DONE' && 'line-through text-muted-foreground')}>
                    {task.title}
                  </p>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full', TASK_STATUS_COLORS[task.status])}>
                    {task.status.replace('_', ' ')}
                  </span>
                  <span className={cn('text-xs font-semibold', PRIORITY_COLORS[task.priority])}>
                    {task.priority}
                  </span>
                </div>
                {task.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{task.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  {task.assignee && (
                    <span className="flex items-center gap-1">
                      <span className="w-4 h-4 rounded-full bg-primary inline-flex items-center justify-center">
                        <span className="text-primary-foreground text-[9px] font-bold">
                          {task.assignee.firstName[0]}
                        </span>
                      </span>
                      {task.assignee.firstName} {task.assignee.lastName}
                    </span>
                  )}
                  {task.dueDate && (
                    <span className={cn(
                      'flex items-center gap-1',
                      isOverdue(task.dueDate) && task.status !== 'DONE' ? 'text-red-500 font-medium' : '',
                    )}>
                      {isOverdue(task.dueDate) && task.status !== 'DONE'
                        ? <AlertTriangle className="w-3 h-3" />
                        : <Clock className="w-3 h-3" />}
                      {formatDate(task.dueDate)}
                    </span>
                  )}
                </div>
              </div>

              {/* Status select */}
              <select
                value={task.status}
                onChange={e => handleStatusChange(task.id, e.target.value)}
                className="text-xs border rounded-lg px-2 py-1.5 bg-background outline-none flex-shrink-0"
              >
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>

              {/* Delete */}
              <button
                onClick={() => deleteTask.mutate(task.id)}
                className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 transition text-muted-foreground flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
