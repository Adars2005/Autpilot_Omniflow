'use client'

import { useFounderOS } from '@/lib/founderos/context'
import { RECOMMENDED_ACTIONS } from '@/lib/founderos/mock-data'
import { GlassCard } from '@/components/founderos/GlassCard'
import { ScoreRing } from '@/components/founderos/ScoreRing'
import { PageHeader } from '@/components/founderos/PageHeader'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { ArrowRight, Target } from 'lucide-react'

export default function ReadinessPage() {
  const { company } = useFounderOS()

  const barData = company.readiness.map((r) => ({
    name: r.label.replace(' Readiness', ''),
    score: r.score,
  }))

  const barColors = barData.map((d) =>
    d.score >= 80 ? '#22c55e' : d.score >= 60 ? '#6366f1' : d.score >= 40 ? '#f59e0b' : '#ef4444'
  )

  return (
    <div>
      <PageHeader
        title="Startup Readiness"
        description="Comprehensive readiness assessment across all dimensions"
      />

      <div className="mb-8 flex flex-wrap items-center gap-8">
        <ScoreRing score={company.overallReadiness} size={160} label="Overall Score" />
        <GlassCard className="flex-1 p-6">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} layout="vertical">
              <XAxis type="number" domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={80} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
              <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                {barData.map((_, i) => (
                  <Cell key={i} fill={barColors[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {company.readiness.map((r) => (
          <GlassCard key={r.label} className="p-5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm text-white/70">{r.label}</h4>
              {r.trend !== undefined && (
                <span className={`text-xs ${r.trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {r.trend > 0 ? '+' : ''}{r.trend}%
                </span>
              )}
            </div>
            <p className="mt-2 text-3xl font-bold text-white">{r.score}%</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                style={{ width: `${r.score}%` }}
              />
            </div>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="mt-8 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-indigo-400" />
          <h3 className="font-semibold text-white">Top 10 Recommended Actions</h3>
        </div>
        <ol className="space-y-2">
          {RECOMMENDED_ACTIONS.map((action, i) => (
            <li key={action} className="flex gap-3 rounded-lg bg-white/5 px-4 py-3 text-sm text-white/70">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-300">
                {i + 1}
              </span>
              <span className="flex-1">{action}</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-white/20" />
            </li>
          ))}
        </ol>
      </GlassCard>
    </div>
  )
}
