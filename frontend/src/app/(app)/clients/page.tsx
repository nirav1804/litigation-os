'use client'

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'
import { useUser } from '@/stores/auth.store'
import Link from 'next/link'
import { FolderOpen, Calendar, FileText, Scale } from 'lucide-react'
import { cn, formatDate, MATTER_STATUS_COLORS } from '@/lib/utils'

export default function ClientsPage() {
  const user = useUser()
  const isClient = user?.role === 'CLIENT'

  const { data, isLoading } = useQuery({
    queryKey: ['client-portal'],
    queryFn: () => isClient ? apiGet('/clients/portal') : apiGet('/clients'),
  })

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-12 bg-muted rounded-xl" />
        {[1,2,3].map(i => <div key={i} className="h-32 bg-muted rounded-xl" />)}
      </div>
    )
  }

  // CLIENT VIEW
  if (isClient) {
    const portal = (data as any)?.data
    const matters = portal?.matters ?? []

    return (
      <div className="space-y-6">
        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">
                {user?.firstName[0]}{user?.lastName[0]}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold">Welcome, {user?.firstName}</h1>
              <p className="text-muted-foreground text-sm">Your case portal — {matters.length} active matter(s)</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {matters.map((mc: any) => {
            const m = mc.matter
            return (
              <div key={mc.id} className="bg-card border rounded-xl p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-semibold">{m.title}</h2>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full', MATTER_STATUS_COLORS[m.status])}>
                        {m.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {m.caseNumber || 'Case number pending'}
                      {m.court && ` · ${m.court.name}, ${m.court.city}`}
                    </p>
                  </div>
                  {mc.partyType && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full capitalize flex-shrink-0">
                      {mc.partyType.toLowerCase()}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {/* Upcoming hearings */}
                  <div className="col-span-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Next Hearings
                    </p>
                    <div className="space-y-1.5">
                      {m.hearings?.slice(0, 3).map((h: any) => (
                        <div key={h.id} className="text-sm bg-muted rounded-lg px-3 py-2">
                          <p className="font-medium">{formatDate(h.scheduledAt)}</p>
                          <p className="text-xs text-muted-foreground">{h.status}</p>
                        </div>
                      ))}
                      {!m.hearings?.length && (
                        <p className="text-sm text-muted-foreground">No upcoming hearings</p>
                      )}
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="col-span-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Documents
                    </p>
                    <div className="space-y-1.5">
                      {m.documents?.slice(0, 4).map((d: any) => (
                        <div key={d.id} className="flex items-center gap-2 text-sm">
                          <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{d.name}</span>
                        </div>
                      ))}
                      {!m.documents?.length && (
                        <p className="text-sm text-muted-foreground">No documents yet</p>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="col-span-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Updates
                    </p>
                    <div className="space-y-1.5">
                      {m.notes?.slice(0, 3).map((n: any) => (
                        <div key={n.id} className="text-xs bg-muted rounded-lg px-3 py-2 text-muted-foreground line-clamp-2">
                          {n.content}
                        </div>
                      ))}
                      {!m.notes?.length && (
                        <p className="text-sm text-muted-foreground">No updates yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          {matters.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Scale className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-foreground">No matters assigned to you yet</p>
              <p className="text-sm mt-1">Contact your lawyer for access</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // LAWYER VIEW - list all clients
  const clients = (data as any)?.data ?? []

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Clients</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{clients.length} clients registered</p>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Client</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Email</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Matters</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {clients.map((c: any) => (
              <tr key={c.id} className="hover:bg-accent/30 transition">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {c.user.firstName[0]}{c.user.lastName[0]}
                      </span>
                    </div>
                    <p className="font-medium text-sm">{c.user.firstName} {c.user.lastName}</p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm text-muted-foreground">{c.user.email}</p>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-1">
                    {c.matters?.slice(0, 2).map((mc: any) => (
                      <Link
                        key={mc.matter.id}
                        href={`/matters/${mc.matter.id}`}
                        className="text-xs bg-muted hover:bg-primary/10 hover:text-primary px-2 py-0.5 rounded-full transition truncate max-w-32"
                      >
                        {mc.matter.title}
                      </Link>
                    ))}
                    {c.matters?.length > 2 && (
                      <span className="text-xs text-muted-foreground">+{c.matters.length - 2} more</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {clients.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No clients yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
