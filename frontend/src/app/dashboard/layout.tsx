'use client'

import { FounderSidebar } from '@/components/founderos/FounderSidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <FounderSidebar />
      <main className="ml-64 flex-1 p-8">{children}</main>
    </div>
  )
}
