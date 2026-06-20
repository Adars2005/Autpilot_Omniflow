'use client'

import { useFounderOS } from '@/lib/founderos/context'
import { GlassCard } from '@/components/founderos/GlassCard'
import { PageHeader } from '@/components/founderos/PageHeader'
import { cn } from '@/lib/utils'

const typeColors = {
  potential: 'bg-blue-500/20 text-blue-400',
  design_partner: 'bg-purple-500/20 text-purple-400',
  pilot: 'bg-green-500/20 text-green-400',
}

const typeLabels = {
  potential: 'Potential Customer',
  design_partner: 'Design Partner',
  pilot: 'Pilot Customer',
}

export default function CustomersPage() {
  const { company } = useFounderOS()

  const totalPipeline = company.customers.reduce((s, c) => s + c.expectedRevenue, 0)

  return (
    <div>
      <PageHeader
        title="Customer Intelligence"
        description={`${company.customers.length} prospects · $${totalPipeline.toLocaleString()} pipeline ARR`}
      />

      <div className="mb-6 grid grid-cols-3 gap-4">
        {(['design_partner', 'pilot', 'potential'] as const).map((type) => {
          const count = company.customers.filter((c) => c.type === type).length
          return (
            <GlassCard key={type} className="p-4 text-center">
              <p className="text-2xl font-bold text-white">{count}</p>
              <p className="text-xs text-white/50">{typeLabels[type]}s</p>
            </GlassCard>
          )
        })}
      </div>

      <div className="space-y-3">
        {company.customers.map((c) => (
          <GlassCard key={c.id} hover className="p-5">
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-white">{c.name}</h3>
                  <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', typeColors[c.type])}>
                    {typeLabels[c.type]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-white/50">{c.industry}</p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center text-xs">
                <div>
                  <p className="text-white/40">Lead Score</p>
                  <p className="text-lg font-bold text-indigo-400">{c.leadScore}</p>
                </div>
                <div>
                  <p className="text-white/40">Expected Revenue</p>
                  <p className="text-lg font-bold text-green-400">${c.expectedRevenue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-white/40">Status</p>
                  <p className="font-medium text-white">{c.status}</p>
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {c.painPoints.map((p) => (
                <span key={p} className="rounded-lg bg-white/5 px-2.5 py-1 text-xs text-white/60">{p}</span>
              ))}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
