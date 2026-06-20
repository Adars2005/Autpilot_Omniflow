'use client'

import { usePathname } from 'next/navigation'
import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { ToastProvider } from '@/components/ui/toast'
import { CommandPalette } from '@/components/CommandPalette'
import { AIProvider } from '@/context/AIContext'
import { AIManager } from '@/components/ai/AIManager'
import { FounderOSProvider } from '@/lib/founderos/context'

// Mock session — all components see an authenticated admin user
const mockSession: {
  user: { name: string; email: string }
  roles: string[]
  expires: string
} = {
  user: {
    name: 'Dev User',
    email: 'dev@autopilot.local',
  },
  roles: ['admin', 'user'],
  expires: '2099-12-31T23:59:59.999Z',
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const pathname = usePathname()
  const isFounderOS =
    pathname === '/' ||
    pathname === '/start' ||
    pathname === '/deploy' ||
    pathname?.startsWith('/dashboard')

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider
        session={mockSession}
        basePath={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/auth`}
        refetchInterval={0}
        refetchOnWindowFocus={false}
      >
        <FounderOSProvider>
          <AIProvider>
            {children}
            {!isFounderOS && <AIManager />}
            <ToastProvider />
            {!isFounderOS && <CommandPalette />}
          </AIProvider>
        </FounderOSProvider>
      </SessionProvider>
    </QueryClientProvider>
  )
}
