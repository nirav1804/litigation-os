'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useMatterDocuments, useUploadDocument } from '@/hooks/api.hooks'
import {
  Upload, FileText, Download, Loader2, CheckCircle, AlertCircle,
  Eye, MoreVertical, Tag,
} from 'lucide-react'
import { cn, formatDate, formatFileSize, DOC_TYPE_LABELS } from '@/lib/utils'
import { apiGet } from '@/lib/api'
import { toast } from 'sonner'

const DOC_TYPES = Object.keys(DOC_TYPE_LABELS)

export function MatterDocuments({ matterId }: { matterId: string }) {
  const { data, isLoading, refetch } = useMatterDocuments(matterId)
  const uploadMutation = useUploadDocument()
  const [uploading, setUploading] = useState(false)
  const [docType, setDocType] = useState('OTHER')
  const [description, setDescription] = useState('')

  const docs = data?.data ?? []

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('matterId', matterId)
      formData.append('documentType', docType)
      formData.append('description', description || file.name)
      await uploadMutation.mutateAsync(formData)
    }
    setDescription('')
  }, [matterId, docType, description])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/tiff': ['.tif', '.tiff'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 50 * 1024 * 1024,
  })

  const handleDownload = async (docId: string, name: string) => {
    try {
      const res = await apiGet<any>(`/documents/${docId}/download`)
      const a = document.createElement('a')
      a.href = res.data.url
      a.download = name
      a.click()
    } catch {
      toast.error('Download failed')
    }
  }

  const statusIcon = (status: string) => {
    if (status === 'PROCESSED') return <CheckCircle className="w-4 h-4 text-green-500" />
    if (status === 'FAILED') return <AlertCircle className="w-4 h-4 text-red-500" />
    return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
  }

  return (
    <div className="space-y-5">
      {/* Upload Area */}
      <div className="bg-card border rounded-xl p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Upload className="w-4 h-4 text-primary" /> Upload Documents
        </h3>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Document Type</label>
            <select
              value={docType}
              onChange={e => setDocType(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30"
            >
              {DOC_TYPES.map(t => (
                <option key={t} value={t}>{DOC_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Description (optional)</label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Plaint dated 01-Jan-2024"
              className="w-full border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition',
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/40 hover:bg-accent/30',
          )}
        >
          <input {...getInputProps()} />
          <Upload className={cn('w-8 h-8 mx-auto mb-3', isDragActive ? 'text-primary' : 'text-muted-foreground')} />
          <p className="font-medium text-sm">
            {isDragActive ? 'Drop files here...' : 'Drag & drop files here'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF, Word, JPEG, PNG, TIFF · Max 50MB per file
          </p>
          <button
            type="button"
            className="mt-3 text-xs text-primary hover:underline"
          >
            or click to browse
          </button>
        </div>

        {uploadMutation.isPending && (
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Uploading and processing...
          </div>
        )}
      </div>

      {/* Document List */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">{docs.length} Documents</h3>
          <button onClick={() => refetch()} className="text-xs text-primary hover:underline">
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No documents uploaded yet</p>
            <p className="text-sm mt-1">Upload your first document above</p>
          </div>
        ) : (
          <div className="divide-y">
            {docs.map((doc: any) => (
              <div key={doc.id} className="flex items-center gap-4 px-5 py-4 hover:bg-accent/30 transition">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex-shrink-0">
                      {DOC_TYPE_LABELS[doc.documentType] || doc.documentType}
                    </span>
                    {doc.version > 1 && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full flex-shrink-0">
                        v{doc.version}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                    <span>{formatFileSize(doc.size)}</span>
                    <span>·</span>
                    <span>{formatDate(doc.createdAt)}</span>
                    <span>·</span>
                    <span>{doc.uploadedBy?.firstName} {doc.uploadedBy?.lastName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div title={`Status: ${doc.status}`}>{statusIcon(doc.status)}</div>
                  {doc.status === 'PROCESSED' && (
                    <button
                      onClick={() => handleDownload(doc.id, doc.originalName)}
                      className="p-1.5 rounded-lg hover:bg-accent transition text-muted-foreground hover:text-foreground"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
