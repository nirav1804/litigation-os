'use client'

import { useMatterTimeline } from '@/hooks/api.hooks'
import { Clock, FileText, Calendar, CheckSquare, MessageSquare, Settings, Scale } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

const EVENT_ICONS: Record<string, any> = {
  filing: FileText,
  hearing: Calendar,
  task: CheckSquare,
  document: FileText,
  note: MessageSquare,
  system: Settings,
  order: Scale,
}

const EVENT_COLORS: Record<string, string> = {
  filing: 'bg-blue-500',
  hearing: 'bg-purple-500',
  task: 'bg-green-500',
  document: 'bg-amber-500',
  note: 'bg-slate-400',
  system: 'bg-slate-300',
  order: 'bg-red-500',
}

export function MatterTimeline({ matterId }: { matterId: string }) {
  const { data, isLoading } = useMatterTimeline(matterId)
  const events = data?.data ?? []

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Timeline</h3>
        <span className="text-sm text-muted-foreground">{events.length} events</span>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No timeline events yet</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-border" />

          <div className="space-y-6">
            {events.map((event: any) => {
              const Icon = EVENT_ICONS[event.eventType] || Clock
              const colorClass = EVENT_COLORS[event.eventType] || 'bg-slate-400'

              return (
                <div key={event.id} className="relative flex gap-5 pl-2">
                  {/* Icon */}
                  <div className={`w-6 h-6 rounded-full ${colorClass} flex items-center justify-center flex-shrink-0 z-10`}>
                    <Icon className="w-3 h-3 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{event.title}</p>
                        {event.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                        )}
                        {event.createdBy && (
                          <p className="text-xs text-muted-foreground mt-1">
                            by {event.createdBy.firstName} {event.createdBy.lastName}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatDateTime(event.eventDate)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
