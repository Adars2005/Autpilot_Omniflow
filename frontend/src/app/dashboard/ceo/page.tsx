'use client'

import { useFounderOS } from '@/lib/founderos/context'
import { GlassCard } from '@/components/founderos/GlassCard'
import { PageHeader } from '@/components/founderos/PageHeader'
import { AlertTriangle, Target, Map, Lightbulb, ArrowRight } from 'lucide-react'

export default function CEODashboardPage() {
  const { company } = useFounderOS()
  const { ceo } = company

  return (
    <div>
      <PageHeader title="CEO Dashboard" description="Strategic command center" />

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <div className="mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-indigo-400" />
            <h3 className="font-semibold text-white">Mission</h3>
          </div>
          <p className="text-sm leading-relaxed text-white/70">{ceo.mission}</p>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-purple-400" />
            <h3 className="font-semibold text-white">Vision</h3>
          </div>
          <p className="text-sm leading-relaxed text-white/70">{ceo.vision}</p>
        </GlassCard>
      </div>

      <GlassCard className="mt-6 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Map className="h-4 w-4 text-cyan-400" />
          <h3 className="font-semibold text-white">Roadmap</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {ceo.roadmap.map((phase) => (
            <div key={phase.phase} className="rounded-xl bg-white/5 p-4">
              <h4 className="text-sm font-medium text-indigo-300">{phase.phase}</h4>
              <ul className="mt-2 space-y-1">
                {phase.items.map((item) => (
                  <li key={item} className="flex gap-2 text-xs text-white/60">
                    <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-indigo-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <h3 className="mb-4 font-semibold text-white">Top Priorities</h3>
          <ol className="space-y-2">
            {ceo.priorities.map((p, i) => (
              <li key={p} className="flex gap-3 text-sm text-white/70">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-300">
                  {i + 1}
                </span>
                {p}
              </li>
            ))}
          </ol>
        </GlassCard>

        <GlassCard className="border-red-500/20 p-6">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <h3 className="font-semibold text-white">Current Risks</h3>
          </div>
          <ul className="space-y-2">
            {ceo.risks.map((r) => (
              <li key={r} className="flex gap-2 text-sm text-white/70">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                {r}
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <h3 className="mb-4 font-semibold text-white">Next Best Actions</h3>
          <ul className="space-y-2">
            {ceo.nextActions.map((a) => (
              <li key={a} className="rounded-lg bg-white/5 px-3 py-2 text-sm text-white/70">{a}</li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="mb-4 font-semibold text-white">Strategic Recommendations</h3>
          <ul className="space-y-2">
            {ceo.recommendations.map((r) => (
              <li key={r} className="flex gap-2 text-sm text-white/70">
                <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                {r}
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>
    </div>
  )
}
