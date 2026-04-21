'use client'

import Link from 'next/link'
import { Brain, FileText, Search, Calendar, Zap, ArrowRight } from 'lucide-react'
import { useMatters } from '@/hooks/api.hooks'

export default function AIPage() {
  const { data } = useMatters({ status: 'ACTIVE', pageSize: 10 })
  const matters = (data as any)?.data?.data ?? []

  const features = [
    {
      icon: Brain,
      title: 'AI Chat',
      description: 'Chat with AI about any matter using context from all your uploaded documents.',
      color: 'bg-blue-500',
      action: 'Select a matter →',
    },
    {
      icon: FileText,
      title: 'Draft Generator',
      description: 'Generate affidavits, written submissions, adjournment applications, and synopsis.',
      color: 'bg-purple-500',
      action: 'Select a matter →',
    },
    {
      icon: Search,
      title: 'Legal Research',
      description: 'AI-powered research with Indian case law citations (SCC, AIR) and statutory provisions.',
      color: 'bg-green-500',
      action: 'Select a matter →',
    },
    {
      icon: Calendar,
      title: 'Hearing Preparation',
      description: 'Generate comprehensive hearing briefs with arguments, anticipated questions, and checklists.',
      color: 'bg-amber-500',
      action: 'Select a matter →',
    },
    {
      icon: Zap,
      title: 'Chronology Extraction',
      description: 'Automatically extract a timeline of events from all documents in a matter.',
      color: 'bg-red-500',
      action: 'Select a matter →',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">AI Assistant</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          AI-powered tools for Indian litigation — select a matter to begin
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map(({ icon: Icon, title, description, color }) => (
          <div key={title} className="bg-card border rounded-xl p-5 hover:shadow-md transition">
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-4`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        ))}
      </div>

      {/* Active matters quick access */}
      <div className="bg-card border rounded-xl">
        <div className="px-5 py-4 border-b">
          <h3 className="font-semibold">Jump to a Matter's AI Assistant</h3>
          <p className="text-sm text-muted-foreground mt-0.5">All AI features are available inside each matter</p>
        </div>
        <div className="divide-y">
          {matters.map((m: any) => (
            <Link
              key={m.id}
              href={`/matters/${m.id}?tab=ai`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-accent/40 transition group"
            >
              <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium group-hover:text-primary transition truncate">{m.title}</p>
                <p className="text-xs text-muted-foreground">
                  {m.caseNumber || 'No case number'} · {m.type}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition flex-shrink-0" />
            </Link>
          ))}
          {matters.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No active matters found.</p>
              <Link href="/matters/new" className="text-primary text-sm hover:underline mt-1 inline-block">
                Create a matter →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
