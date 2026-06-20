'use client'

import { useFounderOS } from '@/lib/founderos/context'
import { GlassCard } from '@/components/founderos/GlassCard'
import { PageHeader } from '@/components/founderos/PageHeader'
import { Brain } from 'lucide-react'

const categoryColors: Record<string, string> = {
  Decision: 'text-indigo-400 bg-indigo-500/20',
  Campaign: 'text-pink-400 bg-pink-500/20',
  Outreach: 'text-cyan-400 bg-cyan-500/20',
  Treasury: 'text-amber-400 bg-amber-500/20',
}

export default function MemoryPage() {
  const { company } = useFounderOS()

  return (
    <div>
      <PageHeader
        title="Company Memory"
        description="Institutional knowledge — past decisions, campaigns, and lessons learned"
      />

      <GlassCard className="mb-6 border-purple-500/20 p-4">
        <div className="flex items-center gap-2 text-sm text-purple-300">
          <Brain className="h-4 w-4" />
          {company.memory.length} memory entries stored · Synced to Monad ledger
        </div>
      </GlassCard>

      <div className="relative space-y-0">
        {company.memory.map((entry, i) => (
          <div key={entry.id} className="relative flex gap-4 pb-8">
            {i < company.memory.length - 1 && (
              <div className="absolute left-[19px] top-10 h-full w-px bg-white/10" />
            )}
            <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#0a0a14]">
              <Brain className="h-4 w-4 text-purple-400" />
            </div>
            <GlassCard className="flex-1 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColors[entry.category] || 'text-white/60 bg-white/10'}`}
                >
                  {entry.category}
                </span>
                <span className="text-xs text-white/40">{entry.date}</span>
              </div>
              <h4 className="mt-2 font-semibold text-white">{entry.title}</h4>
              <p className="mt-2 text-sm text-white/60">{entry.outcome}</p>
              {entry.roi && (
                <p className="mt-1 text-sm font-medium text-green-400">ROI: {entry.roi}</p>
              )}
              <div className="mt-3 rounded-lg bg-purple-500/10 px-3 py-2">
                <p className="text-xs text-purple-300">Lesson Learned</p>
                <p className="text-sm text-white/70">{entry.lesson}</p>
              </div>
            </GlassCard>
          </div>
        ))}
      </div>
    </div>
  )
}
