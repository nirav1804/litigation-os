'use client'

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'
import { useMatterAnalytics, useProductivity } from '@/hooks/api.hooks'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { TrendingUp, FolderOpen, CheckSquare, Calendar, Brain, Clock, AlertTriangle } from 'lucide-react'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function AnalyticsPage() {
  const { data: mattersData } = useMatterAnalytics()
  const { data: prodData } = useProductivity(30)
  const { data: agingData } = useQuery({
    queryKey: ['analytics', 'aging'],
    queryFn: () => apiGet('/analytics/aging'),
  })

  const matters = (mattersData as any)?.data
  const prod = (prodData as any)?.data
  const aging = (agingData as any)?.data ?? []

  const agingBuckets = [
    { label: '0–30d',   count: aging.filter((m: any) => m.ageDays <= 30).length },
    { label: '31–90d',  count: aging.filter((m: any) => m.ageDays > 30 && m.ageDays <= 90).length },
    { label: '91–180d', count: aging.filter((m: any) => m.ageDays > 90 && m.ageDays <= 180).length },
    { label: '181–365d',count: aging.filter((m: any) => m.ageDays > 180 && m.ageDays <= 365).length },
    { label: '1–2 yrs', count: aging.filter((m: any) => m.ageDays > 365 && m.ageDays <= 730).length },
    { label: '2+ yrs',  count: aging.filter((m: any) => m.ageDays > 730).length },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Practice intelligence and caseload insights</p>
      </div>

      {/* Productivity */}
      {prod && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Tasks Completed', value: prod.tasksCompleted, icon: CheckSquare, color: 'text-green-500' },
            { label: 'Docs Uploaded', value: prod.documentsUploaded, icon: FolderOpen, color: 'text-blue-500' },
            { label: 'Hearings Done', value: prod.hearingsCompleted, icon: Calendar, color: 'text-purple-500' },
            { label: 'AI Outputs', value: prod.aiOutputs, icon: Brain, color: 'text-amber-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-card border rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{label}</span>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-3xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Last 30 days</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Status Pie */}
        {matters?.byStatus?.length > 0 && (
          <div className="bg-card border rounded-xl p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-primary" /> Matters by Status
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={matters.byStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={50} outerRadius={85}>
                  {matters.byStatus.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend formatter={(v) => String(v).toLowerCase()} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Type Bar */}
        {matters?.byType?.length > 0 && (
          <div className="bg-card border rounded-xl p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Matters by Type
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={matters.byType} margin={{ top: 5, right: 10, left: -20, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="type" tick={{ fontSize: 10 }} tickFormatter={v => v.replace('_',' ').substring(0,8)} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={l => String(l).replace('_',' ')} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Aging */}
        <div className="bg-card border rounded-xl p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Matter Aging Report
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={agingBuckets} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [v, 'Matters']} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {agingBuckets.map((b, i) => (
                  <Cell key={i} fill={i < 2 ? '#10b981' : i < 4 ? '#f59e0b' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {aging.filter((m: any) => m.ageDays > 365).length > 0 && (
            <div className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg px-4 py-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">
                <strong>{aging.filter((m: any) => m.ageDays > 365).length}</strong> matter(s) older than 1 year
              </p>
            </div>
          )}
        </div>

        {/* Summary */}
        {matters && (
          <div className="bg-card border rounded-xl p-5">
            <h3 className="font-semibold mb-4">Summary Statistics</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Matters', value: matters.total },
                { label: 'Active', value: matters.active, highlight: 'text-green-600' },
                { label: 'Pending', value: matters.pending || 0, highlight: 'text-yellow-600' },
                { label: 'Closed', value: matters.closed || 0, highlight: 'text-slate-500' },
                { label: 'New This Month', value: matters.createdThisMonth, highlight: 'text-blue-600' },
                { label: 'Closed This Month', value: matters.closedThisMonth, highlight: 'text-slate-500' },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="bg-muted rounded-xl p-4 text-center">
                  <p className={`text-2xl font-bold ${highlight || ''}`}>{value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
