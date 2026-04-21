'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useMatters } from '@/hooks/api.hooks'
import { Search, Plus, Filter, FolderOpen, Calendar, FileText, Users } from 'lucide-react'
import { cn, formatDate, formatRelative, MATTER_STATUS_COLORS } from '@/lib/utils'

const STATUS_OPTIONS = ['', 'ACTIVE', 'PENDING', 'CLOSED', 'ON_HOLD', 'ARCHIVED']
const TYPE_OPTIONS = ['', 'CIVIL', 'CRIMINAL', 'CONSTITUTIONAL', 'TAX', 'INTELLECTUAL_PROPERTY', 'ARBITRATION', 'FAMILY', 'CORPORATE', 'LABOUR', 'CONSUMER']

export default function MattersPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)
  const [assignedToMe, setAssignedToMe] = useState(false)

  const { data, isLoading } = useMatters({
    search: search || undefined,
    status: status || undefined,
    type: type || undefined,
    page,
    pageSize: 20,
    assignedToMe,
  })

  const matters = data?.data?.data ?? []
  const pagination = data?.data

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Matters</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {pagination?.total ?? 0} total matters
          </p>
        </div>
        <Link
          href="/matters/new"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition"
        >
          <Plus className="w-4 h-4" />
          New Matter
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-card border rounded-xl p-4">
        <div className="flex items-center gap-2 bg-background border rounded-lg px-3 py-2 flex-1 min-w-48">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by title, case number..."
            className="bg-transparent text-sm outline-none flex-1 placeholder:text-muted-foreground"
          />
        </div>

        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="bg-background border rounded-lg px-3 py-2 text-sm outline-none"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s || 'All Statuses'}</option>
          ))}
        </select>

        <select
          value={type}
          onChange={(e) => { setType(e.target.value); setPage(1) }}
          className="bg-background border rounded-lg px-3 py-2 text-sm outline-none"
        >
          {TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>{t || 'All Types'}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={assignedToMe}
            onChange={(e) => setAssignedToMe(e.target.checked)}
            className="rounded"
          />
          Assigned to me
        </label>
      </div>

      {/* Table */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">
                Matter
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                Court / Judge
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                Next Hearing
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                Team
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                Status
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                Updated
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              : matters.map((m: any) => (
                  <tr key={m.id} className="hover:bg-accent/50 transition group">
                    <td className="px-5 py-4">
                      <Link href={`/matters/${m.id}`} className="block">
                        <p className="font-medium text-sm group-hover:text-primary transition line-clamp-1">
                          {m.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            {m.caseNumber || 'No case no.'}
                          </span>
                          <span className="text-muted-foreground/40">·</span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {m.type.replace('_', ' ').toLowerCase()}
                          </span>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <p className="text-sm truncate max-w-32">{m.court?.name || '—'}</p>
                      <p className="text-xs text-muted-foreground">{m.judgeName || '—'}</p>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      {m.nextHearingDate ? (
                        <div className="flex items-center gap-1.5 text-sm">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className={cn(
                            new Date(m.nextHearingDate) < new Date()
                              ? 'text-red-500 font-medium'
                              : ''
                          )}>
                            {formatDate(m.nextHearingDate)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <div className="flex -space-x-1.5">
                        {m.assignments?.slice(0, 3).map((a: any) => (
                          <div
                            key={a.userId}
                            title={`${a.user.firstName} ${a.user.lastName}`}
                            className="w-6 h-6 rounded-full bg-primary flex items-center justify-center border-2 border-background"
                          >
                            <span className="text-primary-foreground text-[10px] font-bold">
                              {a.user.firstName[0]}{a.user.lastName[0]}
                            </span>
                          </div>
                        ))}
                        {(m.assignments?.length ?? 0) > 3 && (
                          <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                            <span className="text-xs font-medium">+{m.assignments.length - 3}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn(
                        'text-xs px-2.5 py-1 rounded-full font-medium',
                        MATTER_STATUS_COLORS[m.status]
                      )}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {formatRelative(m.updatedAt)}
                      </span>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {matters.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <FolderOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No matters found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? 'Try different search terms' : 'Create your first matter to get started'}
            </p>
            {!search && (
              <Link
                href="/matters/new"
                className="inline-flex items-center gap-2 mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition"
              >
                <Plus className="w-4 h-4" />
                New Matter
              </Link>
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-accent transition"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-accent transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
