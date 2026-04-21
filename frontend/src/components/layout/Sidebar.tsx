'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Scale, LayoutDashboard, FolderOpen, FileText, Brain, CheckSquare,
  Calendar, Users, BarChart3, Settings, ChevronLeft, ChevronRight,
  LogOut, Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore, useUser } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'
import { useRouter } from 'next/navigation'
import { apiPost } from '@/lib/api'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/matters', icon: FolderOpen, label: 'Matters' },
  { href: '/documents', icon: FileText, label: 'Documents' },
  { href: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { href: '/hearings', icon: Calendar, label: 'Hearings' },
  { href: '/ai', icon: Brain, label: 'AI Assistant' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/clients', icon: Users, label: 'Clients' },
]

const adminItems = [
  { href: '/admin', icon: Building2, label: 'Admin Panel' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const pathname = usePathname()
  const user = useUser()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const logout = useAuthStore((s) => s.logout)
  const router = useRouter()

  const handleLogout = async () => {
    const refreshToken = useAuthStore.getState().refreshToken
    try { await apiPost('/auth/logout', { refreshToken }) } catch {}
    logout()
    router.push('/auth/login')
  }

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full z-40 flex flex-col',
        'bg-sidebar border-r border-sidebar-border',
        'transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 border-b border-sidebar-border px-4 gap-3 flex-shrink-0',
      )}>
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Scale className="w-5 h-5 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="min-w-0">
            <p className="text-sidebar-foreground font-bold text-sm leading-tight truncate">
              Litigation OS
            </p>
            <p className="text-blue-400 text-xs truncate">
              {user?.organization?.name}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-all group',
                active
                  ? 'bg-sidebar-accent text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-sidebar-foreground',
              )}
            >
              <Icon className={cn('w-5 h-5 flex-shrink-0', active && 'text-white')} />
              {!sidebarCollapsed && (
                <span className="text-sm font-medium truncate">{item.label}</span>
              )}
            </Link>
          )
        })}

        {/* Admin section */}
        {(user?.role === 'ADMIN' || user?.role === 'SENIOR_LAWYER') && (
          <>
            <div className={cn('pt-4 pb-1', !sidebarCollapsed && 'px-3')}>
              {!sidebarCollapsed && (
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Administration
                </p>
              )}
              {sidebarCollapsed && <div className="border-t border-sidebar-border" />}
            </div>
            {adminItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-all',
                    active
                      ? 'bg-sidebar-accent text-white'
                      : 'text-slate-400 hover:bg-white/5 hover:text-sidebar-foreground',
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* User + Collapse */}
      <div className="border-t border-sidebar-border p-2 space-y-1 flex-shrink-0">
        {/* User info */}
        {!sidebarCollapsed && user && (
          <div className="px-3 py-2 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {user.firstName[0]}{user.lastName[0]}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sidebar-foreground text-sm font-medium truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-slate-500 text-xs capitalize truncate">
                {user.role.replace('_', ' ').toLowerCase()}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-red-400 transition-all"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!sidebarCollapsed && <span className="text-sm">Sign out</span>}
        </button>

        <button
          onClick={toggleSidebar}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-500 hover:bg-white/5 hover:text-sidebar-foreground transition-all"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
