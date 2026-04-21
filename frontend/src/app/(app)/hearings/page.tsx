'use client'

import { useUpcomingHearings } from '@/hooks/api.hooks'
import { Calendar, MapPin, User } from 'lucide-react'
import Link from 'next/link'
import { formatDateTime } from '@/lib/utils'

export default function HearingsPage() {
  const { data, isLoading } = useUpcomingHearings(60)
  const hearings = (data as any)?.data ?? []

  // Group by date
  const grouped = hearings.reduce((acc: Record<string, any[]>, h: any) => {
    const dateKey = new Date(h.scheduledAt).toDateString()
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(h)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Upcoming Hearings</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Next 60 days</p>
        </div>
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-sm font-medium">
          {hearings.length} scheduled
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : hearings.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-foreground">No upcoming hearings</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, dayHearings]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-24 h-px bg-border" />
                <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">
                  {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="space-y-2">
                {(dayHearings as any[]).map((h: any) => (
                  <Link key={h.id} href={`/matters/${h.matter.id}?tab=hearings`}
                    className="flex items-center gap-4 bg-card border rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition group">
                    <div className="w-14 text-center flex-shrink-0">
                      <p className="text-lg font-bold text-primary leading-none">
                        {new Date(h.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </p>
                    </div>
                    <div className="w-px h-10 bg-border flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm group-hover:text-primary transition">{h.matter.title}</p>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                        {h.matter.caseNumber && <span>📁 {h.matter.caseNumber}</span>}
                        {h.matter.judgeName && <span className="flex items-center gap-1"><User className="w-3 h-3" />{h.matter.judgeName}</span>}
                      </div>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full flex-shrink-0">
                      SCHEDULED
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
