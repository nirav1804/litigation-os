'use client'

import { useState } from 'react'
import { useUsers, useInviteUser, useCourts } from '@/hooks/api.hooks'
import {
  Users, Plus, Building2, Scale, Mail, Shield, Loader2, Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const ROLES = ['ADMIN', 'SENIOR_LAWYER', 'ASSOCIATE', 'CLERK', 'CLIENT']

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  SENIOR_LAWYER: 'bg-purple-100 text-purple-700',
  ASSOCIATE: 'bg-blue-100 text-blue-700',
  CLERK: 'bg-green-100 text-green-700',
  CLIENT: 'bg-amber-100 text-amber-700',
}

export default function AdminPage() {
  const { data: usersData, isLoading } = useUsers()
  const { data: courtsData } = useCourts()
  const inviteUser = useInviteUser()

  const [activeTab, setActiveTab] = useState<'users' | 'courts'>('users')
  const [showInvite, setShowInvite] = useState(false)
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'ASSOCIATE' })

  const users = (usersData as any)?.data ?? []
  const courts = (courtsData as any)?.data ?? []

  const handleInvite = async () => {
    if (!inviteForm.email) return
    await inviteUser.mutateAsync(inviteForm)
    setInviteForm({ email: '', role: 'ASSOCIATE' })
    setShowInvite(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage your organization</p>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 border-b">
        {[
          { id: 'users', label: 'Team Members', icon: Users },
          { id: 'courts', label: 'Courts', icon: Scale },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition',
              activeTab === id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{users.length} team members</p>
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition"
            >
              <Plus className="w-4 h-4" /> Invite Member
            </button>
          </div>

          {showInvite && (
            <div className="bg-card border rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-sm">Invite Team Member</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Email Address</label>
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="advocate@firm.in"
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Role</label>
                  <select
                    value={inviteForm.role}
                    onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background outline-none"
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowInvite(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-accent transition">Cancel</button>
                <button
                  onClick={handleInvite}
                  disabled={inviteUser.isPending || !inviteForm.email}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition"
                >
                  {inviteUser.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Send Invite
                </button>
              </div>
            </div>
          )}

          <div className="bg-card border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Member</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Role</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 hidden md:table-cell">Bar No.</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 hidden md:table-cell">Last Login</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <td key={j} className="px-5 py-4">
                            <div className="h-4 bg-muted rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : users.map((u: any) => (
                      <tr key={u.id} className="hover:bg-accent/30 transition">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                              <span className="text-primary-foreground text-xs font-bold">
                                {u.firstName[0]}{u.lastName[0]}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium">{u.firstName} {u.lastName}</p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', ROLE_COLORS[u.role])}>
                            {u.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          <span className="text-sm text-muted-foreground">{u.barNumber || '—'}</span>
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          <span className="text-sm text-muted-foreground">
                            {u.lastLoginAt
                              ? new Date(u.lastLoginAt).toLocaleDateString('en-IN')
                              : 'Never'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full',
                            u.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500',
                          )}>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COURTS TAB */}
      {activeTab === 'courts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{courts.length} courts configured</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courts.map((c: any) => (
              <div key={c.id} className="bg-card border rounded-xl p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{c.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.city}, {c.state}</p>
                  </div>
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex-shrink-0">
                    {c.courtType}
                  </span>
                </div>
                {c.shortName && (
                  <p className="text-xs text-primary mt-2 font-medium">{c.shortName}</p>
                )}
              </div>
            ))}
            {courts.length === 0 && (
              <div className="col-span-3 text-center py-12 text-muted-foreground">
                <Scale className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No courts configured yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
