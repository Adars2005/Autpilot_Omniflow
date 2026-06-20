'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useFounderOS } from '@/lib/founderos/context'
import {
  LayoutDashboard,
  Crown,
  Building2,
  TrendingUp,
  Users,
  Wallet,
  Scale,
  Hexagon,
  Brain,
  Target,
  Settings,
  Zap,
  Network,
  Gavel,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/ceo', label: 'CEO Dashboard', icon: Crown },
  { href: '/dashboard/departments', label: 'Departments', icon: Building2 },
  { href: '/dashboard/investors', label: 'Investors', icon: TrendingUp },
  { href: '/dashboard/customers', label: 'Customers', icon: Users },
  { href: '/dashboard/treasury', label: 'Treasury', icon: Wallet },
  { href: '/dashboard/governance', label: 'Governance', icon: Scale },
  { href: '/dashboard/board', label: 'Board of Directors', icon: Gavel },
  { href: '/dashboard/ecosystem', label: 'Ecosystem', icon: Network },
  { href: '/dashboard/monad', label: 'Monad Layer', icon: Hexagon },
  { href: '/dashboard/memory', label: 'Company Memory', icon: Brain },
  { href: '/dashboard/readiness', label: 'Readiness', icon: Target },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export function FounderSidebar() {
  const pathname = usePathname()
  const { company } = useFounderOS()

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-white/10 bg-[#06060e]/95 backdrop-blur-2xl">
      <div className="border-b border-white/10 p-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-display text-sm font-bold text-white">FounderOS</p>
            <p className="text-[10px] text-white/40">Command Center</p>
          </div>
        </Link>
        <div className="mt-4 rounded-xl bg-white/5 p-3">
          <p className="truncate text-sm font-medium text-white">{company.startup.name}</p>
          <p className="truncate text-xs text-white/50">{company.startup.industry}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all',
                    active
                      ? 'bg-indigo-500/20 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-3">
          <p className="text-xs text-white/50">Overall Readiness</p>
          <p className="text-2xl font-bold text-white">{company.overallReadiness}%</p>
        </div>
      </div>
    </aside>
  )
}
