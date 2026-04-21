'use client'

import { useState } from 'react'
import {
  useMatterHearings, useCreateHearing, useUpdateHearing, useAddHearingNote, useHearingPrep,
} from '@/hooks/api.hooks'
import { Calendar, Plus, ChevronDown, Brain, Loader2, MessageSquare, CheckCircle } from 'lucide-react'
import { cn, formatDateTime, formatDate } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'

const OUTCOMES = ['ARGUMENTS_HEARD','ADJOURNED','ORDER_PASSED','JUDGMENT_RESERVED','JUDGMENT_PRONOUNCED','DISMISSED','SETTLED']
const STATUSES = ['SCHEDULED','ADJOURNED','COMPLETED','CANCELLED']

export function MatterHearings({ matterId }: { matterId: string }) {
  const { data, isLoading } = useMatterHearings(matterId)
  const createHearing = useCreateHearing()
  const updateHearing = useUpdateHearing('')
  const hearingPrepMutation = useHearingPrep()

  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [prepResult, setPrepResult] = useState<Record<string, string>>({})
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    scheduledAt: '',
    courtRoom: '',
    purpose: '',
  })

  const hearings = data?.data ?? []

  const handleCreate = async () => {
    if (!form.scheduledAt) return toast.error('Please select a date')
    await createHearing.mutateAsync({ matterId, ...form })
    setForm({ scheduledAt: '', courtRoom: '', purpose: '' })
    setShowForm(false)
  }

  const handlePrepare = async (hearingId: string) => {
    const res = await hearingPrepMutation.mutateAsync(hearingId)
    setPrepResult(prev => ({ ...prev, [hearingId]: res.data?.output || '' }))
    toast.success('Hearing brief generated')
  }

  const statusColor: Record<string, string> = {
    SCHEDULED: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    ADJOURNED: 'bg-yellow-100 text-yellow-700',
    CANCELLED: 'bg-slate-100 text-slate-500',
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{hearings.length} Hearings</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition"
        >
          <Plus className="w-4 h-4" /> Schedule Hearing
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-card border rounded-xl p-5 space-y-3">
          <h4 className="font-semibold text-sm">Schedule New Hearing</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-muted-foreground mb-1">Date & Time</label>
              <input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Court Room</label>
              <input
                value={form.courtRoom}
                onChange={e => setForm(f => ({ ...f, courtRoom: e.target.value }))}
                placeholder="e.g. Court No. 5"
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Purpose / Stage</label>
            <input
              value={form.purpose}
              onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
              placeholder="e.g. Arguments on interim relief, Cross-examination..."
              className="w-full border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-accent transition">Cancel</button>
            <button
              onClick={handleCreate}
              disabled={createHearing.isPending}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition flex items-center gap-2"
            >
              {createHearing.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Schedule
            </button>
          </div>
        </div>
      )}

      {/* Hearings list */}
      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : hearings.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No hearings scheduled</p>
        </div>
      ) : (
        <div className="space-y-3">
          {hearings.map((h: any) => (
            <div key={h.id} className="bg-card border rounded-xl overflow-hidden">
              {/* Header row */}
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-accent/30 transition"
                onClick={() => setExpandedId(expandedId === h.id ? null : h.id)}
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold text-sm leading-none">
                    {new Date(h.scheduledAt).getDate()}
                  </span>
                  <span className="text-primary text-xs">
                    {new Date(h.scheduledAt).toLocaleString('default', { month: 'short' })}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">
                      {new Date(h.scheduledAt).toLocaleString('en-IN', {
                        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full', statusColor[h.status])}>
                      {h.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {h.purpose || 'General hearing'}
                    {h.courtRoom && ` · ${h.courtRoom}`}
                    {h.outcome && ` · ${h.outcome.replace('_', ' ')}`}
                  </p>
                </div>
                <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition', expandedId === h.id && 'rotate-180')} />
              </div>

              {/* Expanded */}
              {expandedId === h.id && (
                <div className="border-t p-4 space-y-4">
                  {/* Update outcome */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Outcome</label>
                      <select
                        defaultValue={h.outcome || ''}
                        onChange={async e => {
                          await updateHearing.mutateAsync({ id: h.id, outcome: e.target.value, status: 'COMPLETED' } as any)
                        }}
                        className="w-full border rounded-lg px-3 py-2 text-sm bg-background outline-none"
                      >
                        <option value="">Select outcome...</option>
                        {OUTCOMES.map(o => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Adjourned To</label>
                      <input
                        type="datetime-local"
                        defaultValue={h.adjournedTo?.split('.')[0] || ''}
                        onChange={async e => {
                          if (e.target.value) {
                            await updateHearing.mutateAsync({ id: h.id, adjournedTo: e.target.value, outcome: 'ADJOURNED', status: 'ADJOURNED' } as any)
                          }
                        }}
                        className="w-full border rounded-lg px-3 py-2 text-sm bg-background outline-none"
                      />
                    </div>
                  </div>

                  {h.summary && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Summary</p>
                      <p className="text-sm bg-muted rounded-lg px-3 py-2">{h.summary}</p>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> Notes ({h.notes?.length || 0})
                    </p>
                    <div className="space-y-2 mb-2">
                      {h.notes?.map((note: any) => (
                        <div key={note.id} className="bg-muted rounded-lg px-3 py-2 text-sm">
                          <p>{note.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            — {note.author?.firstName} {note.author?.lastName}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={noteInputs[h.id] || ''}
                        onChange={e => setNoteInputs(prev => ({ ...prev, [h.id]: e.target.value }))}
                        placeholder="Add a note..."
                        className="flex-1 border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>

                  {/* AI Prep */}
                  <div className="border-t pt-3">
                    <button
                      onClick={() => handlePrepare(h.id)}
                      disabled={hearingPrepMutation.isPending}
                      className="flex items-center gap-2 text-sm text-primary hover:underline font-medium"
                    >
                      {hearingPrepMutation.isPending
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Brain className="w-4 h-4" />}
                      Generate AI Hearing Brief
                    </button>
                    {prepResult[h.id] && (
                      <div className="mt-3 bg-muted rounded-xl p-4 prose-legal max-h-64 overflow-y-auto">
                        <ReactMarkdown>{prepResult[h.id]}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
