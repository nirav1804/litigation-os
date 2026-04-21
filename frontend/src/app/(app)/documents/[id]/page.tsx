'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useDocument } from '@/hooks/api.hooks'
import { useMutation } from '@tanstack/react-query'
import { apiGet, apiPost } from '@/lib/api'
import {
  ArrowLeft, Download, FileText, Brain, Loader2, CheckCircle,
  AlertCircle, Clock, Tag, User, Calendar, Copy, Check,
} from 'lucide-react'
import Link from 'next/link'
import { cn, formatDate, formatFileSize, DOC_TYPE_LABELS } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'

export default function DocumentViewerPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data, isLoading } = useDocument(id)
  const doc = (data as any)?.data

  const [aiOutput, setAiOutput] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'text' | 'extracted' | 'ai'>('text')

  const summarizeMutation = useMutation({
    mutationFn: () => apiPost(`/ai/summarize/${id}`),
    onSuccess: (res: any) => {
      setAiOutput(res?.data?.output || '')
      setActiveTab('ai')
      toast.success('Summary generated')
    },
    onError: (e: any) => toast.error(e.message),
  })

  const handleDownload = async () => {
    try {
      const res = await apiGet<any>(`/documents/${id}/download`)
      const a = document.createElement('a')
      a.href = (res as any).data.url
      a.download = doc?.originalName || 'document'
      a.click()
    } catch {
      toast.error('Download failed')
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const statusIcon = (status: string) => {
    if (status === 'PROCESSED') return <CheckCircle className="w-4 h-4 text-green-500" />
    if (status === 'FAILED') return <AlertCircle className="w-4 h-4 text-red-500" />
    return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
  }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-12 bg-muted rounded-xl" />
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium text-foreground">Document not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Back */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        {doc.matter && (
          <>
            <span className="text-muted-foreground/40">/</span>
            <Link href={`/matters/${doc.matter.id}`} className="text-sm text-primary hover:underline">
              {doc.matter.title}
            </Link>
          </>
        )}
      </div>

      {/* Document header */}
      <div className="bg-card border rounded-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold mb-1">{doc.name}</h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" />
                  {DOC_TYPE_LABELS[doc.documentType] || doc.documentType}
                </span>
                <span>{formatFileSize(doc.size)}</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(doc.createdAt)}
                </span>
                {doc.uploadedBy && (
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}
                  </span>
                )}
                {doc.version > 1 && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                    v{doc.version}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1.5 text-sm">
              {statusIcon(doc.status)}
              <span className="text-muted-foreground capitalize">{doc.status.toLowerCase()}</span>
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 border px-3 py-2 rounded-lg text-sm hover:bg-accent transition"
            >
              <Download className="w-4 h-4" /> Download
            </button>
            <button
              onClick={() => summarizeMutation.mutate()}
              disabled={summarizeMutation.isPending || !doc.ocrText}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50 transition"
              title={!doc.ocrText ? 'No text available to summarize' : 'Generate AI summary'}
            >
              {summarizeMutation.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Brain className="w-4 h-4" />}
              AI Summary
            </button>
          </div>
        </div>

        {/* Tags */}
        {doc.tags?.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {doc.tags.map((tag: string) => (
              <span key={tag} className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content tabs */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="flex border-b">
          {[
            { id: 'text', label: 'Extracted Text' },
            { id: 'extracted', label: 'Extracted Data' },
            { id: 'ai', label: 'AI Summary' },
          ].map(({ id: tabId, label }) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId as any)}
              className={cn(
                'px-5 py-3 text-sm font-medium border-b-2 transition',
                activeTab === tabId
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* TEXT TAB */}
          {activeTab === 'text' && (
            <div>
              {doc.ocrText ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-muted-foreground">
                      {doc.ocrText.length.toLocaleString()} characters extracted
                    </p>
                    <button
                      onClick={() => handleCopy(doc.ocrText)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy all
                    </button>
                  </div>
                  <pre className="text-sm bg-muted rounded-xl p-5 overflow-auto max-h-[60vh] whitespace-pre-wrap font-mono leading-relaxed">
                    {doc.ocrText}
                  </pre>
                </>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium text-foreground">No text extracted</p>
                  <p className="text-sm mt-1">
                    {doc.status === 'PROCESSING'
                      ? 'Document is still being processed...'
                      : doc.status === 'FAILED'
                      ? 'Processing failed. Try re-uploading the document.'
                      : 'Upload a text-based PDF or .txt file for text extraction.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* EXTRACTED DATA TAB */}
          {activeTab === 'extracted' && (
            <div className="space-y-5">
              {/* Parties */}
              {doc.extractedParties?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full" />
                    Parties ({doc.extractedParties.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {doc.extractedParties.map((p: any, i: number) => (
                      <div key={i} className="bg-muted rounded-lg p-3 text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{p.name}</span>
                          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded capitalize">
                            {p.role}
                          </span>
                        </div>
                        {p.address && <p className="text-xs text-muted-foreground">{p.address}</p>}
                        {p.counsel && <p className="text-xs text-muted-foreground">Counsel: {p.counsel}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dates */}
              {doc.extractedDates?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    Key Dates ({doc.extractedDates.length})
                  </h3>
                  <div className="space-y-2">
                    {doc.extractedDates.map((d: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 bg-muted rounded-lg p-3 text-sm">
                        <span className="font-mono text-primary font-medium flex-shrink-0">{d.date}</span>
                        <div>
                          <span className="text-muted-foreground">{d.context}</span>
                          <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded capitalize">
                            {d.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              {doc.extractedMetadata && Object.keys(doc.extractedMetadata).some(k => doc.extractedMetadata[k]) && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full" />
                    Metadata
                  </h3>
                  <div className="bg-muted rounded-lg p-4 grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(doc.extractedMetadata).map(([k, v]) =>
                      v ? (
                        <div key={k}>
                          <span className="text-muted-foreground capitalize">{k.replace(/([A-Z])/g, ' $1')}: </span>
                          <span className="font-medium">{String(v)}</span>
                        </div>
                      ) : null,
                    )}
                  </div>
                </div>
              )}

              {!doc.extractedParties?.length && !doc.extractedDates?.length && (
                <div className="text-center py-16 text-muted-foreground">
                  <p className="font-medium text-foreground">No data extracted yet</p>
                  <p className="text-sm mt-1">Data is extracted automatically after document processing completes.</p>
                </div>
              )}
            </div>
          )}

          {/* AI SUMMARY TAB */}
          {activeTab === 'ai' && (
            <div>
              {summarizeMutation.isPending && (
                <div className="flex items-center gap-3 justify-center py-16 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <p>Generating AI summary...</p>
                </div>
              )}
              {aiOutput && (
                <div className="relative">
                  <button
                    onClick={() => handleCopy(aiOutput)}
                    className="absolute top-0 right-0 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy
                  </button>
                  <div className="prose-legal max-h-[60vh] overflow-y-auto pr-8">
                    <ReactMarkdown>{aiOutput}</ReactMarkdown>
                  </div>
                </div>
              )}
              {!aiOutput && !summarizeMutation.isPending && (
                <div className="text-center py-16 text-muted-foreground">
                  <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium text-foreground">No AI summary yet</p>
                  <p className="text-sm mt-1">
                    {doc.ocrText
                      ? 'Click "AI Summary" above to generate one.'
                      : 'No text available to summarize.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
