'use client'

import { useFounderOS } from '@/lib/founderos/context'
import { GlassCard } from '@/components/founderos/GlassCard'
import { PageHeader, StatusDot } from '@/components/founderos/PageHeader'
import { ApprovalCard } from '@/components/founderos/ApprovalCard'
import { cn } from '@/lib/utils'
import { Wallet } from 'lucide-react'

export default function TreasuryPage() {
  const { company } = useFounderOS()
  const totalBalance = company.wallets.reduce((s, w) => s + w.balance, 0)
  const totalBudget = company.wallets.reduce((s, w) => s + w.budget, 0)
  const totalSpent = company.wallets.reduce((s, w) => s + w.spent, 0)
  const treasuryApprovals = company.approvals.filter(
    (a) => a.type === 'treasury' || a.type === 'campaign'
  )

  return (
    <div>
      <PageHeader
        title="Treasury"
        description="Multi-wallet budgeting and spend control"
      />

      <div className="mb-8 grid grid-cols-3 gap-4">
        <GlassCard className="p-4 text-center">
          <p className="text-xs text-white/50">Total Balance</p>
          <p className="text-2xl font-bold text-white">${totalBalance.toLocaleString()}</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-xs text-white/50">Total Budget</p>
          <p className="text-2xl font-bold text-indigo-400">${totalBudget.toLocaleString()}</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-xs text-white/50">Total Spent</p>
          <p className="text-2xl font-bold text-amber-400">${totalSpent.toLocaleString()}</p>
        </GlassCard>
      </div>

      <h3 className="mb-4 font-semibold text-white">Department Wallets</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {company.wallets.map((w) => {
          const pct = w.budget > 0 ? (w.spent / w.budget) * 100 : 0
          return (
            <GlassCard key={w.id} className="p-5">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${w.color}20` }}
                >
                  <Wallet className="h-5 w-5" style={{ color: w.color }} />
                </div>
                <div>
                  <h4 className="font-medium text-white">{w.name}</h4>
                  <p className="text-xs text-white/50">${w.balance.toLocaleString()} balance</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-white/40">Budget</p>
                  <p className="font-medium text-white">${w.budget.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-white/40">Spent</p>
                  <p className="font-medium text-amber-400">${w.spent.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-white/40">Remaining</p>
                  <p className="font-medium text-green-400">${(w.budget - w.spent).toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: w.color }}
                />
              </div>
            </GlassCard>
          )
        })}
      </div>

      <h3 className="mb-4 mt-8 font-semibold text-white">Spend Requests</h3>
      <div className="space-y-3">
        {company.spendRequests.map((req) => (
          <GlassCard key={req.id} className="flex items-center gap-4 p-4">
            <div className="flex-1">
              <h4 className="font-medium text-white">{req.title}</h4>
              <p className="text-sm text-white/50">{req.description}</p>
              <p className="mt-1 text-xs text-white/40">{req.department}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-white">${req.amount.toLocaleString()}</p>
              <div className="mt-1 flex items-center justify-end gap-1.5">
                <StatusDot status={req.status} />
                <span
                  className={cn(
                    'text-xs capitalize',
                    req.status === 'pending' ? 'text-amber-400' : 'text-green-400'
                  )}
                >
                  {req.status === 'pending' ? 'Awaiting Approval' : req.status}
                </span>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {treasuryApprovals.filter((a) => a.status === 'pending').length > 0 && (
        <div className="mt-8">
          <h3 className="mb-4 font-semibold text-white">Treasury Approvals</h3>
          <div className="space-y-3">
            {treasuryApprovals
              .filter((a) => a.status === 'pending')
              .map((a) => (
                <ApprovalCard key={a.id} request={a} />
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
