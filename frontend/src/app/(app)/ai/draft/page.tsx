'use client'

import { useState } from 'react'
import { useMatters, useGenerateDraft, useResearch } from '@/hooks/api.hooks'
import { Brain, FileText, Search, Loader2, Copy, Check, ArrowRight } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const DRAFT_TYPES = [
  { value: 'affidavit', label: '📋 Affidavit in Evidence', description: 'Formal affidavit with verification clause' },
  { value: 'submission', label: '📝 Written Submissions', description: 'Structured arguments with case law citations' },
  { value: 'adjournment', label: '⏸️ Adjournment Application', description: 'Formal application for date adjournment' },
  { value: 'synopsis', label: '📄 Synopsis / Précis', description: '3-5 page case synopsis for court submission' },
]

export default function AIDraftingPage() {
  const { data: mattersData } = useMatters({ status: 'ACTIVE', pageSize: 50 })
  const matters = (mattersData as any)?.data?.data ?? []

  const [selectedMatter, setSelectedMatter] = useState('')
  const [draftType, setDraftType] = useState('submission')
  const [instructions, setInstructions] = useState('')
  const [output, setOutput] = useState('')
  const [copied, setCopied] = useState(false)

  const draftMutation = useGenerateDraft()

  const handleGenerate = async () => {
    if (!selectedMatter) return toast.error('Please select a matter')
    const res = await draftMutation.mutateAsync({ matterId: selectedMatter, type: draftType, instructions }) as any
    setOutput(res?.data?.output || '')
    toast.success('Draft generated!')
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" /> AI Drafting
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Generate legal documents powered by AI — affidavits, submissions, applications, synopsis
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — Configuration */}
        <div className="space-y-5">
          {/* Matter selector */}
          <div className="bg-card border rounded-xl p-5">
            <label className="block text-sm font-semibold mb-3">Select Matter</label>
            <select
              value={selectedMatter}
              onChange={e => setSelectedMatter(e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Choose a matter...</option>
              {matters.map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.title} {m.caseNumber ? `(${m.caseNumber})` : ''}
                </option>
              ))}
            </select>
            {matters.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2">No active matters found.</p>
            )}
          </div>

          {/* Draft type */}
          <div className="bg-card border rounded-xl p-5">
            <label className="block text-sm font-semibold mb-3">Document Type</label>
            <div className="space-y-2">
              {DRAFT_TYPES.map(({ value, label, description }) => (
                <button
                  key={value}
                  onClick={() => setDraftType(value)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg border transition',
                    draftType === value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-accent',
                  )}
                >
                  <p className={cn('text-sm font-medium', draftType === value && 'text-primary')}>{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-card border rounded-xl p-5">
            <label className="block text-sm font-semibold mb-2">Additional Instructions</label>
            <p className="text-xs text-muted-foreground mb-3">
              Guide the AI — mention specific legal arguments, relief sought, tone, or any special requirements.
            </p>
            <textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="e.g. Focus on limitation period argument under Section 5 of Limitation Act. Include prayer for interim stay. Use formal High Court style..."
              className="w-full border rounded-lg px-4 py-3 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30 min-h-28 resize-none"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={draftMutation.isPending || !selectedMatter}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition flex items-center justify-center gap-2 font-semibold text-sm"
          >
            {draftMutation.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" />Generating draft...</>
              : <><Brain className="w-4 h-4" />Generate Draft</>}
          </button>
        </div>

        {/* Right — Output */}
        <div className="bg-card border rounded-xl overflow-hidden flex flex-col" style={{ minHeight: '600px' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/30">
            <h3 className="font-semibold text-sm">Generated Draft</h3>
            {output && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy all'}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {draftMutation.isPending && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm">Drafting your document...</p>
                <p className="text-xs">This may take 15–30 seconds</p>
              </div>
            )}
            {output && !draftMutation.isPending && (
              <div className="prose-legal">
                <ReactMarkdown>{output}</ReactMarkdown>
              </div>
            )}
            {!output && !draftMutation.isPending && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                <FileText className="w-12 h-12 opacity-20" />
                <p className="text-sm font-medium text-foreground">Your draft will appear here</p>
                <p className="text-xs text-center max-w-xs">
                  Select a matter and document type on the left, then click Generate Draft
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
