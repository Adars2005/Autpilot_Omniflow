'use client'

import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-white">{title}</h1>
        {description && <p className="mt-1 text-white/50">{description}</p>}
      </div>
      {children}
    </div>
  )
}

interface StatPillProps {
  label: string
  value: string | number
  trend?: string
  positive?: boolean
}

export function StatPill({ label, value, trend, positive }: StatPillProps) {
  return (
    <div className="rounded-xl bg-white/5 px-4 py-3">
      <p className="text-xs text-white/50">{label}</p>
      <p className="text-xl font-semibold text-white">{value}</p>
      {trend && (
        <p className={cn('text-xs', positive ? 'text-green-400' : 'text-red-400')}>{trend}</p>
      )}
    </div>
  )
}

export function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]',
    processing: 'bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.5)]',
    idle: 'bg-white/30',
    pending: 'bg-amber-400 animate-pulse',
    approved: 'bg-green-400',
    rejected: 'bg-red-400',
  }
  return <span className={cn('inline-block h-2 w-2 rounded-full', colors[status] || colors.idle)} />
}
