'use client'

import { usePathname } from 'next/navigation'
import { Bell, Search } from 'lucide-react'
import { useUser } from '@/stores/auth.store'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/matters': 'Matters',
  '/documents': 'Documents',
  '/tasks': 'Tasks',
  '/hearings': 'Hearings',
  '/ai': 'AI Assistant',
  '/analytics': 'Analytics',
  '/clients': 'Clients',
  '/admin': 'Admin Panel',
  '/settings': 'Settings',
}

export function TopBar() {
  const pathname = usePathname()
  const user = useUser()

  const title = Object.entries(PAGE_TITLES).find(([key]) =>
    pathname.startsWith(key),
  )?.[1] ?? 'Litigation OS'

  return (
    <header className="h-16 border-b bg-background/95 backdrop-blur sticky top-0 z-30 flex items-center px-6 gap-4">
      <div className="flex-1">
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 bg-muted rounded-lg px-3 py-2 w-64">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          placeholder="Search matters, documents..."
          className="bg-transparent text-sm outline-none flex-1 placeholder:text-muted-foreground"
        />
      </div>

      {/* Notifications */}
      <button className="relative p-2 rounded-lg hover:bg-accent transition">
        <Bell className="w-5 h-5" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
      </button>

      {/* Avatar */}
      {user && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-xs font-bold">
            {user.firstName[0]}{user.lastName[0]}
          </span>
        </div>
      )}
    </header>
  )
}
