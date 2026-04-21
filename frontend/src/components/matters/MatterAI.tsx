'use client'

import { useState, useRef, useEffect } from 'react'
import {
  useAIChat, useGenerateDraft, useResearch, useExtractChronology, useAIOutputs, useSummarize,
} from '@/hooks/api.hooks'
import { Brain, Send, FileText, Search, Clock, Loader2, Copy, Check, Zap } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'

type Tab = 'chat' | 'draft' | 'research' | 'history'

export function MatterAI({ matterId, matter }: { matterId: string; matter: any }) {
  const [activeTab, setActiveTab] = useState<Tab>('chat')
  const [chatInput, setChatInput] = useState('')
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string }>>([])
  const [draftType, setDraftType] = useState('submission')
  const [draftInstructions, setDraftInstructions] = useState('')
  const [researchQuery, setResearchQuery] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const chatMutation = useAIChat()
  const draftMutation = useGenerateDraft()
  const researchMutation = useResearch()
  const chronologyMutation = useExtractChronology()
  const { data: outputs, refetch: refetchOutputs } = useAIOutputs(matterId)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  const sendChat = async () => {
    if (!chatInput.trim() || chatMutation.isPending) return
    const question = chatInput
    setChatInput('')
    const newHistory = [...chatHistory, { role: 'user', content: question }]
    setChatHistory(newHistory)
    try {
      const res = await chatMutation.mutateAsync({ matterId, question, history: chatHistory })
      setChatHistory([...newHistory, { role: 'assistant', content: (res as any).data?.answer || '' }])
    } catch {}
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(null), 2000)
  }

  const TABS = [
    { id: 'chat' as Tab, label: 'Chat', icon: Brain },
    { id: 'draft' as Tab, label: 'Draft', icon: FileText },
    { id: 'research' as Tab, label: 'Research', icon: Search },
    { id: 'history' as Tab, label: 'History', icon: Clock },
  ]

  return (
    <div className="bg-card border rounded-xl overflow-hidden flex flex-col" style={{ minHeight: '70vh' }}>
      {/* Tab bar */}
      <div className="flex border-b bg-muted/30 flex-shrink-0">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition border-b-2 ${
              activeTab === id
                ? 'border-primary text-primary bg-background'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
        <div className="flex-1" />
        {/* Quick actions */}
        <button
          onClick={async () => {
            const res = await chronologyMutation.mutateAsync(matterId)
            setActiveTab('history')
            refetchOutputs()
            toast.success('Chronology extracted')
          }}
          disabled={chronologyMutation.isPending}
          className="flex items-center gap-1.5 px-4 py-3 text-xs text-muted-foreground hover:text-foreground transition"
          title="Extract chronology"
        >
          {chronologyMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
          Chronology
        </button>
      </div>

      {/* CHAT TAB */}
      {activeTab === 'chat' && (
        <div className="flex flex-col flex-1">
          <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ maxHeight: '55vh' }}>
            {chatHistory.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium text-foreground">Ask anything about this matter</p>
                <p className="text-sm mt-1">AI has context from all uploaded documents</p>
                <div className="mt-5 flex flex-wrap gap-2 justify-center">
                  {[
                    'Summarize the key facts',
                    'What are the main legal issues?',
                    'List all important dates',
                    'What relief is being sought?',
                  ].map(s => (
                    <button
                      key={s}
                      onClick={() => setChatInput(s)}
                      className="text-xs bg-accent px-3 py-1.5 rounded-full hover:bg-primary hover:text-primary-foreground transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted rounded-bl-sm prose-legal'
                }`}>
                  {msg.role === 'assistant'
                    ? <ReactMarkdown>{msg.content}</ReactMarkdown>
                    : msg.content}
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="border-t p-4 flex gap-3 flex-shrink-0">
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
              placeholder="Ask about this matter..."
              className="flex-1 bg-background border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={sendChat}
              disabled={chatMutation.isPending || !chatInput.trim()}
              className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-40 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* DRAFT TAB */}
      {activeTab === 'draft' && (
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'affidavit', label: '📋 Affidavit in Evidence' },
              { value: 'submission', label: '📝 Written Submissions' },
              { value: 'adjournment', label: '⏸️ Adjournment Application' },
              { value: 'synopsis', label: '📄 Synopsis / Précis' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setDraftType(value)}
                className={`p-4 rounded-xl border text-sm font-medium transition text-left ${
                  draftType === value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:bg-accent'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              Additional Instructions
            </label>
            <textarea
              value={draftInstructions}
              onChange={e => setDraftInstructions(e.target.value)}
              placeholder="e.g. Focus on limitation period argument, include prayer for interim stay, draft in formal High Court style..."
              className="w-full bg-background border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 min-h-24 resize-none"
            />
          </div>
          <button
            onClick={async () => {
              await draftMutation.mutateAsync({ matterId, type: draftType, instructions: draftInstructions })
              refetchOutputs()
              toast.success('Draft generated!')
            }}
            disabled={draftMutation.isPending}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition flex items-center justify-center gap-2 font-medium"
          >
            {draftMutation.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" />Generating draft...</>
              : <><FileText className="w-4 h-4" />Generate Draft</>}
          </button>
          {(draftMutation.data as any)?.data && (
            <div className="relative bg-muted rounded-xl p-5">
              <button
                onClick={() => handleCopy((draftMutation.data as any).data.output, 'draft')}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-background hover:bg-accent transition"
              >
                {copied === 'draft' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
              </button>
              <div className="prose-legal max-h-[400px] overflow-y-auto pr-6">
                <ReactMarkdown>{(draftMutation.data as any).data.output}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RESEARCH TAB */}
      {activeTab === 'research' && (
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex gap-3">
            <input
              value={researchQuery}
              onChange={e => setResearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && researchMutation.mutate({ matterId, query: researchQuery })}
              placeholder="e.g. Interim injunction under Order 39 CPC, grounds for anticipatory bail..."
              className="flex-1 bg-background border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={() => researchMutation.mutate({ matterId, query: researchQuery })}
              disabled={researchMutation.isPending || !researchQuery.trim()}
              className="bg-primary text-primary-foreground px-5 py-3 rounded-xl hover:bg-primary/90 disabled:opacity-40 transition flex items-center gap-2 font-medium whitespace-nowrap"
            >
              {researchMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Research
            </button>
          </div>

          {/* Quick research topics */}
          {!researchMutation.data && !researchMutation.isPending && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Quick research topics:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  'Res judicata under CPC',
                  'Fundamental rights Article 21',
                  'Section 9 Arbitration Act',
                  'Order 39 interim injunction',
                  'Natural justice principles India',
                  'Limitation Act Section 5',
                ].map(q => (
                  <button
                    key={q}
                    onClick={() => setResearchQuery(q)}
                    className="text-xs bg-accent px-3 py-1.5 rounded-full hover:bg-primary/10 hover:text-primary transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {researchMutation.isPending && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p>Researching Indian case law and statutes...</p>
              <p className="text-xs">This may take 15–30 seconds</p>
            </div>
          )}

          {(researchMutation.data as any)?.data && (
            <div className="relative bg-muted rounded-xl p-5">
              <button
                onClick={() => handleCopy((researchMutation.data as any).data.output, 'research')}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-background hover:bg-accent transition"
              >
                {copied === 'research' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
              </button>
              <div className="prose-legal max-h-[500px] overflow-y-auto pr-6">
                <ReactMarkdown>{(researchMutation.data as any).data.output}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {(outputs as any)?.data?.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No AI outputs saved yet for this matter</p>
            </div>
          )}
          {(outputs as any)?.data?.map((o: any) => (
            <div key={o.id} className="border rounded-xl overflow-hidden hover:border-primary/30 transition">
              <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                    {o.type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(o.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                  </span>
                  {o.generatedBy && (
                    <span className="text-xs text-muted-foreground">
                      · {o.generatedBy.firstName} {o.generatedBy.lastName}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleCopy(o.output, o.id)}
                  className="p-1.5 rounded-lg hover:bg-background transition"
                >
                  {copied === o.id
                    ? <Check className="w-3.5 h-3.5 text-green-500" />
                    : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                </button>
              </div>
              <div className="px-4 py-3">
                <p className="text-sm text-muted-foreground line-clamp-4">{o.output}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
