'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateMatter, useCourts } from '@/hooks/api.hooks'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

const MATTER_TYPES = ['CIVIL','CRIMINAL','CONSTITUTIONAL','TAX','INTELLECTUAL_PROPERTY','ARBITRATION','FAMILY','CORPORATE','LABOUR','CONSUMER','OTHER']

export default function NewMatterPage() {
  const router = useRouter()
  const createMatter = useCreateMatter()
  const { data: courtsData } = useCourts()
  const courts = (courtsData as any)?.data ?? []

  const [form, setForm] = useState({
    title: '',
    type: 'CIVIL',
    caseNumber: '',
    internalRef: '',
    courtId: '',
    judgeName: '',
    benchNumber: '',
    description: '',
    reliefSought: '',
    filingDate: '',
    nextHearingDate: '',
  })

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Title is required')
    const matter = await createMatter.mutateAsync(form) as any
    router.push(`/matters/${matter.data.id}`)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-4">
        <Link href="/matters" className="p-2 hover:bg-accent rounded-lg transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Matter</h1>
          <p className="text-sm text-muted-foreground">Create a new litigation matter</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Basic Information</h2>
          <div>
            <label className="block text-sm font-medium mb-1.5">Matter Title *</label>
            <input
              value={form.title}
              onChange={set('title')}
              required
              placeholder="e.g. M/s ABC Ltd. vs State of Maharashtra"
              className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Matter Type *</label>
              <select value={form.type} onChange={set('type')}
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30">
                {MATTER_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Case Number</label>
              <input value={form.caseNumber} onChange={set('caseNumber')}
                placeholder="e.g. WP(C) 1234/2024"
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Internal Reference</label>
            <input value={form.internalRef} onChange={set('internalRef')}
              placeholder="e.g. REF/2024/001"
              className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea value={form.description} onChange={set('description')}
              placeholder="Brief description of the matter..."
              className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30 min-h-24 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Relief Sought</label>
            <textarea value={form.reliefSought} onChange={set('reliefSought')}
              placeholder="Prayer / Relief sought from the court..."
              className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30 min-h-20 resize-none" />
          </div>
        </div>

        {/* Court Details */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Court Details</h2>
          <div>
            <label className="block text-sm font-medium mb-1.5">Court</label>
            <select value={form.courtId} onChange={set('courtId')}
              className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">Select court...</option>
              {courts.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name} — {c.city}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Judge Name</label>
              <input value={form.judgeName} onChange={set('judgeName')}
                placeholder="Hon'ble Justice..."
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Bench Number</label>
              <input value={form.benchNumber} onChange={set('benchNumber')}
                placeholder="e.g. DB-III"
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Filing Date</label>
              <input type="date" value={form.filingDate} onChange={set('filingDate')}
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Next Hearing Date</label>
              <input type="date" value={form.nextHearingDate} onChange={set('nextHearingDate')}
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Link href="/matters"
            className="px-6 py-2.5 border rounded-lg text-sm font-medium hover:bg-accent transition">
            Cancel
          </Link>
          <button type="submit" disabled={createMatter.isPending}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition">
            {createMatter.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Matter
          </button>
        </div>
      </form>
    </div>
  )
}
