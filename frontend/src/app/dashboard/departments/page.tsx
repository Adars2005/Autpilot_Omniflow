'use client'

import { useState } from 'react'
import { useFounderOS } from '@/lib/founderos/context'
import { GlassCard } from '@/components/founderos/GlassCard'
import { PageHeader, StatusDot } from '@/components/founderos/PageHeader'
import { AgentOutputDrawer } from '@/components/founderos/AgentOutputDrawer'
import { Button } from '@/components/ui/button'
import type { Department, AgentOutput } from '@/lib/founderos/types'
import { Eye } from 'lucide-react'

function DepartmentCard({
  dept,
  onViewOutput,
}: {
  dept: Department
  onViewOutput: (dept: Department) => void
}) {
  const remaining = dept.budget - dept.spent

  return (
    <GlassCard hover className="p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{dept.icon}</span>
          <div>
            <h3 className="font-semibold text-white">{dept.name}</h3>
            <div className="mt-0.5 flex items-center gap-2">
              <StatusDot status={dept.status} />
              <span className="text-xs capitalize text-white/50">{dept.status}</span>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3 text-sm text-white/50 line-clamp-2">{dept.outputSummary}</p>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-white/5 p-2">
          <p className="text-white/40">Budget</p>
          <p className="font-medium text-white">${dept.budget.toLocaleString()}</p>
        </div>
        <div className="rounded-lg bg-white/5 p-2">
          <p className="text-white/40">Remaining</p>
          <p className="font-medium text-white">${remaining.toLocaleString()}</p>
        </div>
        <div className="rounded-lg bg-white/5 p-2">
          <p className="text-white/40">Risk Score</p>
          <p className="font-medium text-amber-400">{dept.riskScore}</p>
        </div>
        <div className="rounded-lg bg-white/5 p-2">
          <p className="text-white/40">Reputation</p>
          <p className="font-medium text-green-400">{dept.reputationScore}</p>
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex justify-between text-xs text-white/40">
          <span>Progress</span>
          <span>{dept.progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
            style={{ width: `${dept.progress}%` }}
          />
        </div>
      </div>

      <Button
        size="sm"
        variant="outline"
        className="mt-4 w-full border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20"
        onClick={() => onViewOutput(dept)}
      >
        <Eye className="mr-2 h-3.5 w-3.5" />
        View Output
      </Button>
    </GlassCard>
  )
}

export default function DepartmentsPage() {
  const { company } = useFounderOS()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedOutput, setSelectedOutput] = useState<AgentOutput | null>(null)
  const [selectedName, setSelectedName] = useState('')

  const handleViewOutput = (dept: Department) => {
    setSelectedOutput(dept.output)
    setSelectedName(dept.name)
    setDrawerOpen(true)
  }

  return (
    <div>
      <PageHeader
        title="Departments"
        description={`${company.departments.length} autonomous agent departments`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {company.departments.map((dept) => (
          <DepartmentCard key={dept.id} dept={dept} onViewOutput={handleViewOutput} />
        ))}
      </div>

      <AgentOutputDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        output={selectedOutput}
        departmentName={selectedName}
      />
    </div>
  )
}
