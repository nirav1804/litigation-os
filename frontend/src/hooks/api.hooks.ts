import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiPatch, apiDelete, apiUpload } from '@/lib/api'
import { toast } from 'sonner'

// ─── MATTERS ─────────────────────────────────────────────────────────────────

export const useMatters = (params?: any) =>
  useQuery({
    queryKey: ['matters', params],
    queryFn: () => apiGet('/matters', params),
  })

export const useMatter = (id: string) =>
  useQuery({
    queryKey: ['matters', id],
    queryFn: () => apiGet(`/matters/${id}`),
    enabled: !!id,
  })

export const useMatterStats = () =>
  useQuery({
    queryKey: ['matters', 'stats'],
    queryFn: () => apiGet('/matters/stats'),
  })

export const useMatterTimeline = (matterId: string) =>
  useQuery({
    queryKey: ['matters', matterId, 'timeline'],
    queryFn: () => apiGet(`/matters/${matterId}/timeline`),
    enabled: !!matterId,
  })

export const useMatterNotes = (matterId: string) =>
  useQuery({
    queryKey: ['matters', matterId, 'notes'],
    queryFn: () => apiGet(`/matters/${matterId}/notes`),
    enabled: !!matterId,
  })

export const useCreateMatter = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => apiPost('/matters', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['matters'] })
      toast.success('Matter created successfully')
    },
    onError: (e: any) => toast.error(e.message),
  })
}

export const useUpdateMatter = (id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => apiPatch(`/matters/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['matters', id] })
      qc.invalidateQueries({ queryKey: ['matters'] })
      toast.success('Matter updated')
    },
    onError: (e: any) => toast.error(e.message),
  })
}

export const useAssignUser = (matterId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { userId: string; role: string }) =>
      apiPost(`/matters/${matterId}/assignments`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['matters', matterId] })
      toast.success('User assigned')
    },
    onError: (e: any) => toast.error(e.message),
  })
}

export const useAddNote = (matterId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { content: string; isPrivate: boolean }) =>
      apiPost(`/matters/${matterId}/notes`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['matters', matterId, 'notes'] })
    },
    onError: (e: any) => toast.error(e.message),
  })
}

// ─── DOCUMENTS ────────────────────────────────────────────────────────────────

export const useMatterDocuments = (matterId: string) =>
  useQuery({
    queryKey: ['documents', 'matter', matterId],
    queryFn: () => apiGet(`/documents/matter/${matterId}`),
    enabled: !!matterId,
  })

export const useDocument = (id: string) =>
  useQuery({
    queryKey: ['documents', id],
    queryFn: () => apiGet(`/documents/${id}`),
    enabled: !!id,
  })

export const useUploadDocument = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) => apiUpload('/documents/upload', formData),
    onSuccess: (_data, vars) => {
      const matterId = vars.get('matterId') as string
      qc.invalidateQueries({ queryKey: ['documents', 'matter', matterId] })
      toast.success('Document uploaded and processing started')
    },
    onError: (e: any) => toast.error(e.message),
  })
}

export const useDocumentDownloadUrl = (id: string) =>
  useQuery({
    queryKey: ['documents', id, 'download'],
    queryFn: () => apiGet<{ url: string }>(`/documents/${id}/download`),
    enabled: false, // manual trigger
  })

// ─── TASKS ────────────────────────────────────────────────────────────────────

export const useMatterTasks = (matterId: string, filters?: any) =>
  useQuery({
    queryKey: ['tasks', 'matter', matterId, filters],
    queryFn: () => apiGet(`/tasks/matter/${matterId}`, filters),
    enabled: !!matterId,
  })

export const useMyTasks = (filters?: any) =>
  useQuery({
    queryKey: ['tasks', 'my', filters],
    queryFn: () => apiGet('/tasks/my', filters),
  })

export const useUpcomingTasks = (days?: number) =>
  useQuery({
    queryKey: ['tasks', 'upcoming', days],
    queryFn: () => apiGet('/tasks/upcoming', { days }),
  })

export const useCreateTask = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => apiPost('/tasks', data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['tasks', 'matter', vars.matterId] })
      qc.invalidateQueries({ queryKey: ['tasks', 'my'] })
      toast.success('Task created')
    },
    onError: (e: any) => toast.error(e.message),
  })
}

export const useUpdateTask = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: any) => apiPatch(`/tasks/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (e: any) => toast.error(e.message),
  })
}

export const useDeleteTask = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/tasks/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task deleted')
    },
    onError: (e: any) => toast.error(e.message),
  })
}

// ─── HEARINGS ────────────────────────────────────────────────────────────────

export const useMatterHearings = (matterId: string) =>
  useQuery({
    queryKey: ['hearings', 'matter', matterId],
    queryFn: () => apiGet(`/hearings/matter/${matterId}`),
    enabled: !!matterId,
  })

export const useHearing = (id: string) =>
  useQuery({
    queryKey: ['hearings', id],
    queryFn: () => apiGet(`/hearings/${id}`),
    enabled: !!id,
  })

export const useUpcomingHearings = (days?: number) =>
  useQuery({
    queryKey: ['hearings', 'upcoming', days],
    queryFn: () => apiGet('/hearings/upcoming', { days }),
  })

export const useCreateHearing = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => apiPost('/hearings', data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['hearings', 'matter', vars.matterId] })
      qc.invalidateQueries({ queryKey: ['hearings', 'upcoming'] })
      qc.invalidateQueries({ queryKey: ['matters', vars.matterId] })
      toast.success('Hearing scheduled')
    },
    onError: (e: any) => toast.error(e.message),
  })
}

export const useUpdateHearing = (id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => apiPatch(`/hearings/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hearings', id] })
      qc.invalidateQueries({ queryKey: ['hearings'] })
      toast.success('Hearing updated')
    },
    onError: (e: any) => toast.error(e.message),
  })
}

export const useAddHearingNote = (hearingId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { content: string; isPrivate: boolean }) =>
      apiPost(`/hearings/${hearingId}/notes`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hearings', hearingId] })
    },
    onError: (e: any) => toast.error(e.message),
  })
}

// ─── AI ───────────────────────────────────────────────────────────────────────

export const useAIOutputs = (matterId: string, type?: string) =>
  useQuery({
    queryKey: ['ai', 'outputs', matterId, type],
    queryFn: () => apiGet(`/ai/outputs/${matterId}`, type ? { type } : undefined),
    enabled: !!matterId,
  })

export const useSummarize = () =>
  useMutation({
    mutationFn: (documentId: string) => apiPost(`/ai/summarize/${documentId}`),
    onError: (e: any) => toast.error(e.message),
  })

export const useExtractChronology = () =>
  useMutation({
    mutationFn: (matterId: string) => apiPost(`/ai/chronology/${matterId}`),
    onError: (e: any) => toast.error(e.message),
  })

export const useGenerateDraft = () =>
  useMutation({
    mutationFn: ({
      matterId,
      type,
      instructions,
    }: {
      matterId: string
      type: string
      instructions: string
    }) => apiPost(`/ai/draft/${matterId}`, { type, instructions }),
    onError: (e: any) => toast.error(e.message),
  })

export const useResearch = () =>
  useMutation({
    mutationFn: ({ matterId, query }: { matterId: string; query: string }) =>
      apiPost(`/ai/research/${matterId}`, { query }),
    onError: (e: any) => toast.error(e.message),
  })

export const useHearingPrep = () =>
  useMutation({
    mutationFn: (hearingId: string) => apiPost(`/ai/hearing-prep/${hearingId}`),
    onError: (e: any) => toast.error(e.message),
  })

export const useAIChat = () =>
  useMutation({
    mutationFn: ({
      matterId,
      question,
      history,
    }: {
      matterId: string
      question: string
      history: any[]
    }) => apiPost(`/ai/chat/${matterId}`, { question, history }),
    onError: (e: any) => toast.error(e.message),
  })

// ─── ANALYTICS ───────────────────────────────────────────────────────────────

export const useDashboard = () =>
  useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => apiGet('/analytics/dashboard'),
    staleTime: 60 * 1000,
  })

export const useMatterAnalytics = () =>
  useQuery({
    queryKey: ['analytics', 'matters'],
    queryFn: () => apiGet('/analytics/matters'),
  })

export const useProductivity = (days?: number) =>
  useQuery({
    queryKey: ['analytics', 'productivity', days],
    queryFn: () => apiGet('/analytics/productivity', { days }),
  })

// ─── USERS ────────────────────────────────────────────────────────────────────

export const useUsers = () =>
  useQuery({
    queryKey: ['users'],
    queryFn: () => apiGet('/users'),
  })

export const useInviteUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { email: string; role: string }) => apiPost('/users/invite', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('User invited successfully')
    },
    onError: (e: any) => toast.error(e.message),
  })
}

// ─── COURTS ───────────────────────────────────────────────────────────────────

export const useCourts = () =>
  useQuery({
    queryKey: ['courts'],
    queryFn: () => apiGet('/organizations/courts'),
  })

// ─── AUTH ────────────────────────────────────────────────────────────────────

export const useAuthProfile = () =>
  useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: () => apiGet('/auth/profile'),
  })
