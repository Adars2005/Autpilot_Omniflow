'use client'

import { useFounderOS } from '@/lib/founderos/context'
import { GlassCard } from '@/components/founderos/GlassCard'
import { PageHeader } from '@/components/founderos/PageHeader'
import { cn } from '@/lib/utils'
import { Gavel, MessageSquare } from 'lucide-react'

const voteColors = {
  approve: 'bg-green-500/20 text-green-400 border-green-500/30',
  reject: 'bg-red-500/20 text-red-400 border-red-500/30',
  conditional: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
}

export default function BoardPage() {
  const { company } = useFounderOS()

  return (
    <div>
      <PageHeader
        title="Board of Directors"
        description="AI board members debate, vote, and recommend"
      />

      <GlassCard className="mb-6 border-indigo-500/20 p-4">
        <div className="flex items-center gap-2 text-sm text-indigo-300">
          <MessageSquare className="h-4 w-4" />
          Active Board Debate — Q2 Strategic Review
        </div>
      </GlassCard>

      <div className="space-y-6">
        {company.board.map((member, i) => (
          <GlassCard key={member.id} className="overflow-hidden p-0">
            <div className="border-b border-white/10 bg-white/5 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/20">
                    <Gavel className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{member.name}</h3>
                    <p className="text-xs text-white/50">{member.role}</p>
                  </div>
                </div>
                <span
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium capitalize',
                    voteColors[member.vote]
                  )}
                >
                  Vote: {member.vote}
                </span>
              </div>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-white/40">Opinion</p>
                <p className="mt-1 text-sm text-white/80">{member.opinion}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-white/40">Reasoning</p>
                <p className="mt-1 text-sm text-white/60">{member.reasoning}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-white/5 p-4">
                  <p className="text-xs text-white/40">Recommendation</p>
                  <p className="mt-1 text-sm text-white/70">{member.recommendation}</p>
                </div>
                <div className="rounded-xl bg-indigo-500/10 p-4">
                  <p className="text-xs text-indigo-300">Decision</p>
                  <p className="mt-1 text-sm font-medium text-white">{member.decision}</p>
                  <p className="mt-2 text-xs text-white/50">Confidence: {member.confidence}%</p>
                </div>
              </div>
            </div>

            {i < company.board.length - 1 && (
              <div className="flex justify-center py-2">
                <div className="h-px w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>
            )}
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
