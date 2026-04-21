'use client'

import { useParams } from 'next/navigation'
import { useMatter } from '@/hooks/api.hooks'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { MatterOverview } from '@/components/matters/MatterOverview'
import { MatterDocuments } from '@/components/matters/MatterDocuments'
import { MatterTasks } from '@/components/matters/MatterTasks'
import { MatterHearings } from '@/components/matters/MatterHearings'
import { MatterTimeline } from '@/components/matters/MatterTimeline'
import { MatterAI } from '@/components/matters/MatterAI'
import { cn, MATTER_STATUS_COLORS, formatDate } from '@/lib/utils'
import { ArrowLeft, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function MatterDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading } = useMatter(id)
  const matter = (data as any)?.data

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 bg-muted rounded-xl" />
        <div className="h-10 bg-muted rounded-xl w-1/2" />
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    )
  }

  if (!matter) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        <p className="text-lg font-medium">Matter not found</p>
        <Link href="/matters" className="text-primary hover:underline text-sm mt-2 inline-block">
          ← Back to matters
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Back */}
      <Link href="/matters" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition">
        <ArrowLeft className="w-4 h-4" /> All Matters
      </Link>

      {/* Header card */}
      <div className="bg-card border rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-xl font-bold">{matter.title}</h1>
              <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0', MATTER_STATUS_COLORS[matter.status])}>
                {matter.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
              {matter.caseNumber && <span>📁 {matter.caseNumber}</span>}
              {matter.internalRef && <span>🔖 {matter.internalRef}</span>}
              {matter.court && <span>🏛️ {matter.court.name}, {matter.court.city}</span>}
              {matter.judgeName && <span>⚖️ Hon'ble {matter.judgeName}</span>}
              <span className="capitalize">📋 {matter.type.replace(/_/g, ' ').toLowerCase()}</span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-5 flex-shrink-0">
            <div className="text-center">
              <p className="text-xl font-bold">{matter._count?.documents ?? 0}</p>
              <p className="text-xs text-muted-foreground">Documents</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">{matter._count?.tasks ?? 0}</p>
              <p className="text-xs text-muted-foreground">Tasks</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">{matter._count?.hearings ?? 0}</p>
              <p className="text-xs text-muted-foreground">Hearings</p>
            </div>
            {matter.nextHearingDate && (
              <div className="text-center border-l pl-5">
                <div className="flex items-center gap-1 text-primary mb-0.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <p className="text-xs font-medium">Next Hearing</p>
                </div>
                <p className="text-sm font-bold">{formatDate(matter.nextHearingDate)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">
            Documents{matter._count?.documents > 0 ? ` (${matter._count.documents})` : ''}
          </TabsTrigger>
          <TabsTrigger value="tasks">
            Tasks{matter._count?.tasks > 0 ? ` (${matter._count.tasks})` : ''}
          </TabsTrigger>
          <TabsTrigger value="hearings">
            Hearings{matter._count?.hearings > 0 ? ` (${matter._count.hearings})` : ''}
          </TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="ai">🤖 AI Assistant</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <MatterOverview matter={matter} />
        </TabsContent>
        <TabsContent value="documents">
          <MatterDocuments matterId={id} />
        </TabsContent>
        <TabsContent value="tasks">
          <MatterTasks matterId={id} />
        </TabsContent>
        <TabsContent value="hearings">
          <MatterHearings matterId={id} />
        </TabsContent>
        <TabsContent value="timeline">
          <MatterTimeline matterId={id} />
        </TabsContent>
        <TabsContent value="ai">
          <MatterAI matterId={id} matter={matter} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
