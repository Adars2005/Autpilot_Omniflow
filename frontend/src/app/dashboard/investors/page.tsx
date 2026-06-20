'use client'

import { useState } from 'react'
import { useFounderOS } from '@/lib/founderos/context'
import { GlassCard } from '@/components/founderos/GlassCard'
import { PageHeader } from '@/components/founderos/PageHeader'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { Investor } from '@/lib/founderos/types'
import { TrendingUp, Building2 } from 'lucide-react'

export default function InvestorsPage() {
  const { company } = useFounderOS()
  const [selected, setSelected] = useState<Investor | null>(null)

  return (
    <div>
      <PageHeader title="Investor Intelligence" description="AI-matched investors for your startup" />

      <div className="space-y-3">
        {company.investors.map((inv) => (
          <GlassCard
            key={inv.id}
            hover
            className="cursor-pointer p-5"
            onClick={() => setSelected(inv)}
          >
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20">
                <Building2 className="h-6 w-6 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-white">{inv.name}</h3>
                  <span className="rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-medium text-green-400">
                    {inv.matchScore}% match
                  </span>
                </div>
                <p className="text-sm text-white/50">{inv.firm}</p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center text-xs">
                <div>
                  <p className="text-white/40">Stage Fit</p>
                  <p className="font-medium text-white">{inv.stageFit}</p>
                </div>
                <div>
                  <p className="text-white/40">Industry Fit</p>
                  <p className="font-medium text-white">{inv.industryFit}</p>
                </div>
                <div>
                  <p className="text-white/40">Warm Intro</p>
                  <p className="font-medium text-indigo-400">{inv.warmIntroProbability}%</p>
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm text-white/60">{inv.recommendedOutreach}</p>
          </GlassCard>
        ))}
      </div>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="overflow-y-auto border-white/10 bg-[#0a0a12]/95 backdrop-blur-2xl sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="text-white">{selected.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <GlassCard className="p-4">
                  <p className="text-xs text-white/50">Firm</p>
                  <p className="font-medium text-white">{selected.firm}</p>
                </GlassCard>
                <GlassCard className="p-4">
                  <p className="text-xs text-white/50">Investment Thesis</p>
                  <p className="text-sm text-white/70">{selected.thesis}</p>
                </GlassCard>
                <div className="grid grid-cols-2 gap-3">
                  <GlassCard className="p-4 text-center">
                    <TrendingUp className="mx-auto h-5 w-5 text-green-400" />
                    <p className="mt-2 text-2xl font-bold text-white">{selected.matchScore}%</p>
                    <p className="text-xs text-white/50">Match Score</p>
                  </GlassCard>
                  <GlassCard className="p-4 text-center">
                    <p className="mt-2 text-2xl font-bold text-indigo-400">{selected.warmIntroProbability}%</p>
                    <p className="text-xs text-white/50">Warm Intro Probability</p>
                  </GlassCard>
                </div>
                <GlassCard className="p-4">
                  <p className="text-xs text-white/50">Check Size</p>
                  <p className="font-medium text-white">{selected.checkSize}</p>
                </GlassCard>
                <GlassCard className="p-4">
                  <p className="text-xs text-white/50">Portfolio</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selected.portfolio.map((p) => (
                      <span key={p} className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/70">{p}</span>
                    ))}
                  </div>
                </GlassCard>
                <GlassCard className="border-indigo-500/20 p-4">
                  <p className="text-xs text-indigo-300">Recommended Outreach</p>
                  <p className="mt-1 text-sm text-white/70">{selected.recommendedOutreach}</p>
                </GlassCard>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
