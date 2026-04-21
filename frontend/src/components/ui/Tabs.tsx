'use client'

import { createContext, useContext, useState } from 'react'
import { cn } from '@/lib/utils'

const TabsContext = createContext<{ activeTab: string; setActiveTab: (v: string) => void }>({
  activeTab: '',
  setActiveTab: () => {},
})

export function Tabs({
  children,
  defaultValue,
}: {
  children: React.ReactNode
  defaultValue: string
}) {
  const [activeTab, setActiveTab] = useState(defaultValue)
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-1 border-b mb-5 overflow-x-auto scrollbar-none">
      {children}
    </div>
  )
}

export function TabsTrigger({
  value,
  children,
}: {
  value: string
  children: React.ReactNode
}) {
  const { activeTab, setActiveTab } = useContext(TabsContext)
  return (
    <button
      onClick={() => setActiveTab(value)}
      className={cn(
        'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all',
        activeTab === value
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

export function TabsContent({
  value,
  children,
}: {
  value: string
  children: React.ReactNode
}) {
  const { activeTab } = useContext(TabsContext)
  if (activeTab !== value) return null
  return <div>{children}</div>
}
