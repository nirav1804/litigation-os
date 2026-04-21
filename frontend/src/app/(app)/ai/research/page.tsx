'use client'

import { useState } from 'react'
import { useMatters, useResearch } from '@/hooks/api.hooks'
import { Search, Loader2, Copy, Check, BookOpen, Scale, Lightbulb } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const QUICK_QUERIES = [
  { label: 'Interim Injunction', query: 'Grounds for interim injunction under Order 39 Rule 1 & 2 CPC — balance of convenience, irreparable harm, prima facie case' },
  { label: 'Anticipatory Bail', query: 'Principles governing anticipatory bail under Section 438 CrPC — factors to consider, relevant Supreme Court judgments' },
  { label: 'Article 21 Rights', query: 'Right to life and personal liberty under Article 21 of the Constitution — scope, limitations, recent Supreme Court judgments' },
  { label: 'Res Judicata', query: 'Doctrine of res judicata under Section 11 CPC — ingredients, exceptions, landmark cases' },
  { label: 'Natural Justice', query: 'Principles of natural justice — audi alteram partem and nemo judex in causa sua in Indian administrative law' },
  { label: 'Limitation Act', query: 'Condonation of delay under Section 5 of the Limitation Act — sufficient cause, judicial discretion, key precedents' },
  { label: 'Specific Performance', query: 'Specific performance of contract under the Specific Relief Act 1963 — discretion of court, when granted or refused' },
  { label: 'Section 138 NI Act', query: 'Dishonour of cheque under Section 138 Negotiable Instruments Act — ingredients, presumption, defences available' },
]

export default function ResearchPage() {
  const { data: mattersData } = useMatters({ status: 'ACTIVE', pageSize: 50 })
  const matters = (mattersData as any)?.data?.data ?? []

  const [selectedMatter, setSelectedMatter] = useState('')
  const [query, setQuery] = useState('')
  const [output, setOutput] = useState('')
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<Array<{ query: string; output: string }>>([])

  const researchMutation = useResearch()

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query
    if (!q.trim()) return toast.error('Enter a research query')
    if (!selectedMatter) return toast.error('Select a matter to associate the research with')

    const res = await researchMutation.mutateAsync({ matterId: selectedMatter, query: q }) as any
    const result = res?.data?.output || ''
    setOutput(result)
    setHistory(h => [{ query: q, output: result }, ...h].slice(0, 10))
    if (searchQuery) setQuery(searchQuery)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    toast.success('Research copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Search className="w-6 h-6 text-primary" /> Legal Research
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          AI-powered Indian legal research — case law, statutes, principles, arguments
        </p>
      </div>

      {/* Search bar */}
      <div className="bg-card border rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Associate with Matter</label>
            <select
              value={selectedMatter}
              onChange={e => setSelectedMatter(e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Select matter...</option>
              {matters.map((m: any) => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Research Query</label>
            <div className="flex gap-2">
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="e.g. Grounds for anticipatory bail, interim injunction under CPC..."
                className="flex-1 border rounded-lg px-4 py-2.5 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={() => handleSearch()}
                disabled={researchMutation.isPending || !query.trim() || !selectedMatter}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition whitespace-nowrap"
              >
                {researchMutation.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Search className="w-4 h-4" />}
                Research
              </button>
            </div>
          </div>
        </div>

        {/* Quick topics */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5" /> Quick research topics
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_QUERIES.map(({ label, query: q }) => (
              <button
                key={label}
                onClick={() => { setQuery(q); handleSearch(q) }}
                disabled={!selectedMatter}
                className="text-xs bg-muted hover:bg-primary/10 hover:text-primary disabled:opacity-40 px-3 py-1.5 rounded-full transition"
              >
                {label}
              </button>
            ))}
          </div>
          {!selectedMatter && (
            <p className="text-xs text-amber-600 mt-1">⚠️ Select a matter above to enable quick search</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main output */}
        <div className="lg:col-span-2 bg-card border rounded-xl overflow-hidden flex flex-col" style={{ minHeight: '500px' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/30">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" /> Research Results
            </h3>
            {output && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {researchMutation.isPending && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm">Researching Indian case law and statutes...</p>
                <p className="text-xs">This may take 20–40 seconds</p>
              </div>
            )}
            {output && !researchMutation.isPending && (
              <div className="prose-legal">
                <ReactMarkdown>{output}</ReactMarkdown>
              </div>
            )}
            {!output && !researchMutation.isPending && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                <BookOpen className="w-12 h-12 opacity-20" />
                <p className="text-sm font-medium text-foreground">Enter a research query to get started</p>
                <p className="text-xs text-center max-w-xs">
                  Get comprehensive analysis of Indian case law, statutes, and legal principles
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Research history */}
        <div className="bg-card border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h3 className="font-semibold text-sm">Recent Searches</h3>
          </div>
          <div className="divide-y overflow-y-auto max-h-[500px]">
            {history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No searches yet
              </div>
            ) : (
              history.map((h, i) => (
                <button
                  key={i}
                  onClick={() => { setQuery(h.query); setOutput(h.output) }}
                  className="w-full text-left px-4 py-3 hover:bg-accent/40 transition"
                >
                  <p className="text-sm font-medium line-clamp-2">{h.query}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {h.output.substring(0, 80)}...
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
