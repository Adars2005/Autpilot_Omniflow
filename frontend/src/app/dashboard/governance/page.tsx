'use client'

import { useFounderOS } from '@/lib/founderos/context'
import { GlassCard } from '@/components/founderos/GlassCard'
import { PageHeader } from '@/components/founderos/PageHeader'
import { ApprovalCard } from '@/components/founderos/ApprovalCard'
import { Scale, CheckCircle2, Clock } from 'lucide-react'

export default function GovernancePage() {
  const { company } = useFounderOS()
  const govDept = company.departments.find((d) => d.id === 'governance')
  const pendingApprovals = company.approvals.filter((a) => a.status === 'pending')

  return (
    <div>
      <PageHeader title="Governance" description="Corporate governance and compliance framework" />

      {govDept && (
        <GlassCard className="mb-8 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Scale className="h-5 w-5 text-indigo-400" />
            <h3 className="font-semibold text-white">Governance Framework</h3>
          </div>
          {govDept.output.sections.map((section) => (
            <div key={section.heading} className="mb-4 last:mb-0">
              <h4 className="text-sm font-medium text-indigo-300">{section.heading}</h4>
              <ul className="mt-2 space-y-1">
                {section.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-white/70">
                    {item.startsWith('✅') ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                    ) : item.startsWith('⏳') ? (
                      <Clock className="h-3.5 w-3.5 text-amber-400" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    )}
                    {item.replace(/^[✅⏳]\s*/, '')}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </GlassCard>
      )}

      <h3 className="mb-4 font-semibold text-white">Pending Governance Approvals</h3>
      <div className="space-y-3">
        {pendingApprovals.map((a) => (
          <ApprovalCard key={a.id} request={a} />
        ))}
      </div>
    </div>
  )
}
