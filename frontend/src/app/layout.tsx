'use client'

import './globals.css'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Providers } from './providers'
import { Header } from '@/components/layout/Header'
import { Sidebar, SidebarProvider, useSidebar } from '@/components/layout/Sidebar'
import { MobileSidebar } from '@/components/layout/MobileSidebar'
import { VisualPattern } from '@/components/brand'
import { Funnel_Display, Geologica } from 'next/font/google'
import { cn } from '@/lib/utils'
import { Toaster } from 'react-hot-toast'

// Configure Funnel Display (Primary / Headings)
const funnel = Funnel_Display({
  subsets: ['latin'],
  variable: '--font-funnel',
  display: 'swap',
})

// Configure Geologica (Secondary / Body)
const geologica = Geologica({
  subsets: ['latin'],
  variable: '--font-geologica',
  display: 'swap',
})

// Routes that should NOT show the main app shell (sidebar, header)
const AUTH_ROUTES = ['/auth/signin', '/auth/register', '/auth/error']

// FounderOS routes use their own layout
const FOUNDEROS_STANDALONE = ['/', '/start', '/deploy']
const FOUNDEROS_DASHBOARD_PREFIX = '/dashboard'

// Inner layout that can access sidebar context and pathname
function LayoutContent({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isCollapsed } = useSidebar()
  const pathname = usePathname()

  const isAuthRoute = AUTH_ROUTES.some((route) => pathname?.startsWith(route))
  const isFounderOSStandalone =
    FOUNDEROS_STANDALONE.includes(pathname ?? '') ||
    pathname?.startsWith(FOUNDEROS_DASHBOARD_PREFIX)

  if (isAuthRoute) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100'>
        <VisualPattern variant='subtle' />
        <main className='relative z-10 flex min-h-screen items-center justify-center p-4'>
          {children}
        </main>
      </div>
    )
  }

  // FounderOS — standalone dark layout (landing, onboard, deploy, dashboard)
  if (isFounderOSStandalone) {
    return <div className="founderos-bg min-h-screen text-white">{children}</div>
  }

  // Normal app layout with sidebar and header
  return (
    <>
      {/* Ambient visual pattern */}
      <VisualPattern variant='subtle' />

      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main content area */}
      <div
        className={cn(
          'min-h-screen',
          // Offset for fixed sidebar - responds to collapse state
          isCollapsed ? 'md:pl-16' : 'md:pl-64',
          // Transition for sidebar collapse
          'transition-all duration-300 ease-out'
        )}
      >
        {/* Floating Header */}
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        {/* Main content with landmark role */}
        <main
          id='main-content'
          role='main'
          aria-label='Main content'
          className={cn(
            'flex flex-col',
            // Account for floating header (h-14 + top-4 + gap)
            'pt-24',
            // Padding
            'px-4 pb-8 lg:px-8',
            // Min height for full viewport
            'min-h-screen'
          )}
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en' className='light' suppressHydrationWarning>
      <head>
        <title>FounderOS — The Autonomous Startup Operating System</title>
        <meta name='description' content='Deploy an autonomous AI-native company with departments, treasury, governance, and investor intelligence.' />
      </head>
      <body
        className={cn(
          'min-h-screen font-sans antialiased',
          'bg-background text-foreground',
          funnel.variable,
          geologica.variable
        )}
      >
        <Providers>
          <SidebarProvider>
            <LayoutContent>{children}</LayoutContent>
          </SidebarProvider>
        </Providers>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
