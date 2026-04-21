'use client'

import { useState } from 'react'
import { useUser } from '@/stores/auth.store'
import { apiPatch, apiPost } from '@/lib/api'
import { toast } from 'sonner'
import { Loader2, User, Lock, Bell } from 'lucide-react'

export default function SettingsPage() {
  const user = useUser()
  const [tab, setTab] = useState<'profile' | 'password' | 'notifications'>('profile')
  const [saving, setSaving] = useState(false)

  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: '',
    barNumber: user?.barNumber || '',
  })

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const saveProfile = async () => {
    setSaving(true)
    try {
      await apiPatch(`/users/${user?.id}`, profile)
      toast.success('Profile updated')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error('Passwords do not match')
    }
    if (passwords.newPassword.length < 8) {
      return toast.error('Password must be at least 8 characters')
    }
    setSaving(true)
    try {
      await apiPost('/users/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      })
      toast.success('Password changed successfully')
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage your account preferences</p>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 border-b">
        {[
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'password', label: 'Password', icon: Lock },
          { id: 'notifications', label: 'Notifications', icon: Bell },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id as any)}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition ${
              tab === id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Personal Information</h2>

          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xl font-bold">
                {user?.firstName[0]}{user?.lastName[0]}
              </span>
            </div>
            <div>
              <p className="font-medium">{user?.firstName} {user?.lastName}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="text-xs text-muted-foreground capitalize mt-0.5">
                {user?.role.replace('_', ' ').toLowerCase()} · {user?.organization?.name}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">First Name</label>
              <input value={profile.firstName} onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2.5 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Last Name</label>
              <input value={profile.lastName} onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2.5 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Phone</label>
            <input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
              placeholder="+91 98765 43210"
              className="w-full border rounded-lg px-3 py-2.5 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Bar Council Enrollment No.</label>
            <input value={profile.barNumber} onChange={e => setProfile(p => ({ ...p, barNumber: e.target.value }))}
              placeholder="e.g. D/1234/2001"
              className="w-full border rounded-lg px-3 py-2.5 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          <button onClick={saveProfile} disabled={saving}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      )}

      {tab === 'password' && (
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Change Password</h2>
          {[
            { key: 'currentPassword', label: 'Current Password' },
            { key: 'newPassword', label: 'New Password' },
            { key: 'confirmPassword', label: 'Confirm New Password' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-1.5">{label}</label>
              <input type="password"
                value={(passwords as any)[key]}
                onChange={e => setPasswords(p => ({ ...p, [key]: e.target.value }))}
                placeholder="••••••••"
                className="w-full border rounded-lg px-3 py-2.5 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          ))}
          <button onClick={changePassword} disabled={saving}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Update Password
          </button>
        </div>
      )}

      {tab === 'notifications' && (
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Notification Preferences</h2>
          {[
            { label: 'Hearing reminders (1 day before)', defaultChecked: true },
            { label: 'Task deadline alerts', defaultChecked: true },
            { label: 'New document uploaded', defaultChecked: false },
            { label: 'Matter status changes', defaultChecked: true },
            { label: 'New team member added', defaultChecked: false },
          ].map(({ label, defaultChecked }) => (
            <label key={label} className="flex items-center justify-between gap-4 cursor-pointer">
              <span className="text-sm">{label}</span>
              <input type="checkbox" defaultChecked={defaultChecked}
                className="w-4 h-4 rounded accent-primary" />
            </label>
          ))}
          <button className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition">
            Save Preferences
          </button>
        </div>
      )}
    </div>
  )
}
