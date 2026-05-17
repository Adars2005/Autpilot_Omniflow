'use client'

import React, { createContext, useContext, useState } from 'react'

// Sidebar context for collapse state — shared between Sidebar and Header
interface SidebarContextType {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  toggle: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const toggle = () => setIsCollapsed(!isCollapsed)

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed, toggle }}>
      {children}
    </SidebarContext.Provider>
  )
}
