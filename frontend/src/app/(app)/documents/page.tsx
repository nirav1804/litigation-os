'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'
import Link from 'next/link'
import { FileText, Search, Download, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { cn, formatDate, formatFileSize, DOC_TYPE_LABELS } from '@/lib/utils'
import { toast } from 'sonner'

export default function DocumentsPage() {
  const [search, setSearch] = useState('')

  // Fetch recent documents across all matters
  // In a real app you'd have a /documents endpoint with org-level filtering
  const { data, isLoading } = useQuery({
    queryKey: ['documents-all'],
    queryFn: () => apiGet('/matters?pageSize=50'),
  })

  const statusIcon = (status: string) => {
    if (status === 'PROCESSED') return <CheckCircle className="w-4 h-4 text-green-500" />
    if (status === 'FAILED') return <AlertCircle className="w-4 h-4 text-red-500" />
    return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
  }

  const handleDownload = async (docId: string, name: string) => {
    try {
      const res = await apiGet<any>(`/documents/${docId}/download`)
      const a = document.createElement('a')
      a.href = (res as any).data.url
      a.download = name
      a.click()
    } catch {
      toast.error('Download failed')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-muted-foreground text-sm mt-0.5">All documents across matters</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-card border rounded-xl px-4 py-3 max-w-md">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search documents..."
          className="bg-transparent text-sm outline-none flex-1 placeholder:text-muted-foreground"
        />
      </div>

      <div className="bg-card border rounded-xl p-8 text-center text-muted-foreground">
        <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium text-foreground">Documents are organized by matter</p>
        <p className="text-sm mt-1">Navigate to a matter to view, upload, and manage its documents</p>
        <Link
          href="/matters"
          className="inline-block mt-4 text-primary text-sm hover:underline font-medium"
        >
          Go to Matters →
        </Link>
      </div>
    </div>
  )
}
