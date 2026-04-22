'use client'

import { useState } from 'react'
import { useUpdateMatter, useAssignUser, useUsers, useCourts } from '@/hooks/api.hooks'
import { Edit, Save, X, Users, MapPin, Scale, Calendar } from 'lucide-react'
import { cn, formatDate, MATTER_STATUS_COLORS } from '@/lib/utils'
import { toast } from 'sonner'

const MATTER_TYPES = ['CIVIL','CRIMINAL','CONSTITUTIONAL','TAX','INTELLECTUAL_PROPERTY','ARBITRATION','FAMILY','CORPORATE','LABOUR','CONSUMER','OTHER']
const MATTER_STATUSES = ['ACTIVE','PENDING','CLOSED','ON_HOLD','ARCHIVED']

export function MatterOverview({ matter }: { matter: any }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    title: matter.title,
    caseNumber: matter.caseNumber || '',
    status: matter.status,
    type: matter.type,
    judgeName: matter.judgeName || '',
    benchNumber: matter.benchNumber || '',
    description: matter.description || '',
    reliefSought: matter.reliefSought || '',
    nextHearingDate: matter.nextHearingDate?.split('T')[0] || '',
    filingDate: matter.filingDate?.split('T')[0] || '',
  })

  const updateMatter = useUpdateMatter(matter.id)
  const { data: usersData } = useUsers()
  const { data: courtsData } = useCourts()
  const users = (usersData as any)?.data ?? []
  const courts = (courtsData as any)?.data ?? []

  const handleSave = async () => {
    await updateMatter.mutateAsync(form)
    setEditing(false)
    toast.success('Matter updated')
  }

  return (
    <div className="space-y-5">
      {/* Edit bar */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
          Matter Details
        </h3>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <Edit className="w-3.5 h-3.5" /> Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={updateMatter.isPending}
              className="flex items-center gap-1.5 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition"
            >
              <Save className="w-3.5 h-3.5" /> Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-1.5 text-sm border px-3 py-1.5 rounded-lg hover:bg-accent transition"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left column */}
        <div className="bg-card border rounded-xl p-5 space-y-4">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Scale className="w-4 h-4 text-primary" /> Case Information
          </h4>

          <Field
            label="Matter Title"
            value={form.title}
            editing={editing}
            onChange={v => setForm(f => ({ ...f, title: v }))}
          />
          <Field
            label="Case Number"
            value={form.caseNumber}
            editing={editing}
            placeholder="e.g. WP(C) 1234/2024"
            onChange={v => setForm(f => ({ ...f, caseNumber: v }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Status"
              value={form.status}
              options={MATTER_STATUSES}
              editing={editing}
              onChange={v => setForm(f => ({ ...f, status: v }))}
            />
            <SelectField
              label="Type"
              value={form.type}
              options={MATTER_TYPES}
              editing={editing}
              onChange={v => setForm(f => ({ ...f, type: v }))}
            />
          </div>
          <Field
            label="Description"
            value={form.description}
            editing={editing}
            multiline
            placeholder="Brief description of the matter..."
            onChange={v => setForm(f => ({ ...f, description: v }))}
          />
          <Field
            label="Relief Sought"
            value={form.reliefSought}
            editing={editing}
            multiline
            placeholder="Prayer / Relief sought..."
            onChange={v => setForm(f => ({ ...f, reliefSought: v }))}
          />
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <div className="bg-card border rounded-xl p-5 space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Court & Judge
            </h4>
            {editing ? (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Court</label>
                <select
                  value={matter.courtId || ''}
                  onChange={e => setForm(f => ({ ...f, courtId: e.target.value } as any))}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">No Court Selected</option>
                  {courts.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} — {c.city}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Court</p>
                <p className="text-sm font-medium">{matter.court ? `${matter.court.name}, ${matter.court.city}` : '—'}</p>
              </div>
            )}
            <Field label="Judge Name" value={form.judgeName} editing={editing} onChange={v => setForm(f => ({ ...f, judgeName: v }))} />
            <Field label="Bench Number" value={form.benchNumber} editing={editing} onChange={v => setForm(f => ({ ...f, benchNumber: v }))} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Filing Date" value={form.filingDate} editing={editing} type="date" onChange={v => setForm(f => ({ ...f, filingDate: v }))} />
              <Field label="Next Hearing" value={form.nextHearingDate} editing={editing} type="date" onChange={v => setForm(f => ({ ...f, nextHearingDate: v }))} />
            </div>
          </div>

          {/* Team */}
          <div className="bg-card border rounded-xl p-5">
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-primary" /> Team Members
            </h4>
            <div className="space-y-2">
              {matter.assignments?.map((a: any) => (
                <div key={a.userId} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground text-xs font-bold">
                      {a.user.firstName[0]}{a.user.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{a.user.firstName} {a.user.lastName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{a.role} · {a.user.role.replace('_', ' ').toLowerCase()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Parties */}
          <div className="bg-card border rounded-xl p-5">
            <h4 className="font-semibold text-sm mb-4">Parties</h4>
            <div className="space-y-2">
              {matter.parties?.map((p: any) => (
                <div key={p.id} className="flex items-start justify-between text-sm">
                  <div>
                    <span className="font-medium">{p.name}</span>
                    {p.counsel && <span className="text-muted-foreground text-xs ml-2">({p.counsel})</span>}
                  </div>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full capitalize',
                    p.type === 'PETITIONER' || p.type === 'APPELLANT' || p.type === 'PLAINTIFF'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-600'
                  )}>
                    {p.type.toLowerCase()}
                  </span>
                </div>
              ))}
              {(!matter.parties?.length) && (
                <p className="text-sm text-muted-foreground">No parties added yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  label, value, editing, onChange, multiline, placeholder, type = 'text',
}: {
  label: string; value: string; editing: boolean; onChange: (v: string) => void;
  multiline?: boolean; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      {editing ? (
        multiline ? (
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30 min-h-20 resize-none"
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30"
          />
        )
      ) : (
        <p className="text-sm">{value || <span className="text-muted-foreground">—</span>}</p>
      )}
    </div>
  )
}

function SelectField({
  label, value, options, editing, onChange,
}: {
  label: string; value: string; options: string[]; editing: boolean; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      {editing ? (
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30"
        >
          {options.map(o => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
        </select>
      ) : (
        <p className="text-sm capitalize">{value.replace('_', ' ').toLowerCase()}</p>
      )}
    </div>
  )
}
