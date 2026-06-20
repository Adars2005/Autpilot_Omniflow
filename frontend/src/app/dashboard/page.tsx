'use client'

import { useFounderOS } from '@/lib/founderos/context'
import { GlassCard } from '@/components/founderos/GlassCard'
import { ScoreRing } from '@/components/founderos/ScoreRing'
import { PageHeader, StatPill } from '@/components/founderos/PageHeader'
import { ApprovalCard } from '@/components/founderos/ApprovalCard'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from 'recharts'

export default function OverviewPage() {
  const { company } = useFounderOS()
  const pendingApprovals = company.approvals.filter((a) => a.status === 'pending')

  const radarData = company.readiness.map((r) => ({
    subject: r.label.replace(' Readiness', ''),
    score: r.score,
  }))

  return (
    <div>
      <PageHeader
        title={company.startup.name}
        description={`${company.startup.industry} · ${company.startup.fundingStage}`}
      />

      <div className="mb-8 flex flex-wrap items-center gap-8">
        <ScoreRing score={company.overallReadiness} size={140} label="Startup Health Score" />
        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {company.readiness.map((r) => (
            <StatPill
              key={r.label}
              label={r.label}
              value={`${r.score}%`}
              trend={r.trend ? `${r.trend > 0 ? '+' : ''}${r.trend}%` : undefined}
              positive={r.trend ? r.trend > 0 : undefined}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <h3 className="mb-4 font-semibold text-white">Readiness Radar</h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
              <Radar dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="mb-4 font-semibold text-white">Department Progress</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={company.departments.slice(0, 8).map((d) => ({ name: d.name.split(' ')[0], progress: d.progress }))}>
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#0a0a14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="progress" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {pendingApprovals.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-4 font-semibold text-white">Pending Approvals</h3>
          <div className="space-y-3">
            {pendingApprovals.slice(0, 2).map((a) => (
              <ApprovalCard key={a.id} request={a} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
