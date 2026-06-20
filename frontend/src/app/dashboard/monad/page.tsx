'use client'

import { useFounderOS } from '@/lib/founderos/context'
import { GlassCard } from '@/components/founderos/GlassCard'
import { PageHeader } from '@/components/founderos/PageHeader'
import { Hexagon, Copy, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

const ledgerItems = [
  { title: 'Company Passport', desc: 'On-chain identity and incorporation record', hash: '0x3f8a...2b1c' },
  { title: 'Company Wallet', desc: 'Primary treasury wallet on Monad', hash: '0x7d2e...9f4a' },
  { title: 'Agent Wallets', desc: '12 department agent wallets deployed', hash: '0x1c5b...8e3d' },
  { title: 'Treasury Contracts', desc: 'Multi-sig spend approval contracts', hash: '0x9a4f...6c2b' },
  { title: 'Governance Contracts', desc: 'Board voting and decision recording', hash: '0x5e8d...1a7f' },
  { title: 'Decision Ledger', desc: 'Immutable record of all company decisions', hash: '0x2b6c...4d9e' },
  { title: 'Company Memory Ledger', desc: 'Institutional knowledge on-chain', hash: '0x8f1a...3e5c' },
  { title: 'Reputation Ledger', desc: 'Agent reputation scores and history', hash: '0x4d7b...7f2a' },
]

export default function MonadPage() {
  const { company } = useFounderOS()

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash)
    toast.success('Hash copied')
  }

  return (
    <div>
      <PageHeader
        title="Monad Trust Layer"
        description="On-chain governance, treasury, and company memory"
      />

      <GlassCard glow className="mb-8 border-indigo-500/30 p-6">
        <div className="flex items-center gap-3">
          <Hexagon className="h-8 w-8 text-indigo-400" />
          <div>
            <h3 className="font-display text-xl font-bold text-white">Monad Network</h3>
            <p className="text-sm text-white/50">
              All company decisions, approvals, and treasury actions recorded on-chain
            </p>
          </div>
        </div>
      </GlassCard>

      <h3 className="mb-4 font-semibold text-white">On-Chain Assets</h3>
      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        {ledgerItems.map((item) => (
          <GlassCard key={item.title} hover className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-white">{item.title}</h4>
                <p className="mt-1 text-xs text-white/50">{item.desc}</p>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 text-white/30" />
            </div>
            <button
              onClick={() => copyHash(item.hash)}
              className="mt-3 flex items-center gap-2 font-mono text-xs text-indigo-400 hover:text-indigo-300"
            >
              {item.hash}
              <Copy className="h-3 w-3" />
            </button>
          </GlassCard>
        ))}
      </div>

      <h3 className="mb-4 font-semibold text-white">Recent On-Chain Activity</h3>
      <div className="space-y-2">
        {company.monadActivities.map((activity) => (
          <GlassCard key={activity.id} className="flex items-center gap-4 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20">
              <Hexagon className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{activity.type}</p>
              <p className="text-xs text-white/50">{activity.description}</p>
            </div>
            <div className="text-right">
              <button
                onClick={() => copyHash(activity.hash)}
                className="font-mono text-xs text-indigo-400 hover:text-indigo-300"
              >
                {activity.hash}
              </button>
              <p className="mt-1 text-[10px] text-white/30">{activity.timestamp}</p>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
